import {
  CRISIS_MESSAGE,
  CRISIS_RESOURCES,
  CoachRequestSchema,
  DailyRequestSchema,
  SummarizeRequestSchema,
  ToughDayRequestSchema,
  type RiskLevel,
  type SupportContext,
  type SupportResponse,
} from '@stay-clean/shared';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import type { z } from 'zod';
import { issueToken, verifyToken } from './auth';
import { createAnthropicLlm, type Llm } from './llm';
import { logEvent, type LogEvent } from './log';
import { buildSystemPrompt, PROMPT_VERSION, SAFE_FALLBACK_MESSAGE, SUMMARIZE_PROMPT, type CoachMode } from './prompts';
import { assessRisk, guardOutput, redact } from './safety';

export interface Env {
  ANTHROPIC_API_KEY: string;
  TOKEN_SECRET: string;
  /** Model for coach replies. Default claude-opus-5-5. */
  CLAUDE_MODEL?: string;
  /** Model for the safety classifier. Defaults to CLAUDE_MODEL. */
  CLASSIFIER_MODEL?: string;
  APP_ENV?: 'development' | 'staging' | 'production';
  /** Cloudflare Rate Limiting bindings (wrangler.jsonc). Optional in local dev. */
  REGISTER_LIMITER?: RateLimit;
  AI_LIMITER?: RateLimit;
}

export interface AppDeps {
  /** Injected in tests. */
  llmFactory?: (env: Env) => Llm;
  now?: () => number;
}

type Vars = { installId: string };
type AppContext = Context<{ Bindings: Env; Variables: Vars }>;

const DEFAULT_MODEL = 'claude-opus-5-5';

function modelFor(env: Env): string {
  return env.CLAUDE_MODEL || DEFAULT_MODEL;
}

export function createApp(deps: AppDeps = {}) {
  const now = deps.now ?? (() => Date.now());
  const llmFor = (env: Env): Llm =>
    deps.llmFactory?.(env) ??
    createAnthropicLlm({
      apiKey: env.ANTHROPIC_API_KEY,
      model: modelFor(env),
      classifierModel: env.CLASSIFIER_MODEL || modelFor(env),
      timeoutMs: 25_000,
    });

  const app = new Hono<{ Bindings: Env; Variables: Vars }>();

  app.use('*', secureHeaders());
  app.use('*', bodyLimit({ maxSize: 64 * 1024, onError: (c) => c.json({ error: 'too_large' }, 413) }));

  app.onError((_err, c) => {
    logEvent({ route: c.req.path, status: 500, ms: 0, outcome: 'error' });
    return c.json({ error: 'server_error' }, 500);
  });

  app.notFound((c) => c.json({ error: 'not_found' }, 404));

  app.get('/v1/health', (c) => c.json({ ok: true }));

  app.post('/v1/register', async (c) => {
    const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
    if (c.env.REGISTER_LIMITER && !(await c.env.REGISTER_LIMITER.limit({ key: ip })).success) {
      return c.json({ error: 'rate_limited' }, 429);
    }
    // TODO(release): verify an iOS App Attest / Android Play Integrity token here before issuing.
    const { token, expiresAt } = await issueToken(c.env.TOKEN_SECRET, Math.floor(now() / 1000));
    return c.json({ token, expiresAt });
  });

  app.use('/v1/support/*', async (c, next) => {
    const auth = c.req.header('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const installId = token ? await verifyToken(c.env.TOKEN_SECRET, token, Math.floor(now() / 1000)) : null;
    if (!installId) return c.json({ error: 'unauthorized' }, 401);
    if (c.env.AI_LIMITER && !(await c.env.AI_LIMITER.limit({ key: installId })).success) {
      return c.json({ error: 'rate_limited' }, 429);
    }
    c.set('installId', installId);
    await next();
  });

  async function parseBody<S extends z.ZodType>(c: AppContext, schema: S): Promise<z.infer<S> | null> {
    const json: unknown = await c.req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    return parsed.success ? parsed.data : null;
  }

  function crisisResponse(): SupportResponse {
    return { crisis: true, message: CRISIS_MESSAGE, resources: CRISIS_RESOURCES.US };
  }

  async function support(c: AppContext, mode: CoachMode, ctx: SupportContext, userText: string, riskText: string, maxTokens: number) {
    const started = now();
    const log = (status: number, extra: Partial<LogEvent>) =>
      logEvent({ route: c.req.path, status, ms: now() - started, model: modelFor(c.env), promptVersion: PROMPT_VERSION, ...extra });

    const llm = llmFor(c.env);
    let risk: RiskLevel = 'none';
    if (riskText.trim()) {
      risk = await assessRisk(llm, riskText);
      if (risk === 'imminent') {
        log(200, { risk, outcome: 'crisis' });
        return c.json(crisisResponse());
      }
    }

    let reply: string | null = null;
    try {
      reply = await llm.generate(buildSystemPrompt(ctx, mode, risk), redact(userText), maxTokens);
    } catch {
      reply = null;
    }
    const guarded = reply ? guardOutput(reply) : null;
    const body: SupportResponse = guarded
      ? { crisis: false, message: guarded }
      : { crisis: false, message: SAFE_FALLBACK_MESSAGE, ...(risk !== 'none' ? { resources: CRISIS_RESOURCES.US } : {}) };
    if (guarded && risk === 'elevated') body.resources = CRISIS_RESOURCES.US;
    log(200, { risk, outcome: guarded ? 'ok' : 'fallback' });
    return c.json(body);
  }

  app.post('/v1/support/coach', async (c) => {
    const body = await parseBody(c, CoachRequestSchema);
    if (!body) return c.json({ error: 'invalid_request' }, 400);
    return support(c, 'coach', body, body.entry, body.entry, 4000);
  });

  app.post('/v1/support/tough-day', async (c) => {
    const body = await parseBody(c, ToughDayRequestSchema);
    if (!body) return c.json({ error: 'invalid_request' }, 400);
    const userText = body.note ? `I'm having a tough day. ${body.note}` : "I'm having a tough day and pressed the button for help.";
    return support(c, 'tough_day', body, userText, body.note ?? '', 4000);
  });

  app.post('/v1/support/daily', async (c) => {
    const body = await parseBody(c, DailyRequestSchema);
    if (!body) return c.json({ error: 'invalid_request' }, 400);
    return support(c, 'daily', body, 'Please write my message for today.', '', 2000);
  });

  app.post('/v1/support/summarize', async (c) => {
    const body = await parseBody(c, SummarizeRequestSchema);
    if (!body) return c.json({ error: 'invalid_request' }, 400);
    const started = now();
    const joined = body.entries.map((e, i) => `Entry ${i + 1}:\n${redact(e)}`).join('\n\n');
    let summary: string | null = null;
    try {
      summary = await llmFor(c.env).generate(SUMMARIZE_PROMPT, joined, 3000);
    } catch {
      summary = null;
    }
    logEvent({ route: c.req.path, status: summary ? 200 : 502, ms: now() - started, model: modelFor(c.env), outcome: summary ? 'ok' : 'error' });
    if (!summary) return c.json({ error: 'unavailable' }, 502);
    return c.json({ summary: summary.slice(0, 1200) });
  });

  return app;
}

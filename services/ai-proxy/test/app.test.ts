import type { RiskLevel } from '@stay-clean/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, type Env } from '../src/app';
import { issueToken, verifyToken } from '../src/auth';
import type { Llm } from '../src/llm';
import { sanitizeLogEvent, type LogEvent } from '../src/log';
import { SAFE_FALLBACK_MESSAGE } from '../src/prompts';
import { guardOutput, redact } from '../src/safety';

const SECRET = 'test-secret';
const env: Env = { ANTHROPIC_API_KEY: 'unused', TOKEN_SECRET: SECRET };

interface FakeLlm extends Llm {
  generateCalls: { system: string; user: string }[];
}

function fakeLlm(opts: { risk?: RiskLevel | Error; reply?: string | null | Error } = {}): FakeLlm {
  const calls: { system: string; user: string }[] = [];
  return {
    generateCalls: calls,
    async classifyRisk() {
      if (opts.risk instanceof Error) throw opts.risk;
      return opts.risk ?? 'none';
    },
    async generate(system, user) {
      calls.push({ system, user });
      if (opts.reply instanceof Error) throw opts.reply;
      return opts.reply === undefined ? 'You are doing something brave by writing this down.' : opts.reply;
    },
  };
}

async function authHeader(): Promise<Record<string, string>> {
  const { token } = await issueToken(SECRET, Math.floor(Date.now() / 1000));
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

const coachBody = { addiction: 'alcohol', daysClean: 12, entry: 'Work was stressful and I wanted a drink.' };

async function post(llm: Llm, path: string, body: unknown, headers?: Record<string, string>) {
  const app = createApp({ llmFactory: () => llm });
  return app.request(path, { method: 'POST', body: JSON.stringify(body), headers: headers ?? (await authHeader()) }, env);
}

let logSpy: { mock: { calls: unknown[][] }; mockRestore: () => void };
beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

describe('auth', () => {
  it('rejects requests without a token', async () => {
    const res = await post(fakeLlm(), '/v1/support/coach', coachBody, { 'content-type': 'application/json' });
    expect(res.status).toBe(401);
  });

  it('rejects tampered and expired tokens', async () => {
    const { token } = await issueToken(SECRET, 1000);
    expect(await verifyToken(SECRET, token, 1001)).not.toBeNull();
    expect(await verifyToken(SECRET, token, 1000 + 2 * 86400)).toBeNull();
    expect(await verifyToken('other-secret', token, 1001)).toBeNull();
    expect(await verifyToken(SECRET, `${token}x`, 1001)).toBeNull();
  });

  it('issues a token from /v1/register', async () => {
    const app = createApp({ llmFactory: () => fakeLlm() });
    const res = await app.request('/v1/register', { method: 'POST' }, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { token: string };
    expect(await verifyToken(SECRET, json.token, Math.floor(Date.now() / 1000))).not.toBeNull();
  });
});

describe('validation', () => {
  it('rejects malformed bodies', async () => {
    const res = await post(fakeLlm(), '/v1/support/coach', { addiction: 'wine', daysClean: -1, entry: '' });
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    const res = await post(fakeLlm(), '/v1/support/coach', { ...coachBody, entry: 'x'.repeat(70_000) });
    expect(res.status).toBe(413);
  });
});

describe('coach', () => {
  it('returns the model reply and wraps the entry as shared text', async () => {
    const llm = fakeLlm();
    const res = await post(llm, '/v1/support/coach', coachBody);
    const json = (await res.json()) as { crisis: boolean; message: string };
    expect(json).toEqual({ crisis: false, message: 'You are doing something brave by writing this down.' });
    expect(llm.generateCalls[0]?.system).toContain('day 12');
    expect(llm.generateCalls[0]?.system).toContain('alcohol');
  });

  it('short-circuits to crisis help on imminent risk from the keyword screen', async () => {
    const llm = fakeLlm();
    const res = await post(llm, '/v1/support/coach', { ...coachBody, entry: 'I took too many pills tonight' });
    const json = (await res.json()) as { crisis: boolean; resources: unknown[] };
    expect(json.crisis).toBe(true);
    expect(json.resources.length).toBeGreaterThan(0);
    expect(llm.generateCalls).toHaveLength(0);
  });

  it('short-circuits to crisis help when the classifier says imminent', async () => {
    const llm = fakeLlm({ risk: 'imminent' });
    const res = await post(llm, '/v1/support/coach', { ...coachBody, entry: 'I have everything ready for tonight' });
    expect(((await res.json()) as { crisis: boolean }).crisis).toBe(true);
    expect(llm.generateCalls).toHaveLength(0);
  });

  it('fails safe when the classifier errors: treats as elevated and adds crisis lines', async () => {
    const llm = fakeLlm({ risk: new Error('timeout') });
    const res = await post(llm, '/v1/support/coach', coachBody);
    const json = (await res.json()) as { crisis: boolean; resources?: unknown[] };
    expect(json.crisis).toBe(false);
    expect(json.resources?.length).toBeGreaterThan(0);
    expect(llm.generateCalls[0]?.system).toContain('signs of distress');
  });

  it('returns the safe fallback when the model declines or fails', async () => {
    for (const reply of [null, new Error('down')]) {
      const res = await post(fakeLlm({ reply }), '/v1/support/coach', coachBody);
      expect(((await res.json()) as { message: string }).message).toBe(SAFE_FALLBACK_MESSAGE);
    }
  });

  it('replaces replies that contain dosing advice', async () => {
    const res = await post(fakeLlm({ reply: 'Try tapering off with 5 mg a day.' }), '/v1/support/coach', coachBody);
    expect(((await res.json()) as { message: string }).message).toBe(SAFE_FALLBACK_MESSAGE);
  });

  it('redacts contact details before calling the model', async () => {
    const llm = fakeLlm();
    await post(llm, '/v1/support/coach', { ...coachBody, entry: 'Call me at 555-123-4567 or me@example.com' });
    expect(llm.generateCalls[0]?.user).not.toContain('555-123-4567');
    expect(llm.generateCalls[0]?.user).not.toContain('me@example.com');
  });
});

describe('other endpoints', () => {
  it('serves tough-day and daily', async () => {
    for (const path of ['/v1/support/tough-day', '/v1/support/daily']) {
      const res = await post(fakeLlm(), path, { addiction: 'gambling', daysClean: 3 });
      expect(res.status).toBe(200);
    }
  });

  it('summarizes entries', async () => {
    const res = await post(fakeLlm({ reply: 'They want to be present for their daughter.' }), '/v1/support/summarize', {
      addiction: 'alcohol',
      entries: ['I want to be there for my daughter.'],
    });
    expect(await res.json()).toEqual({ summary: 'They want to be present for their daughter.' });
  });
});

describe('privacy', () => {
  it('never logs request or reply text', async () => {
    const secret = 'my private confession about last night';
    await post(fakeLlm({ reply: `echo ${secret}` }), '/v1/support/coach', { ...coachBody, entry: secret });
    const logged = logSpy.mock.calls.map((args: unknown[]) => String(args[0])).join('\n');
    expect(logged).not.toContain('private confession');
    expect(logged).toContain('"route":"/v1/support/coach"');
  });

  it('drops unknown log fields', () => {
    const event = { route: '/x', status: 200, ms: 1, entry: 'secret' } as unknown as LogEvent;
    expect(sanitizeLogEvent(event)).toEqual({ route: '/x', status: 200, ms: 1 });
  });
});

describe('helpers', () => {
  it('guards output length at a sentence boundary', () => {
    const long = 'This is a sentence. '.repeat(200);
    const out = guardOutput(long);
    expect(out && out.length).toBeLessThanOrEqual(1600);
    expect(out?.endsWith('.')).toBe(true);
  });

  it('redacts emails and phone numbers', () => {
    expect(redact('mail a@b.co or +1 (555) 123-4567')).toBe('mail [email] or [phone]');
  });
});

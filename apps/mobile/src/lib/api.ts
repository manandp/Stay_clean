import Constants from 'expo-constants';
import {
  RegisterResponseSchema,
  SummarizeResponseSchema,
  SupportResponseSchema,
  type CoachRequest,
  type DailyRequest,
  type SummarizeRequest,
  type SupportResponse,
  type ToughDayRequest,
} from '@stay-clean/shared';
import type { z } from 'zod';
import { getSetting, setSetting } from './db';

/**
 * Client for the Stay Clean AI server. The app never holds an AI API key; it
 * holds only a short-lived install token. Nothing here logs request content.
 */

const BASE_URL: string = (Constants.expoConfig?.extra?.aiProxyUrl as string | undefined) ?? 'http://localhost:8787';
const TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(
    public readonly kind: 'offline' | 'rate_limited' | 'unavailable' | 'invalid',
    message: string,
  ) {
    super(message);
  }
}

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch {
    throw new ApiError('offline', 'Could not reach the server');
  } finally {
    clearTimeout(timer);
  }
}

async function getToken(forceNew = false): Promise<string> {
  if (!forceNew) {
    const raw = await getSetting('apiToken');
    if (raw) {
      const saved = JSON.parse(raw) as { token: string; expiresAt: number };
      if (saved.expiresAt - 300 > Date.now() / 1000) return saved.token;
    }
  }
  const res = await fetchWithTimeout('/v1/register', { method: 'POST' });
  if (res.status === 429) throw new ApiError('rate_limited', 'Too many requests');
  if (!res.ok) throw new ApiError('unavailable', `Register failed (${res.status})`);
  const parsed = RegisterResponseSchema.parse(await res.json());
  await setSetting('apiToken', JSON.stringify(parsed));
  return parsed.token;
}

async function post<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.infer<S>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = await getToken(attempt > 0);
    const res = await fetchWithTimeout(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.status === 401) continue; // token expired or rotated: get a new one
    if (res.status === 429) throw new ApiError('rate_limited', 'Too many requests');
    if (res.status === 400 || res.status === 413) throw new ApiError('invalid', `Rejected (${res.status})`);
    if (res.status >= 500) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      throw new ApiError('unavailable', `Server error (${res.status})`);
    }
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new ApiError('unavailable', 'Unexpected response');
    return parsed.data;
  }
  throw new ApiError('unavailable', 'Could not authenticate');
}

export const api = {
  coach: (body: CoachRequest): Promise<SupportResponse> => post('/v1/support/coach', body, SupportResponseSchema),
  toughDay: (body: ToughDayRequest): Promise<SupportResponse> => post('/v1/support/tough-day', body, SupportResponseSchema),
  daily: (body: DailyRequest): Promise<SupportResponse> => post('/v1/support/daily', body, SupportResponseSchema),
  summarize: (body: SummarizeRequest) => post('/v1/support/summarize', body, SummarizeResponseSchema),
};

/**
 * The only logger the proxy uses. It accepts a fixed set of metadata fields so
 * journal text, replies or anything personal can never be logged by accident.
 */
export interface LogEvent {
  route: string;
  status: number;
  ms: number;
  model?: string;
  promptVersion?: string;
  risk?: 'none' | 'elevated' | 'imminent';
  outcome?: 'ok' | 'crisis' | 'fallback' | 'rejected' | 'error';
}

const ALLOWED_KEYS = new Set<keyof LogEvent>(['route', 'status', 'ms', 'model', 'promptVersion', 'risk', 'outcome']);

export function sanitizeLogEvent(event: LogEvent): LogEvent {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(event)) {
    if (!ALLOWED_KEYS.has(key as keyof LogEvent)) continue;
    if (typeof value === 'string' && value.length > 64) continue;
    out[key] = value;
  }
  return out as unknown as LogEvent;
}

export function logEvent(event: LogEvent): void {
  console.log(JSON.stringify(sanitizeLogEvent(event)));
}

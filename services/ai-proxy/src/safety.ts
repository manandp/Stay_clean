import { maxRisk, screenForRisk, type RiskLevel } from '@stay-clean/shared';
import type { Llm } from './llm';

/**
 * Keyword screen first (fast, no network), then the model classifier.
 * If the classifier fails for any reason we treat the message as elevated,
 * never as safe.
 */
export async function assessRisk(llm: Llm, text: string): Promise<RiskLevel> {
  const screened = screenForRisk(text);
  if (screened === 'imminent') return 'imminent';
  try {
    return maxRisk(screened, await llm.classifyRisk(text));
  } catch {
    return maxRisk(screened, 'elevated');
  }
}

const DISALLOWED_OUTPUT: RegExp[] = [
  /\b\d+(\.\d+)?\s?(mg|mcg|µg|milligrams?|ml|milliliters?|units)\b/i,
  /\btaper(ing)?\s+(schedule|plan|off|down)\b/i,
  /\b(safe|safer|safest)\s+(dose|dosage|amount)\b/i,
  /\b(how to|ways to)\s+(use|drink|gamble|bet)\s+(safely|responsibly)\b/i,
  /\byou (are|have) (an? )?(alcoholic|addict|disorder)\b/i,
];

export const MAX_REPLY_CHARS = 1600;

/** Returns the reply if it passes the output checks, otherwise null. */
export function guardOutput(reply: string): string | null {
  if (DISALLOWED_OUTPUT.some((re) => re.test(reply))) return null;
  if (reply.length <= MAX_REPLY_CHARS) return reply;
  const cut = reply.slice(0, MAX_REPLY_CHARS);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return lastStop > 200 ? cut.slice(0, lastStop + 1) : cut;
}

/** Remove emails and phone numbers before text leaves our server. */
export function redact(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[phone]');
}

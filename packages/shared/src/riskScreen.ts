import type { RiskLevel } from './schemas';

/**
 * Fast keyword screen for signs of danger. It runs on the phone (so crisis help
 * appears even offline) and on the server before any model call. It is
 * deliberately cautious: a false alarm shows crisis resources, a miss could
 * cost a life. The server also runs a model-based classifier.
 */

const IMMINENT: RegExp[] = [
  /\b(kill|end|hang|shoot|drown)\s+(myself|my\s*self|my\s+life)\b/i,
  /\bsuicid(e|al)\b.*\b(tonight|now|today|plan|going to|gonna)\b/i,
  /\b(going to|gonna|want to|wanna|about to|plan to)\s+(die|kill myself|end it( all)?|end my life)\b/i,
  /\bi('?m| am)\s+going\s+to\s+(overdose|od)\b/i,
  /\b(took|taken|swallowed|used)\s+(too much|too many|a lot of|way too much|all (my|the) (pills|meds))\b/i,
  /\b(overdos(e|ing|ed)|od'?(ing|ed)?)\b.*\b(now|right now|think i|i think|help)\b/i,
  /\bcan'?t\s+(breathe|stay awake|feel my)\b/i,
  /\b(kill|hurt|harm)\s+(him|her|them|someone|somebody|my (wife|husband|partner|kid|kids|child|children|son|daughter|mom|dad))\b/i,
  /\bgoodbye\s+(everyone|forever|world)\b/i,
];

const ELEVATED: RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\b(self[-\s]?harm|cutting myself|cut myself|hurt myself|harm myself)\b/i,
  /\b(want(ed)? to die|wish i (was|were) dead|better off dead|don'?t want to (live|be here|wake up))\b/i,
  /\b(no (reason|point) (to|in) (live|living|going on)|can'?t go on|end it all)\b/i,
  /\b(hopeless|worthless|nothing left|no way out)\b/i,
  /\b(overdos(e|ed|ing))\b/i,
  /\b(seizure|shaking uncontrollably|hallucinat)/i,
];

export function screenForRisk(text: string): RiskLevel {
  if (IMMINENT.some((re) => re.test(text))) return 'imminent';
  if (ELEVATED.some((re) => re.test(text))) return 'elevated';
  return 'none';
}

export function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ['none', 'elevated', 'imminent'];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? 'elevated';
}

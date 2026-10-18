import type { CrisisResource } from '../schemas';

/**
 * Crisis lines bundled into the app so they work offline. US first; other
 * countries fall back to the international list until localized.
 */
export const CRISIS_RESOURCES: Record<'US' | 'INTL', CrisisResource[]> = {
  US: [
    {
      name: '988 Suicide & Crisis Lifeline',
      detail: 'Call or text 988, free and confidential, 24/7',
      phone: '988',
      sms: '988',
    },
    {
      name: 'Crisis Text Line',
      detail: 'Text HOME to 741741',
      sms: '741741',
    },
    {
      name: 'SAMHSA National Helpline',
      detail: 'Treatment referral and support, 24/7',
      phone: '18006624357',
    },
    {
      name: 'Emergency services',
      detail: 'Call 911 if you or someone else is in danger or may have overdosed',
      phone: '911',
    },
  ],
  INTL: [
    {
      name: 'Emergency services',
      detail: 'Call your local emergency number if you are in danger',
    },
    {
      name: 'Find a Helpline',
      detail: 'Free, confidential crisis lines in your country',
      url: 'https://findahelpline.com',
    },
  ],
};

export function crisisResourcesFor(regionCode: string | null | undefined): CrisisResource[] {
  return regionCode === 'US' ? CRISIS_RESOURCES.US : CRISIS_RESOURCES.INTL;
}

/** Shown when the AI server detects immediate danger. Fixed text, never model-generated. */
export const CRISIS_MESSAGE =
  "It sounds like you're going through something really serious right now, and you deserve support from a real person immediately. " +
  'Please call or text 988 now, or call 911 if you are in danger or may have taken too much. ' +
  "You reached out, and that matters. You don't have to get through this alone.";

import type { AddictionType, DrugSubstance } from '../schemas';

/**
 * Recovery content shown in the app and given to the AI coach as background.
 * Every claim, phone number and link here must be reviewed by a qualified
 * person before release (see CONTENT_REVIEW.md).
 */

export type ResourceKind = 'helpline' | 'meeting' | 'treatment' | 'reading' | 'text-line';

export interface Resource {
  name: string;
  description: string;
  kind: ResourceKind;
  /** Digits only, dialable with tel: */
  phone?: string;
  /** SMS number and optional body, for sms: links */
  sms?: { to: string; body?: string };
  url?: string;
}

export interface CopingTool {
  id: string;
  title: string;
  steps: string;
}

export interface AddictionContent {
  type: AddictionType;
  label: string;
  /** Lower-case phrase used in sentences, e.g. "alcohol-free". */
  freePhrase: string;
  shortDescription: string;
  overview: string;
  safetyWarning?: string;
  nextSteps: string[];
  resources: Resource[];
  aiContext: string;
}

const SAMHSA: Resource = {
  name: 'SAMHSA National Helpline',
  description: 'Free, confidential, 24/7 treatment referral and information',
  kind: 'helpline',
  phone: '18006624357',
};

const FIND_TREATMENT: Resource = {
  name: 'FindTreatment.gov',
  description: 'Search licensed treatment programs near you',
  kind: 'treatment',
  url: 'https://findtreatment.gov',
};

const SMART: Resource = {
  name: 'SMART Recovery',
  description: 'Science-based meetings, in person and online, a non-12-step option',
  kind: 'meeting',
  url: 'https://smartrecovery.org',
};

const THERAPIST_FINDER: Resource = {
  name: 'Find a therapist',
  description: 'Psychology Today directory, filter by addiction specialty',
  kind: 'treatment',
  url: 'https://www.psychologytoday.com/us/therapists',
};

export const COPING_TOOLS: CopingTool[] = [
  {
    id: 'breathing',
    title: '4-7-8 breathing',
    steps: 'Breathe in through your nose for 4 seconds, hold for 7, breathe out slowly for 8. Repeat four times.',
  },
  {
    id: 'urge-surfing',
    title: 'Surf the urge',
    steps:
      'Notice where you feel the craving in your body. Rate it 1 to 10. Watch it like a wave: it rises, peaks and falls, usually within 15 to 30 minutes.',
  },
  {
    id: 'halt',
    title: 'HALT check',
    steps: 'Ask yourself: am I Hungry, Angry, Lonely or Tired? Take care of that need first.',
  },
  {
    id: 'play-tape',
    title: 'Play the tape forward',
    steps: 'Picture the next hour, tonight and tomorrow morning if you give in. Then picture them if you don\'t.',
  },
  {
    id: 'delay',
    title: 'Wait 15 minutes',
    steps: 'Tell yourself you only have to wait 15 minutes. Set a timer, change rooms, drink water, move your body.',
  },
  {
    id: 'reach-out',
    title: 'Reach out',
    steps: 'Text or call someone in your corner. You don\'t have to explain everything: "Having a rough moment" is enough.',
  },
];

export const ADDICTIONS: Record<AddictionType, AddictionContent> = {
  alcohol: {
    type: 'alcohol',
    label: 'Alcohol',
    freePhrase: 'alcohol-free',
    shortDescription: 'Drinking',
    overview:
      'Cutting back or quitting alcohol is one of the most common recovery journeys, and there is a lot of support available, from meetings to medical help.',
    safetyWarning:
      'Talk to a doctor before quitting cold. After heavy daily drinking, stopping suddenly can cause dangerous withdrawal, including seizures. A doctor or the SAMHSA helpline can help you quit safely.',
    nextSteps: [
      'Tell one person you trust',
      'Talk to a doctor about quitting safely',
      'Clear alcohol out of your home',
      'Go to your first meeting',
      'Write your plan for cravings',
      'Plan alcohol-free evenings and weekends',
    ],
    resources: [
      SAMHSA,
      {
        name: 'Find an AA meeting',
        description: 'Alcoholics Anonymous, in person or online',
        kind: 'meeting',
        url: 'https://www.aa.org/find-aa',
      },
      SMART,
      FIND_TREATMENT,
      {
        name: 'Rethinking Drinking',
        description: 'Tools and facts from the National Institute on Alcohol Abuse and Alcoholism',
        kind: 'reading',
        url: 'https://www.rethinkingdrinking.niaaa.nih.gov',
      },
      {
        name: 'Al-Anon',
        description: 'Support for family and friends',
        kind: 'meeting',
        url: 'https://al-anon.org',
      },
    ],
    aiContext:
      'Common triggers: evenings and weekends, stress, social events, boredom, loneliness, and habits tied to places and people. Helpful approaches: mutual-help groups (AA, SMART), CBT skills, planning alcohol-free routines, and medical support. Medications exist but are a doctor\'s decision. Withdrawal after heavy use can be medically dangerous.',
  },
  drugs: {
    type: 'drugs',
    label: 'Drugs',
    freePhrase: 'drug-free',
    shortDescription: 'Opioids, stimulants, pills',
    overview:
      'Recovery from drug use is very possible, and treatment works. Medical support, counseling and peer groups all help, and many people use more than one.',
    safetyWarning:
      'Don\'t go through withdrawal alone. Stopping opioids, benzodiazepines or other sedatives can be dangerous without medical help. After a break, your tolerance drops and the risk of overdose rises, so keep naloxone (Narcan) nearby.',
    nextSteps: [
      'Tell one person you trust',
      'Call the SAMHSA helpline or a doctor about safe detox',
      'Get naloxone (Narcan) and tell someone where it is',
      'Remove supplies and delete dealer contacts',
      'Find an NA or SMART Recovery meeting',
      'Write your plan for cravings',
    ],
    resources: [
      SAMHSA,
      FIND_TREATMENT,
      {
        name: 'Narcotics Anonymous',
        description: 'Find NA meetings near you or online',
        kind: 'meeting',
        url: 'https://na.org/meetingsearch',
      },
      SMART,
      {
        name: 'Never Use Alone',
        description: 'If you do use, this line stays on with you and sends help if you stop responding',
        kind: 'helpline',
        phone: '18004843731',
      },
    ],
    aiContext:
      'Common triggers: withdrawal discomfort, stress, people and places linked to use, pain, sleep problems, and emotional distress. Helpful approaches: medically supervised detox, medications for opioid use disorder prescribed by a clinician, counseling, NA or SMART meetings, and harm reduction such as carrying naloxone. Overdose risk rises after a period of not using because tolerance drops.',
  },
  cannabis: {
    type: 'cannabis',
    label: 'Cannabis',
    freePhrase: 'cannabis-free',
    shortDescription: 'Weed, edibles, vapes',
    overview:
      'Quitting cannabis can bring a few rough weeks of poor sleep, irritability and vivid dreams. These ease with time, and support makes it easier.',
    nextSteps: [
      'Tell one person you trust',
      'Get rid of your supply and gear',
      'Plan for sleep: a wind-down routine for the first weeks',
      'Find a Marijuana Anonymous or SMART meeting',
      'Write your plan for cravings',
    ],
    resources: [
      SAMHSA,
      {
        name: 'Marijuana Anonymous',
        description: 'Meetings in person and online',
        kind: 'meeting',
        url: 'https://marijuana-anonymous.org',
      },
      SMART,
      FIND_TREATMENT,
    ],
    aiContext:
      'Common triggers: boredom, evenings, stress, trouble sleeping, and friends who use. Withdrawal often brings irritability, low appetite, poor sleep and vivid dreams for one to a few weeks. Helpful approaches: CBT skills, routines for sleep and evenings, exercise, Marijuana Anonymous or SMART meetings.',
  },
  pornography: {
    type: 'pornography',
    label: 'Pornography',
    freePhrase: 'porn-free',
    shortDescription: 'Compulsive use',
    overview:
      'Many people struggle with compulsive porn use. Shame tends to make it worse, while honesty, structure and support make it better.',
    nextSteps: [
      'Install a content blocker on your phone and computer',
      'Keep devices out of the bedroom at night',
      'Tell one person you trust, or a counselor',
      'Find a support group or therapist',
      'Write down your triggers and a plan for each one',
    ],
    resources: [
      {
        name: 'Sex Addicts Anonymous',
        description: 'Confidential meetings, in person and online',
        kind: 'meeting',
        url: 'https://saa-recovery.org',
      },
      SMART,
      THERAPIST_FINDER,
    ],
    aiContext:
      'Common triggers: late nights alone, boredom, stress, loneliness, and being in bed with a phone. Helpful approaches: blockers and device boundaries, replacing the habit loop, addressing shame with honesty and self-compassion, support groups, and therapy. Avoid moralizing; focus on the person\'s own goals and values.',
  },
  gambling: {
    type: 'gambling',
    label: 'Gambling',
    freePhrase: 'gambling-free',
    shortDescription: 'Betting, casino, apps',
    overview:
      'Problem gambling responds well to support. Cutting off access to money and betting apps early gives you room to recover.',
    nextSteps: [
      'Call 1-800-GAMBLER to talk to someone',
      'Self-exclude from betting apps and casinos',
      'Hand money control to someone you trust for now',
      'Delete betting apps and block gambling sites',
      'Find a Gamblers Anonymous meeting',
      'Write down your debts and make a plan with a counselor',
    ],
    resources: [
      {
        name: 'National Problem Gambling Helpline',
        description: '1-800-GAMBLER, free and confidential, 24/7',
        kind: 'helpline',
        phone: '18004262537',
      },
      {
        name: 'Gamblers Anonymous',
        description: 'Find meetings near you',
        kind: 'meeting',
        url: 'https://gamblersanonymous.org',
      },
      {
        name: 'National Council on Problem Gambling',
        description: 'Treatment and self-exclusion information',
        kind: 'reading',
        url: 'https://www.ncpgambling.org',
      },
      {
        name: 'Gam-Anon',
        description: 'Support for family and friends',
        kind: 'meeting',
        url: 'https://gam-anon.org',
      },
    ],
    aiContext:
      'Common triggers: payday, sports events, ads, boredom, stress, and chasing losses. Debt and secrecy add pressure and shame. Helpful approaches: self-exclusion, blocking apps and limiting access to money, Gamblers Anonymous, counseling, and financial counseling. Problem gambling carries a raised risk of suicidal thoughts, so watch for hopelessness about debt.',
  },
  nicotine: {
    type: 'nicotine',
    label: 'Nicotine',
    freePhrase: 'nicotine-free',
    shortDescription: 'Smoking, vaping',
    overview:
      'Most people take a few tries to quit nicotine for good. Cravings are strongest in the first few weeks, and quit-smoking medicines and coaching roughly double your chances.',
    nextSteps: [
      'Pick your quit day',
      'Call 1-800-QUIT-NOW for free coaching',
      'Ask a doctor or pharmacist about nicotine replacement',
      'Get rid of cigarettes, vapes and lighters',
      'Plan what you\'ll do instead at your usual smoke times',
    ],
    resources: [
      {
        name: '1-800-QUIT-NOW',
        description: 'Free quit coaching in every US state',
        kind: 'helpline',
        phone: '18007848669',
      },
      {
        name: 'Smokefree.gov',
        description: 'Quit plans, apps and text programs',
        kind: 'reading',
        url: 'https://smokefree.gov',
      },
      {
        name: 'SmokefreeTXT',
        description: 'Text QUIT to 47848 for daily tips',
        kind: 'text-line',
        sms: { to: '47848', body: 'QUIT' },
      },
      {
        name: 'This is Quitting (vaping)',
        description: 'Text DITCHVAPE to 88709',
        kind: 'text-line',
        sms: { to: '88709', body: 'DITCHVAPE' },
      },
    ],
    aiContext:
      'Common triggers: coffee, after meals, driving, alcohol, stress, and breaks at work. Cravings usually last a few minutes and fade over the first weeks. Helpful approaches: nicotine replacement or other quit medicines (a doctor or pharmacist decides), quitline coaching, changing routines, and delaying through each craving.',
  },
  gaming_social: {
    type: 'gaming_social',
    label: 'Gaming & social',
    freePhrase: 'free of compulsive screen use',
    shortDescription: 'Screens, scrolling',
    overview:
      'Games and social apps are built to keep you hooked, so struggling with them is not a personal failing. Clear limits and real-world replacements help.',
    nextSteps: [
      'Turn on screen time limits or app blockers',
      'Delete or log out of the hardest apps',
      'Keep your phone out of the bedroom',
      'Plan offline activities for your usual screen times',
      'Find a support group like CGAA or ITAA',
    ],
    resources: [
      {
        name: 'Computer Gaming Addicts Anonymous',
        description: 'Online and in-person meetings',
        kind: 'meeting',
        url: 'https://cgaa.info',
      },
      {
        name: 'Internet & Technology Addicts Anonymous',
        description: 'Meetings for compulsive internet and phone use',
        kind: 'meeting',
        url: 'https://internetaddictsanonymous.org',
      },
      THERAPIST_FINDER,
    ],
    aiContext:
      'Common triggers: boredom, avoiding stress or tasks, late nights, loneliness, and notifications. Helpful approaches: app limits and blockers, phone-free bedrooms, replacing screen time with social and physical activities, and support groups such as CGAA or ITAA.',
  },
  other: {
    type: 'other',
    label: 'Something else',
    freePhrase: 'clean',
    shortDescription: 'Name it yourself',
    overview:
      'Whatever you\'re working on, the same things help most: honesty with someone you trust, a plan for hard moments, and support.',
    nextSteps: [
      'Tell one person you trust',
      'Talk to a doctor or counselor',
      'Write down your triggers',
      'Find a support group',
      'Write your plan for cravings',
    ],
    resources: [SAMHSA, SMART, THERAPIST_FINDER, FIND_TREATMENT],
    aiContext:
      'The person named their own habit or addiction. Use general, evidence-based recovery approaches: identifying triggers, CBT skills, support groups, professional help, and self-compassion after slips.',
  },
};

export const SUBSTANCE_LABELS: Record<DrugSubstance, string> = {
  opioids: 'Opioids',
  stimulants: 'Stimulants',
  benzodiazepines: 'Benzodiazepines',
  other: 'Other drugs',
};

/** A human label for the person's addiction, e.g. "opioids" or their own words. */
export function addictionLabel(type: AddictionType, substance?: DrugSubstance, otherLabel?: string): string {
  if (type === 'drugs' && substance && substance !== 'other') return SUBSTANCE_LABELS[substance].toLowerCase();
  if (type === 'other' && otherLabel) return otherLabel;
  return ADDICTIONS[type].label.toLowerCase();
}

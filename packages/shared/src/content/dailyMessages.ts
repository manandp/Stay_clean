import type { AddictionType } from '../schemas';
import type { RecoveryStage } from '../streak';

export interface DailyMessage {
  id: string;
  text: string;
  /** Stages this fits. Empty means any stage. */
  stages: RecoveryStage[];
  /** Addictions this is written for. Empty means any. */
  addictions: AddictionType[];
}

const any = (id: string, text: string): DailyMessage => ({ id, text, stages: [], addictions: [] });
const stage = (id: string, stages: RecoveryStage[], text: string): DailyMessage => ({ id, text, stages, addictions: [] });
const only = (id: string, addictions: AddictionType[], text: string): DailyMessage => ({ id, text, stages: [], addictions });

/** Original encouraging messages. Add more freely; ids must stay unique and stable. */
export const DAILY_MESSAGES: DailyMessage[] = [
  any('a01', 'You have already made it through difficult days. You can get through today, too.'),
  any('a02', 'You only have to do today. Tomorrow will get its own strength.'),
  any('a03', 'A craving is a wave, not a command. Let it rise, let it pass.'),
  any('a04', 'Progress is quiet. It looks like an ordinary day where you kept your promise to yourself.'),
  any('a05', 'Asking for help is not weakness. It is one of the strongest things a person in recovery can do.'),
  any('a06', 'Be as kind to yourself today as you would be to a friend doing something this hard.'),
  any('a07', 'Every time you choose recovery, it gets a little easier to choose it again.'),
  any('a08', 'You are not your worst day. You are the person who keeps showing up.'),
  any('a09', 'Notice one good thing today that you would have missed before.'),
  any('a10', 'Feelings are visitors. You can let them in without letting them drive.'),
  any('a11', 'Drink some water, eat something real, rest when you can. Your body is healing.'),
  any('a12', 'You do not need to feel motivated to do the next right thing.'),
  any('a13', 'Today, reach out to one person. A short message counts.'),
  any('a14', 'Hard moments end. You have proof: you have survived every one so far.'),
  any('a15', 'Recovery is not a straight line. Keep walking anyway.'),
  any('a16', 'The urge says "now". You can answer "not today".'),
  any('a17', 'Your future self is counting on the choice you make in the next ten minutes.'),
  any('a18', 'Small steps still move you forward.'),
  any('a19', 'Write down why you started. Read it when it gets hard.'),
  any('a20', 'You are building a life you will not want to escape from.'),
  any('a21', 'Rest is part of recovery, not a break from it.'),
  any('a22', 'Today you get to practise being the person you are becoming.'),
  any('a23', 'If today is heavy, make the goal smaller: the next hour, the next meal, the next breath.'),
  any('a24', 'There is no shame in starting over. There is only courage.'),
  any('a25', 'Celebrate the boring wins. They add up to a new life.'),
  any('a26', 'Your worth was never measured by your addiction.'),
  any('a27', 'Move your body for ten minutes today. It is one of the fastest ways to shift a mood.'),
  any('a28', 'You can be proud of yourself and still be working on yourself.'),
  any('a29', 'Honesty with one person can lift a weight you have carried alone for years.'),
  any('a30', 'A slow day in recovery beats a fast day in addiction.'),
  stage('e01', ['early'], 'The first days are the hardest. You are in them right now, and you are doing it.'),
  stage('e02', ['early'], 'Your brain is starting to rewire. The discomfort you feel is change happening.'),
  stage('e03', ['early'], 'Sleep, food and water matter more than ever this week. Be gentle with yourself.'),
  stage('e04', ['early'], 'You do not have to figure out forever. Just today.'),
  stage('e05', ['early'], 'Tell someone you are starting. Recovery grows in the light.'),
  stage('e06', ['early'], 'If a craving hits, set a timer for 15 minutes and do anything else. Most cravings pass.'),
  stage('e07', ['early'], 'Starting is the bravest part. You have already done it.'),
  stage('e08', ['early'], 'Plan tonight before tonight arrives: where you will be, who you can call.'),
  stage('b01', ['building'], 'Weeks in, the fog is lifting. Notice what feels clearer.'),
  stage('b02', ['building'], 'Old routines may still pull at you. New routines get stronger every time you use them.'),
  stage('b03', ['building'], 'This is when people sometimes think "I have this handled". Keep doing what is working.'),
  stage('b04', ['building'], 'Look how far you have come. Then look at how much more is possible.'),
  stage('b05', ['building'], 'Your relationships are noticing the change, even if no one says it yet.'),
  stage('b06', ['building'], 'Boredom can be a trigger. What is one thing you have always wanted to learn?'),
  stage('b07', ['building'], 'You are proving to yourself that you can keep a promise. That is huge.'),
  stage('b08', ['building'], 'Stay connected. Isolation is where old habits wait.'),
  stage('l01', ['long'], 'Months of recovery. Remember the person who started? They would be amazed by you.'),
  stage('l02', ['long'], 'Long-term recovery is built on the same small choices as day one.'),
  stage('l03', ['long'], 'Consider sharing your story with someone just starting. It helps you both.'),
  stage('l04', ['long'], 'Complacency is quiet. Keep your supports close, even when things are good.'),
  stage('l05', ['long'], 'You have built something real. Protect it with gratitude and honesty.'),
  stage('l06', ['long'], 'What does your life have room for now that it did not before?'),
  only('al1', ['alcohol'], 'Evenings can be the hardest time. Plan a new ritual: tea, a walk, a call.'),
  only('al2', ['alcohol'], 'Every morning without a hangover is a gift you gave yourself.'),
  only('al3', ['alcohol'], 'You do not owe anyone an explanation for not drinking. "No thanks" is enough.'),
  only('dr1', ['drugs'], 'Stay connected with people who support your recovery. Keep naloxone close and let someone know you are okay.'),
  only('dr2', ['drugs'], 'Your body and brain are healing every clean day. Be patient with the process.'),
  only('ca1', ['cannabis'], 'Sleep may be rough for a while. It does get better, usually within a few weeks.'),
  only('ca2', ['cannabis'], 'Notice how your memory and focus are sharpening. That is your brain coming back online.'),
  only('po1', ['pornography'], 'Keep the phone out of the bedroom tonight. Make the easy choice the right one.'),
  only('po2', ['pornography'], 'Shame keeps the cycle going. Self-respect breaks it. You deserve both honesty and kindness.'),
  only('ga1', ['gambling'], 'Every bet you do not place is money and peace of mind you keep.'),
  only('ga2', ['gambling'], 'Chasing losses is the trap. Walking away is the win.'),
  only('ni1', ['nicotine'], 'A nicotine craving usually lasts just a few minutes. Breathe deeply until it passes.'),
  only('ni2', ['nicotine'], 'Your lungs and heart are already recovering. Every hour counts.'),
  only('gs1', ['gaming_social'], 'What would you do with the hours you are getting back today?'),
  only('gs2', ['gaming_social'], 'The feed is endless by design. Your time is not. Spend it on purpose.'),
];

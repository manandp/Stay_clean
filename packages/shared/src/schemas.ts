import { z } from 'zod';

export const ADDICTION_TYPES = [
  'alcohol',
  'drugs',
  'cannabis',
  'pornography',
  'gambling',
  'nicotine',
  'gaming_social',
  'other',
] as const;
export const AddictionTypeSchema = z.enum(ADDICTION_TYPES);
export type AddictionType = z.infer<typeof AddictionTypeSchema>;

export const DRUG_SUBSTANCES = ['opioids', 'stimulants', 'benzodiazepines', 'other'] as const;
export const DrugSubstanceSchema = z.enum(DRUG_SUBSTANCES);
export type DrugSubstance = z.infer<typeof DrugSubstanceSchema>;

/** Calendar date in the user's local time, e.g. "2026-09-02". */
export const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MAX_ENTRY_CHARS = 4000;
export const MAX_THEMES_CHARS = 1200;

/** What the app tells the AI proxy about the person. Never includes identity. */
export const SupportContextSchema = z.object({
  addiction: AddictionTypeSchema,
  /** Only for addiction === 'drugs'. */
  substance: DrugSubstanceSchema.optional(),
  /** Free-text label when addiction === 'other'. */
  otherLabel: z.string().trim().max(40).optional(),
  daysClean: z.number().int().min(0).max(36500),
  /** Short on-device summary of the person's journal themes. */
  themes: z.string().max(MAX_THEMES_CHARS).optional(),
});
export type SupportContext = z.infer<typeof SupportContextSchema>;

export const CoachRequestSchema = SupportContextSchema.extend({
  entry: z.string().trim().min(1).max(MAX_ENTRY_CHARS),
});
export type CoachRequest = z.infer<typeof CoachRequestSchema>;

export const ToughDayRequestSchema = SupportContextSchema.extend({
  /** Optional "What's going on?" text. */
  note: z.string().trim().max(1000).optional(),
});
export type ToughDayRequest = z.infer<typeof ToughDayRequestSchema>;

export const DailyRequestSchema = SupportContextSchema;
export type DailyRequest = z.infer<typeof DailyRequestSchema>;

export const SummarizeRequestSchema = z.object({
  addiction: AddictionTypeSchema,
  entries: z.array(z.string().trim().min(1).max(MAX_ENTRY_CHARS)).min(1).max(20),
});
export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;

export const CrisisResourceSchema = z.object({
  name: z.string(),
  detail: z.string(),
  phone: z.string().optional(),
  sms: z.string().optional(),
  url: z.string().optional(),
});
export type CrisisResource = z.infer<typeof CrisisResourceSchema>;

export const SupportResponseSchema = z.object({
  /** True when the message showed signs of immediate danger. The app opens the crisis screen. */
  crisis: z.boolean(),
  message: z.string(),
  resources: z.array(CrisisResourceSchema).optional(),
});
export type SupportResponse = z.infer<typeof SupportResponseSchema>;

export const SummarizeResponseSchema = z.object({
  summary: z.string().max(MAX_THEMES_CHARS),
});
export type SummarizeResponse = z.infer<typeof SummarizeResponseSchema>;

export const RegisterResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.number(),
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

export const RiskLevelSchema = z.enum(['none', 'elevated', 'imminent']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

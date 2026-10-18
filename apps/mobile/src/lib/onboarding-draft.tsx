import type { AddictionType, DrugSubstance } from '@stay-clean/shared';
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface OnboardingDraft {
  addiction: AddictionType | null;
  substance: DrugSubstance | null;
  otherLabel: string;
  /** 'today', 'past' (with pastDays) or 'preparing'. */
  start: 'today' | 'past' | 'preparing';
  /** How many days they have already been clean, for 'past'. */
  pastDays: number | null;
}

const DraftContext = createContext<[OnboardingDraft, (patch: Partial<OnboardingDraft>) => void] | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>({ addiction: null, substance: null, otherLabel: '', start: 'today', pastDays: null });
  return <DraftContext.Provider value={[draft, (patch) => setDraft((d) => ({ ...d, ...patch }))]}>{children}</DraftContext.Provider>;
}

export function useOnboardingDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider');
  return ctx;
}

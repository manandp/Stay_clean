# Content review

Everything a person in recovery reads in the app, and the instructions given to the AI, must be checked by a qualified person before release and after every change.

| Content | File | Reviewed by | Date |
|---|---|---|---|
| Addiction overviews, safety warnings, next steps | `packages/shared/src/content/addictions.ts` | | |
| Resources (phone numbers and links) | `packages/shared/src/content/addictions.ts` | | |
| Coping tools | `packages/shared/src/content/addictions.ts` | | |
| Crisis lines and crisis message | `packages/shared/src/content/crisis.ts` | | |
| Daily messages and milestone messages | `packages/shared/src/content/dailyMessages.ts`, `packages/shared/src/dailyMessage.ts` | | |
| Risk keyword screen | `packages/shared/src/riskScreen.ts` | | |
| Coach, classifier and summary prompts; safe fallback message | `services/ai-proxy/src/prompts.ts` | | |
| Output guard (blocked advice) | `services/ai-proxy/src/safety.ts` | | |

## What to check

- Every phone number and link works and goes to the organization named.
- Safety warnings are accurate: alcohol and benzodiazepine withdrawal can be dangerous; opioid overdose risk rises after a break; naloxone guidance.
- Nothing reads as medical advice, diagnosis, or shaming.
- The risk screen catches clear danger and the classifier examples reflect your clinical judgment.

# Stay Clean: notes for Claude Code

A recovery companion app. pnpm monorepo: `apps/mobile` (Expo SDK 58, React Native, Expo Router, TypeScript strict), `services/ai-proxy` (Cloudflare Worker, Hono, Anthropic SDK), `packages/shared` (zod schemas, day-counter math, content, risk screen).

## Commands

- `pnpm install`
- `pnpm verify` runs typecheck, lint and tests in every package. It must pass before a task is done.
- `pnpm --filter @stay-clean/mobile test` / `pnpm --filter @stay-clean/ai-proxy test` / `pnpm --filter @stay-clean/shared test`
- Install Expo modules with `npx expo install <pkg>` from `apps/mobile` (add `EXPO_OFFLINE=1` if the Expo API is unreachable).
- `cd services/ai-proxy && pnpm dev` runs the Worker locally.

## Rules that must not be broken

- Never log, print, or send to analytics or crash reporting any journal text, transcript, AI reply, addiction type or clean date. In the proxy, only `logEvent` in `src/log.ts` may log. In the app, `no-console` is an error.
- Crisis help (`/crisis`) must work offline and stay reachable in two taps from every main screen.
- Every user text sent to the AI goes through `assessRisk` first. Classifier failures fail safe (elevated).
- The AI never gives medical, dosing, tapering or detox advice. Keep `guardOutput` and the prompt rules in sync.
- No API keys in the app. The app only holds an install token.
- Validate every boundary (network, storage, content) with the zod schemas in `packages/shared`.
- Accessibility: every control has an accessible role and label, touch targets at least 44pt, text contrast at least 4.5:1.
- Content in `packages/shared/src/content` needs human review (see `docs/content-review.md`) when changed.

## Tone of voice

Warm, plain, non-judgmental. Person-first ("a person in recovery", never "addict" in UI copy). A slip is part of recovery, never a failure.

## Design

Approved mockups: dark navy (`#0F1B29`) home and tough-day screens with soft teal cards; light sage (`#F2F4F2`) journal, resources and profile screens. Tokens are in `apps/mobile/src/lib/theme.ts`.

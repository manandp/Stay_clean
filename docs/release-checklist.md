# Release checklist

Items that need a person (accounts, legal, clinical review) before the first store release.

## Must do

- [ ] **Clinical/content review.** A qualified addiction professional reviews `packages/shared/src/content` (resources, next steps, safety warnings, daily messages) and the coach prompt in `services/ai-proxy/src/prompts.ts`. Record it in [content-review.md](content-review.md).
- [ ] **App identity.** Replace `com.example.stayclean` in `apps/mobile/app.config.ts`. Replace the placeholder icon and splash in `apps/mobile/assets`.
- [ ] **Privacy policy and terms.** Host them and set `PRIVACY_URL` in `apps/mobile/src/app/(tabs)/profile.tsx`. Base them on the "How privacy works" section of the README. Note that journal text is processed by Anthropic when AI replies are on.
- [ ] **Device attestation.** `/v1/register` currently issues tokens to any caller (rate limited per IP). Add iOS App Attest and Android Play Integrity verification there before launch so only the real app can use your API key. See the `TODO(release)` in `services/ai-proxy/src/app.ts`.
- [ ] **Production AI server.** Set `ANTHROPIC_API_KEY` and `TOKEN_SECRET` secrets, deploy, and put the URL in `eas.json` for the `production` profile. Set a spend limit and budget alert in the Anthropic Console.
- [ ] **Run the app on real devices.** Check SQLCipher opens, Face ID / fingerprint lock, voice input, notifications, calling and texting 988, and offline behavior.

## App Store (Apple)

- [ ] Age rating: answer the questionnaire honestly about alcohol/drug references and mature themes (expect 17+).
- [ ] App Privacy labels: no data collected for tracking; "User Content" (journal text) is sent for app functionality when AI replies are on and not linked to identity.
- [ ] Review notes: explain there are no accounts, data stays on device, AI replies are opt-in, and how crisis features work. Mention it's not a medical device (Guideline 1.4.1).
- [ ] Privacy manifest: run `npx expo prebuild` and confirm `PrivacyInfo.xcprivacy` covers the required-reason APIs used by the Expo modules.

## Google Play

- [ ] Data safety form: user content shared with a service provider for app functionality, encrypted in transit, deletable in the app ("Delete everything").
- [ ] Health apps declaration and content rating (IARC).
- [ ] Target audience 18+.
- [ ] AI-generated content policy: add a way to report an offensive AI reply (for example a "Report this reply" action that opens a pre-filled email without journal text).

## Nice to have soon

- [ ] Crisis and resource content for more countries (`packages/shared/src/content/crisis.ts` currently has US plus an international fallback).
- [ ] An evaluation set for the coach prompt with crisis, relapse, withdrawal and prompt-injection cases, run before every prompt change.
- [ ] Crash reporting (for example Sentry) with a `beforeSend` that strips all text and breadcrumbs.
- [ ] End-to-end tests with Maestro for onboarding, journaling, tough day and crisis flows.

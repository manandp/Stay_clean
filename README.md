# Stay Clean

A private recovery companion for iOS and Android. It counts clean days, shows daily encouragement, offers resources and first steps for each addiction type, lets people talk through hard moments by typing or speaking, and replies through an AI "Recovery Companion". A "Having a tough day?" button gives instant coping help, personalized with the person's own journal themes.

> Stay Clean is a self-help companion, not a medical device, therapy, or an emergency service.

## What's here

| Folder | What it is |
|---|---|
| `apps/mobile` | The Expo (React Native, TypeScript) app |
| `services/ai-proxy` | A Cloudflare Worker that holds the Anthropic API key and calls Claude. The app never contains an API key. |
| `packages/shared` | Code used by both: schemas, day-counter math, recovery content, crisis lines, the risk keyword screen |
| `docs/` | Security notes, content review checklist, release checklist |

## Run it locally

You need Node 22 and pnpm 10.

```bash
pnpm install
pnpm verify                 # typecheck, lint and all tests
```

**AI server**

```bash
cd services/ai-proxy
cp .dev.vars.example .dev.vars   # add your ANTHROPIC_API_KEY and a long random TOKEN_SECRET
pnpm dev                          # http://localhost:8787
```

**App** (needs a development build, because it uses native modules such as SQLCipher, Face ID and speech recognition; Expo Go won't work)

```bash
cd apps/mobile
npx eas-cli@latest build --profile development --platform ios   # or android
npx expo start --dev-client
```

Set `AI_PROXY_URL` in `apps/mobile/eas.json` for each build profile. For a simulator talking to your laptop, `http://localhost:8787` works on iOS; Android emulators use `http://10.0.2.2:8787`.

**Browser demo** (no phone needed; for showing the app, not for real use)

```bash
cd apps/mobile
pnpm demo:web     # writes dist-web/ and a single-file dist-web/stay-clean-demo.html
```

The web build swaps in browser stand-ins (files ending `.web.ts`/`.web.tsx`): entries are saved unencrypted in the browser, reminders and screenshot blocking are off, and dialogs are drawn in the page. A banner says so on every screen. AI replies need the AI server, as on the phone.

## Deploy

**AI server**

```bash
cd services/ai-proxy
npx wrangler secret put ANTHROPIC_API_KEY --env production
npx wrangler secret put TOKEN_SECRET --env production
pnpm deploy
```

The model is set by `CLAUDE_MODEL` in `wrangler.jsonc` (default `claude-opus-5-5`). `CLASSIFIER_MODEL` can be set separately for the safety check, for example `claude-haiku-5-5` to lower cost.

**App stores**

```bash
cd apps/mobile
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

Before the first store release, work through [docs/release-checklist.md](docs/release-checklist.md).

## How privacy works

- **No accounts.** Each install gets an anonymous, short-lived token from the AI server.
- **Encrypted on the phone.** Journal entries, the counter and settings live in a SQLCipher database. Its 256-bit key is in the iOS Keychain / Android Keystore, set to "this device only", so it's excluded from backups. Android backups are turned off.
- **AI is opt-in.** Text goes to the AI server only when the person has turned on Recovery Companion replies. The server redacts emails and phone numbers, doesn't store anything, and logs only metadata (route, status, timing, risk level), never text.
- **Personalization stays small.** The phone asks the server for a short, anonymized summary of journal themes at most once a day. Future requests send that summary, not the journal.
- **Voice stays on the phone** where the device supports on-device speech recognition. Audio is never saved or uploaded by the app.
- **App lock** with Face ID, fingerprint or passcode; screenshots are blocked on journal and tough-day screens; the app is blurred in the app switcher.

## Safety design

- Crisis lines (988, Crisis Text Line, SAMHSA, 911) are bundled, work offline, and are two taps away from every main screen.
- Every message is checked on the phone with a keyword screen, then on the server with the keyword screen plus a Claude classifier. If the classifier fails, the server treats the message as elevated risk, never as safe.
- Imminent risk skips the AI reply entirely and returns a fixed, human-written crisis message with crisis lines.
- Replies are checked for dosing, tapering or "safe use" advice and replaced with a safe fallback if found.
- The coach prompt is in `services/ai-proxy/src/prompts.ts`. It forbids medical, dosing and detox advice and treats journal text as data, not instructions.

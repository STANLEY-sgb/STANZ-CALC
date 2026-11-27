# Stanz Calc

Retro tactile scientific calculator and live currency converter for **stanz-apps.online**. React 18 + TypeScript + Vite, a `decimal.js`-backed AST math engine (no `eval`), an offline-first currency converter, and Capacitor wrappers for direct Android `.apk` / iOS link-install distribution — no app stores involved.

## Stack

- React 18, TypeScript, Vite, Tailwind CSS v4
- `decimal.js` recursive-descent math parser (`src/engine/mathParser.ts`)
- `vite-plugin-pwa` (offline service worker + installable manifest)
- Capacitor (`@capacitor/android`, `@capacitor/ios`, `@capacitor/haptics`) for native shells

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # type-check + production bundle into dist/
npm run preview     # serve the production build locally
```

## Project layout

```
src/
  engine/
    mathParser.ts        # AST parser + evaluator (Decimal, no eval)
    currencyService.ts    # 150+ currency metadata, live/offline FX rates
  hooks/
    useCalculator.ts       # expression, history, memory, angle mode
    useCurrencyConverter.ts
  components/
    OledDisplay.tsx         # amber OLED screen, history tape, FX readout
    TactileKeypad.tsx       # 5x5 sculpted keycap grid
    ScientificDeck.tsx      # expandable scientific functions
    DownloadHubModal.tsx    # APK download + iOS install + QR code
    IosInstallBanner.tsx    # Safari "Add to Home Screen" prompt
    MenuDrawer.tsx, FavoritesDrawer.tsx, CurrencyPicker.tsx
  utils/
    format.ts               # thousands grouping, scientific notation
    soundAndHaptics.ts       # Web Audio key clicks + Capacitor haptics
scripts/
  gen-icons.cjs             # procedurally renders every app icon (no deps)
  build-apk.mjs             # web build -> cap sync -> gradle -> public/downloads/
```

## Deploying the web app to stanz-apps.online

1. `npm run build` — outputs a fully static site in `dist/`.
2. Upload the contents of `dist/` to the web root of `stanz-apps.online` (any static host: Netlify, Vercel, Cloudflare Pages, S3+CDN, nginx, etc.).
3. Make sure the host serves `dist/downloads/stanz-calc.apk` as a binary (most static hosts do this automatically). It must be reachable at `https://stanz-apps.online/downloads/stanz-calc.apk`.
4. HTTPS is required for the service worker and "Add to Home Screen" install flow to work.

## Android `.apk` distribution

The Android native shell lives in `android/` (already scaffolded with Capacitor, app id `online.stanzapps.calc`, app name "Stanz Calc").

```bash
npm run build:apk
```

This single command:
1. Builds the web bundle (`vite build`)
2. Syncs it into the Android project (`cap sync android`)
3. Runs `./gradlew assembleDebug`
4. Copies the resulting APK to `public/downloads/stanz-calc.apk`

Re-run `npm run build` afterwards (or just redeploy) so the copied APK ships with your next `dist/` upload.

For a Play-adjacent **signed release** build instead of the debug-signed APK above, set `APK_BUILD_TYPE=release`, generate your own upload keystore, and wire a `signingConfig` into `android/app/build.gradle` pointing at it — the scaffolded `release` build type here is intentionally unsigned so CI can build it without secrets.

To open the native project directly: `npm run android:open` (requires Android Studio).

## iOS — link install, no App Store

iOS users install directly from Safari:

1. Open `https://stanz-apps.online` in Safari on iPhone/iPad.
2. Tap **Share (⍐)** → **Add to Home Screen**.
3. The app launches full-screen and offline from the Home Screen icon.

The in-app `IosInstallBanner` surfaces this automatically for Safari/iOS visitors who haven't installed yet, and the **Download** hub (`≡` menu → "Download APK / iOS Link Install") repeats the instructions with a scannable QR code pointing at the live site.

A Capacitor iOS shell also exists in `ios/` (app id `online.stanzapps.calc`) for sideloading via AltStore/SideStore. The CI workflow below builds an **unsigned** `.ipa` from it. To open the Xcode project directly: `npm run ios:open` (requires Xcode on macOS).

## CI: `.github/workflows/build-releases.yml`

Runs on every push to `main`, on manual dispatch, and on published GitHub Releases:

- **build-android** (ubuntu-latest): builds the web bundle, syncs Capacitor, assembles both a debug APK (published as `stanz-calc.apk`) and an unsigned release APK, uploads both as workflow artifacts, and attaches them to the GitHub Release when one is published.
- **build-ios** (macos-latest): builds the web bundle, syncs Capacitor, runs CocoaPods, and produces an **unsigned** `.ipa` for AltStore/SideStore sideloading, uploaded as a workflow artifact and attached to Releases.

Download the debug APK artifact from a workflow run (or a GitHub Release) and copy it to `public/downloads/stanz-calc.apk` before deploying, or just run `npm run build:apk` locally — both paths produce the same file.

## Regenerating app icons

```bash
npm run icons:gen
```

Procedurally re-renders every PWA/Android/iOS icon (`scripts/gen-icons.cjs`, zero image dependencies — raw PNG encoding via `zlib`) from the brand palette, including the Android adaptive-icon foreground/background split and the opaque 1024×1024 iOS App Store icon. Run it after changing the icon design, then re-run `npm run build:apk` / `npm run cap:sync` to propagate the new icons into the native shells.

## Analytics & admin dashboard

`src/utils/analytics.ts` tracks a small, privacy-conscious set of events — an anonymous per-browser `deviceId` (no PII), the runtime platform (`android-apk` / `ios-pwa` / `ios-safari` / `web-desktop`), and these events: `app_first_install`, `app_session_start`, `apk_download_clicked`, `ios_install_prompt_shown`, `ios_pwa_installed`, and `feature_used` (`scientific_mode`, `currency_convert`, `tape_history_reused`). Every event is always written to a capped local log in `localStorage` first (so the app works fully offline and never blocks on a network call), then optionally mirrored to whichever of these you've configured via build-time env vars (copy `.env.example` to `.env.local`, or set them in your host's build settings):

- **PostHog** (`VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`) — loaded on demand via a separate lazy chunk, so it costs nothing for visitors when it isn't configured (also excluded from the PWA's precache for the same reason).
- **Umami** (`VITE_UMAMI_WEBSITE_ID`, `VITE_UMAMI_SRC`) — injects the tracking script tag only when configured.
- **Supabase** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_EVENTS_TABLE`) — posts each event straight to a Postgres table over Supabase's REST API. Run `supabase/app_events.sql` in your project's SQL editor to create it. **Read that file's comments first** — because this is a purely static site with no backend, the anon key that lets the client insert events necessarily also lets it (and anyone else holding that key) read them all directly from Supabase's REST API; the admin dashboard's passcode only gates the dashboard UI, not the table itself. Don't put anything sensitive in event `props`, and use a real backend instead if you need actual access control.

The dashboard lives at `/admin` (e.g. `https://stanz-apps.online/admin`) and is **disabled by default** until you set `VITE_ADMIN_PASSCODE` — a safety default so it's never accidentally left open. Note that any `VITE_*` value is bundled into the public JS and is only an obfuscation-level gate, not real auth. With Supabase configured it shows aggregate stats across every device (unique devices, active today/7d/30d, platform breakdown, the download funnel, feature popularity, and top currency pairs); without it, those same KPI cards are computed from just the current device's local log, clearly labeled as such. **Export CSV** downloads whichever event set is currently loaded.

Since `/admin` is a client-side route, direct navigation to it needs your static host to fall back to `index.html` for unknown paths (standard SPA hosting config). `public/_redirects` is already included for Netlify; for Vercel add a rewrite (`{ "source": "/(.*)", "destination": "/index.html" }` in `vercel.json`), and for nginx/Apache use their standard `try_files`/`.htaccess` SPA fallback recipes. This only affects `/admin` — the calculator itself is served at `/` and needs no special config.

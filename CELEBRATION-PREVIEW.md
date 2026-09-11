# Silent celebration playground

Preview only. No production trigger is wired, no main-app entry points or ranking/data code are changed. Josh reviews the visual on his phone before any integration or live deployment. Audio is intentionally absent, not a future toggle.

## Run

- `npm ci`
- `npm run build:celebration`
- Serve **only `dist-preview/`** (for example `python3 -m http.server 18941 --directory dist-preview --bind 127.0.0.1`).
- Open `/` or `/preview.html` on that dedicated preview server.

The separate Vite entry imports only presentation components, CSS, and hard-coded fictional samples. It never imports App/StoreProvider/seed, opens IndexedDB, or writes localStorage. Do not serve the repository root or the normal `dist/` as the preview.

## Iteration

Play/replay, Hype/Nuclear intensity, 2/2.8/4-second durations, weight/reps/time samples, and reduced-motion switch. Device reduced-motion preferences override animation. Tap anywhere or Escape dismisses immediately. A blocked/erroring video falls back to a poster; no audio track exists in the MP4. Video uses muted inline playback for mobile browsers.

Reusable presentation component: `src/celebrations/NewBestCelebration.tsx`. The caller owns each event and dismissal. Later integration should mount it after a successful genuine new-best save, not an effect watching persistent best state. Preserve existing save/ranking behavior; do not replay on reload. Decide manual Set as best behavior when integrating.

## Clip provenance

Ronnie Coleman reaction, source: https://tenor.com/view/light-weight-gif-21674454
Media source: https://media.tenor.com/518P-3YD5ugAAAPo/light-weight.mp4
2.4-second source, cropped to remove its embedded caption, recompressed as H.264 MP4 with no audio stream. Poster from first frame. Attribution is linked from the preview. This is an existing third-party meme clip, not an original/generated asset or a claim of ownership.

## Verified 2026-09-11

- Preview build and normal app build pass.
- Existing 110 tests pass with `NODE_OPTIONS=--no-experimental-webstorage npm test` on host Node 26 (its experimental global localStorage otherwise conflicts with jsdom).
- Chromium mobile-sized browser: video actually advances muted; manual and automatic dismissal; replay; selected sample and intensity; manual and OS reduced motion; no localStorage/IndexedDB; no page errors; no horizontal overflow at 320/390/768/1280px.
- Actual iPhone/Safari playback and visual preference await Josh's preview review.

No merge/deploy without Josh's explicit approval. Future ideas: protein-tub rocket launch, muscular-gorilla coronation, randomized rotation avoiding immediate repeats.

## Review iteration 02

Josh selected Nuclear, 2.8 seconds, motion enabled, always silent. These are now the defaults (OS reduced-motion still respected). Replaced the initial lime/olive styling with the existing app CSS tokens: navy/charcoal surfaces, blue accent/header/button, mint-green best values, and original text/border colors. Animation timing and behavior are unchanged. Preview 02 built and silent playback verified through the external URL with no browser errors. Still no production integration or merge authorization.

# Gym Buddy

A personal, phone-first tracker for **all-time best days**. It is not a set-by-set workout logger, not a program, and not a clone of Strong/Hevy.

Live (home-screen web app): https://agentsandy217.github.io/cd13b22c2257d28c/

Repo name is a random hex string on purpose. The site is public; **live logs stay on the phone**. The repo does contain the imported seed (`src/seed.json`, `exercises.csv`) — current bests and notes as they were when we left the spreadsheet.

If you are an agent picking this up: read this file before changing product behavior. [`PLAN.md`](PLAN.md) is the original decision dump; some of its “next steps” are already done. **This README is the current source of truth.**

---

## What we are trying to accomplish

The owner has lifted for years. They used a Google Sheet. Popular apps felt like a chore: logging every set, painful custom exercises, the one useful fact buried in history charts.

**The only question that matters:** for each exercise, what did the best day look like, so today’s target is obvious.

Training style (do not “fix” this with periodization, RPE, or 1RM math unless asked):

- Sets and reps rarely change.
- Heavier lifts: 3–4 sets, aiming for 8–12, adding **weight** over time.
- Example they already stored: `90x10, 90x7, 85x8, 80x8` — four sets of weight×reps.
- Next time: start at 90, try to beat the **top set** (10 reps). Volume is not the score.

The sheet format is not sacred. The **low-maintenance loop** is: see the target → lift → drop a compact snapshot → leave. Ten seconds, on the phone, at the gym.

---

## Why these decisions (locked unless the owner says otherwise)

### Logging is not the product

Most apps invert this. Here the unit of data is a **session snapshot** for one exercise (`90×10, 90×7, 85×8, 80×8`), not a live “start workout” with rest timers.

Shorthand is accepted and displayed. Internally it is parsed into structured sets. Do not replace it with a “more correct” per-set UI.

`90 x 10` (spaces) and `90×10` both parse. Commas separate sets. `90 by 10` / `90-10` / missing commas between sets do not.

### Best = all-time peak, ranked by top set only

Always chase the peak, even if last session was worse. Store the **date** of that best.

`90×10, 90×6, 85×8, 80×8` **beats** `90×9, 90×8, 85×10, 85×8` — more volume does not win.

Rule (`src/lib/rank.ts`):

1. Higher top-set **weight** wins.
2. Same weight → higher top-set **reps** wins.
3. Tie → keep the existing best (do not replace).

Backoff sets are shown so the day is visible. They do not pick the winner.

Kinds that auto-rank: **loaded** (weight×reps), **bodyweight** (reps only), **timed** (longer wins). Mixed/unparseable lines (circuits like `23, 16, 1:10`, band notes, leftover prose) **do not** auto-replace the best. The owner can **Set as best** on a recent log. One known quirk: timed *for time* (faster is better, e.g. “30 Pull Ups (Timed)”) is scored as longer-is-better; don’t “fix” that unless asked.

### Target copy

Derived only from the first set of the current best (`src/lib/target.ts`):

- Loaded: **Start 90. Beat 10.** Compact row form: `90/10`.
- If **every** set at that top weight is 12+ reps, suggest adding weight (5 lb if the load is a multiple of 5, else 2.5).
- Bodyweight: **Beat 14.**
- Timed: **Beat 1:40.**
- Mixed / unknown: **omit the sentence**. Do not bring back “Beat that line.” The best snapshot *is* the target. Empty best: **Log a first session.**

### Not a locked program

Push / Pull / Legs / Other is a **filter** on Today, not a prescribed routine. The owner mixes exercises from their list each session. Creating a lift is a name + equipment + muscle + day tags. No 5,000-exercise catalog.

Sheet `Category` / `SubCategory` (e.g. `Fly, General`) was garbage. We inferred equipment from the name and muscle/day from category. Wrong guesses are fixable in **Edit**. Names with `x3`/`x4` were kept as separate lifts when they had different PRs — do not silently merge.

### Notes

Exercise notes (form cues from the sheet) show on the **detail** screen when present, labeled **Notes**, under the name. They do not appear if empty. Edit is only for changing them.

### Platform: home-screen web app, $0, on-device data

Not a native iOS app. No Xcode, no App Store, no $99/year Apple account. The owner has no iOS/app-dev experience.

Safari → Share → **Add to Home Screen** uses `display: standalone`. It launches full-screen, not as a Safari tab. That is intentional.

Stack: static Vite + React site on **GitHub Pages**. No backend. **IndexedDB** holds lifts on that phone/browser. The host only serves HTML/JS. A stranger with the URL gets an empty tracker (their own empty IDB), not the owner’s live logs.

**Export** is a spare key, not a daily chore. iOS can evict website storage. Backup → Export after a new PR or before a new phone. Import **replaces** everything. Do not nag daily. Do not add a homemade JS password (trivial to bypass). Cloudflare Access is an optional later lock, not required.

### UI

The owner picked **logbook (direction D)** with **larger type closer to C**: dense rows, green target in the row (`90/10`), dark navy, blue chips. Not the original rust “scoreboard” cards. Don’t restyle for fun.

### AI is later, not the gym UI

Chat is a terrible way to log between sets. If an assistant is added, it must read/write the **same** exercises / snapshots / bests / notes as the tap UI. Default LLM provider if/when that happens: **SpaceXAI** (`XAI_API_KEY`, `https://api.x.ai/v1`) — not OpenAI/Anthropic/Gemini.

Useful later: messier natural-language parse, session notes (“shoulder tweaky”), “what haven’t I hit on pull.” Wait on: auto-programs, form video, social, RPE, 1RM, rest timers.

YouTube follow-along rows were **dropped** from the seed on purpose (stretch/warmup/ab videos). Do not import them back.

---

## How the app works

### Screens (hash routes, `src/ui/route.ts`)

Hash routing so GitHub Pages needs no rewrite rules.

| Route | Screen | Job |
|---|---|---|
| `#/` | Today | Day filter → search → rows (name, full best line, date, green target) |
| `#/lifts` | Lifts | Full library, muscle filter, **Add** |
| `#/e/:id` | Detail | Notes, top set, target, best + date, log shorthand, recents / set-as-best |
| `#/e/:id/edit` | Editor | Name, muscle, equipment, day tags, notes, delete |
| `#/new` | Editor | Create |
| `#/backup` | Backup | Export JSON (share sheet / download); import replaces all |

Bottom nav: Today / Lifts / Backup.

### Data model (`src/types.ts`)

```
Exercise { id, name, equipment, muscle, dayTypes[], notes, best, recents[] }
Snapshot { date, raw, sets[], kind }   // kind: loaded | bodyweight | timed | mixed
LoggedSet { weight?, reps?, seconds?, extra? }
```

`recents` is capped at 20. Not a history browser.

### Persistence (`src/lib/db.ts`, `src/lib/store.tsx`)

IndexedDB `gym-buddy` / store `exercises`. First visit with an empty DB **seeds** from `src/seed.json` (148 lifts after dropping videos). After that, the phone’s DB is the source of truth. Changing `seed.json` will **not** update a phone that already seeded. To refresh a device: Backup → something, or clear the site’s data (destructive), or import a JSON file.

Seed pipeline: `exercises.csv` → `npm run seed` → `src/seed.json` via `scripts/build-seed.mjs` (drops Video categories and URL “bests”). Mapping/inference: `src/lib/fromSheet.ts`.

### Parse (`src/lib/parse.ts`)

- Split on commas, ignoring commas inside `(parentheses)`.
- Token: `90x10` / `90 x 10` / `90×10` / `32.5x8` → loaded; `14` → reps; `1:40` → seconds.
- Display normalizes to `90×10, 90×7, …`.

Tests: `npm test` (parse, rank, seed, target). Keep them green if you touch ranking or parse.

---

## Repo layout

```
src/lib/parse.ts rank.ts target.ts db.ts store.tsx fromSheet.ts
src/ui/          Today, Lifts, Detail, Editor, Backup, Card (logbook row)
src/seed.json    Bundled first-run library
exercises.csv    Original sheet export (videos still in the CSV; seed strips them)
.github/workflows/pages.yml   Deploy dist/ to GitHub Pages on push to main
```

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

`GITHUB_PAGES=true` at build time sets Vite `base` to `/{repo}/` so project Pages works. Local/dev stays `/`.

---

## Deploy

Push to `main` on `agentsandy217/cd13b22c2257d28c`. GitHub Actions builds and publishes:

https://agentsandy217.github.io/cd13b22c2257d28c/

On iPhone: **Safari** (not Chrome) → that URL → Share → Add to Home Screen. Open from the icon so it stays standalone.

Cost today: **$0** (public GitHub + Pages + Actions). No Apple fee.

---

## Explicitly out of scope until asked

Native iOS/Android, paid hosting, user accounts, cloud sync of live logs, Cloudflare Access, set-by-set live workouts, rest timers, social, exercise encyclopedia, charts, daily backup nags, chat as the primary logger, YouTube workout library.

---

## Sensible next work (only if the owner wants it)

- Real gym use → logging UX, tag mistakes, target wording.
- Cloudflare Access if they want the HTML gated to their email.
- Richer parse (`90 for 10 then 7`).
- Notes/assistant on the same data model.

Do not expand scope because it would be “more like a real workout app.” That is the thing they already rejected.

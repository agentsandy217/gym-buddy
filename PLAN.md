# Gym Buddy — v1 plan

A personal, phone-first tracker for **all-time best days**, not a set-by-set workout logger.

This file is the handoff. Read it before building or changing direction. It records the problem, the decisions we locked, v1 scope, and what to do next.

---

## Why this exists

The user plans and tracks workouts in a Google Sheet. Popular apps (Strong, Hevy, and similar) feel like a chore: they push logging every set, make custom exercises annoying, and bury the one question that matters.

**The actual need:** for each exercise, what did the best day look like, so today’s target is obvious.

Training style (years of consistency, not a beginner program):

- Sets and reps rarely change.
- Heavier lifts: 3–4 sets, aiming for 8–12 reps.
- Progression is adding weight over time.
- Example snapshot already stored in the sheet:

  `90x10, 90x7, 85x8, 80x8`

  That is 4 sets of `weight x reps`. Next time: start at 90 lb and try to beat that top set (10 reps).

The sheet format is not sacred. The **low-maintenance loop** is: see the target, lift, drop a compact snapshot, leave.

---

## Product philosophy

Most apps make **logging** the product. This app inverts that.

- The unit of data is a **session snapshot** for one exercise, not a live set-by-set workout.
- Display and accept the existing shorthand: `90x10, 90x7, 85x8, 80x8`.
- Internally store structured sets. Do not replace the shorthand with a “more correct” format.
- No exercise catalog, no approval flow, no official library.
- Push / Pull / Legs is a **filter**, not a locked program. Exercise selection is mixed from the user’s own list.
- Chat is not the gym UI. Tapping a card and typing `90x10, 90x7` always wins mid-session.
- AI is a layer on a simple data model later, not the product.

---

## Decisions that are locked

### Platform and cost

- **Not a native iOS app.** No Xcode, no Swift, no Apple Developer account ($99/year).
- **Mobile website** added to the iPhone home screen: Safari → Share → **Add to Home Screen**.
- **$0 stack.** Static host (Cloudflare Pages, GitHub Pages, or Vercel). No paid backend for v1.
- Lift data lives **on the device** (browser storage: IndexedDB or equivalent). The host only serves HTML/JS.
- User has **zero iOS/app-dev experience**. Keep the stack boring and the surface small.

### Where and when they log

- **Phone at the gym**, between exercises or right after the last set.
- Ten-second log, not a “start workout” ceremony.

### What “best day” means

- **All-time best session** for that exercise. Always chase the peak, even if the last session was worse.
- Store and show the **date** of the current best.
- If today’s top set does not beat the stored best, the old line and date stay.

### How “better” is ranked (top set only)

Volume does not win. Backoff sets are history, not the score.

`90×10, 90×6, 85×8, 80×8` **beats** `90×9, 90×8, 85×10, 85×8`

Rule:

1. Higher top-set **weight** wins.
2. Same weight → higher top-set **reps** wins.
3. Same top set → keep the existing best (do not replace on a tie).

The card still shows the **full snapshot line** so the rest of the day is visible. Only the first working set decides whether the card updates.

**Target line derived from the best:**

- Start at the top working weight.
- Beat the top-set reps (the first number in the line).
- If every set at that weight is at the top of the usual range (~12), suggest adding weight next time.

Example card copy:

```
Dumbbell bench press
Best · Mar 12, 2026
90×10, 90×6, 85×8, 80×8
Target: start 90. Beat 10.
```

### Workout structure

Closest to named days, but mixed:

- There is something like **Push / Pull / Legs** (plus Other).
- Exercises are mixed from one session to the next.
- User **selects from their own exercise list**, filtered by day type / tags.
- Not a fixed routine. Not a written program they must follow.

### Tags (two axes, not freeform soup)

| Axis      | Examples                                                          |
|-----------|-------------------------------------------------------------------|
| Equipment | Dumbbell, cable, barbell, machine, bodyweight, kettlebell         |
| Muscle    | Chest, back, shoulders, quads, hamstrings, glutes, biceps, triceps, core, calves |

Creating an exercise = a **name** + those two fields. That is the whole catalog.

Today → Push → Dumbbell is a valid way to pick a mixed session.

Day-type tags (push / pull / legs) should also exist so the Today screen can filter. An exercise can belong to a day type in addition to equipment + muscle.

### Import (v1 seed)

- Import **current bests only**. The existing sheet history is not a full session log; it is today’s targets.
- One-time seed: exercise names + best snapshot + date if present.
- Full history going forward is **nice-to-have**, not a must-have. If snapshots are free to keep, keep them. Do not build a history browser until it is missed.

### Export (v1 spare key, not a daily chore)

- **Not part of the gym loop.** Normal day: open app → see target → type snapshot → done. Nothing uploaded, nothing emailed.
- Purpose: Safari / iOS can evict website storage (clear history, new phone, low disk). Export is a file the user controls.
- **Where it goes:** iPhone share sheet → Save to Files (iCloud Drive or On My iPhone), Mail/Messages to self, or copy into Notes.
- Format: small JSON (or a readable text dump) of exercises + dates + snapshot lines. Dozens of bests = a few KB.
- **How often:** after a new all-time best, before a phone swap / iOS wipe, or whenever they remember. Not daily. No nag.
- **Import** is the reverse: pick the file, bests and dates come back.

Do not auto-email every session in v1. Optional “email me when a best changes” or a signed-in cloud copy can wait.

### Privacy and the URL

Two different things:

- **Lift data** stays on the phone. A stranger with the URL sees an empty tracker, not PRs.
- **The app shell** on a free static host is a public URL by default.

v1: ship on a boring, unguessable URL. Data on-device. Export for backup.

Later, if they want “only I can open it”: **Cloudflare Pages + Cloudflare Access** (free). Email + one-time code, allow-list their address. Still $0. A homemade password in page JS is weaker (the check is downloadable) — skip it.

Do not block v1 on Access.

### AI — later, not v1

User is exploring ideas, not asking for a chatbot gym. The sheet is messy and bad on a phone. They can imagine a full assistant that also takes notes about each workout. Phone access is required.

**Worth doing early (parse layer, not chat UI):**

- Parse the messy sheet into exercises + bests.
- Accept messy logging: `90 for 10 then 7, dropped to 85 for 8`.
- Match names and typos (`db bench` → Dumbbell bench press).

**Natural next step after v1:**

- Notes on a session or exercise (“shoulder tweaky, stay at 85”).
- Voice / messy text after a session.
- “What haven’t I hit on pull in a while?”
- “Only 40 minutes and the cables are taken.”

The assistant must read and write the **same objects** as the tap UI (exercises, snapshots, bests, notes). Do not make chat the only way to log.

If an LLM is added, use **SpaceXAI** (`XAI_API_KEY`, `https://api.x.ai/v1`). Do not default to OpenAI / Anthropic / Gemini.

**Wait on:** chat-only gym logging, auto-written programs, form video, social, RPE, 1RM calculators, rest timers.

---

## v1 shape

| Screen         | Job                                                                 |
|----------------|---------------------------------------------------------------------|
| Today          | Day type → pick lifts → see best / date / target → log snapshot     |
| Exercise list  | Search, filter by equipment / muscle / day type, add in one form    |
| Lift detail    | Best day + date, target, optional recent snapshots, a note          |
| Import         | Paste / upload the sheet (or a seed file) once                      |
| Export         | Share-sheet file of current bests                                   |

Gym log input:

- One field that accepts the shorthand, **or**
- +1 rep / +5 lb on a prefilled copy of the best day.

Creating an exercise must be two seconds: name + equipment + muscle (+ day type).

### Suggested data model

Keep this tiny.

```
Exercise
  id, name
  equipment        // dumbbell | cable | barbell | machine | bodyweight | kettlebell
  muscle           // chest | back | ...
  dayTypes[]       // push | pull | legs | other
  aliases[]        // optional, later
  notes            // free text, later

Best (or latest winning Snapshot)
  exerciseId
  date             // calendar day of the best
  raw              // "90x10, 90x7, 85x8, 80x8"
  sets[]           // [{ weight, reps }, ...]
  topWeight, topReps   // denormalized for ranking / target

Snapshot (optional in v1, cheap to keep)
  exerciseId, date, raw, sets[]
```

Ranking compares `topWeight`, then `topReps`. Tie keeps the existing best.

---

## Explicitly out of scope for v1

- Native iOS / Android / App Store
- Paid hosting, user accounts, cloud sync
- Cloudflare Access (optional follow-up)
- Set-by-set live workout, rest timers, “start workout”
- Social, programs, 5,000-exercise encyclopedia
- Charts / history browser
- Daily backup nags
- Chat UI as the primary logger

---

## What “done” looks like for v1

The user can, on an iPhone at the gym:

1. Add the site to the home screen.
2. See their real (imported or typed) bests with dates.
3. Filter to Push / Pull / Legs and pick a lift from their list.
4. Read “start 90, beat 10.”
5. Log `90x10, 90x8, 85x8` in one shot.
6. Have the card update only if the top set improved.
7. Export a file to Files / email, and import it again on a fresh browser.

No Apple account. No monthly bill.

---

## Open questions / next actions when this is picked up

1. **Get a redacted slice of the Google Sheet** (headers + a handful of rows). That pins names, date format, and whether equipment/muscle can be inferred vs entered by hand.
2. Scaffold the mobile web app (single-page is enough). Persist to IndexedDB. Add to home screen + a web app manifest.
3. Implement ranking, target copy, tags, shorthand parse/format.
4. Seed import + share-sheet export.
5. Deploy to a free static host on an unguessable URL.
6. Use it for real sessions, then iterate. Expected early feedback: logging UX with sweaty hands, tag vocabulary, target wording.

Optional immediately after v1: Cloudflare Access; keep snapshots; notes field; sheet parser if the real columns are messy.

---

## Context from the original conversation (short)

- User does not want to track every set of every workout.
- Adding custom exercises in popular apps felt like a chore.
- Not tied to the spreadsheet or the `90x10, 90x7` string, but tied to the same maintenance level.
- Open to AI helping build something better; first need is a usable phone app, not an assistant.
- History in the sheet = current bests, not years of every session.
- Fine if a public URL exists; data privacy matters more than hiding the HTML. Access lock is a later nice-to-have.
- They will iterate once there is an actual app to use. This document exists so the project can sit cold and still be resumed with the same decisions.

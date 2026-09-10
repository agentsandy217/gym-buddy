import { describe, expect, it } from "vitest";
import seed from "../seed.json";
import type { Exercise } from "../types";
import { parseExportFile } from "./backup";
import { toExportFile } from "./db";
import { sheetToExercises } from "./fromSheet";
import { parseSnapshot } from "./parse";

function lift(): Exercise {
  return {
    id: "band-pull-apart",
    name: "Band pull apart",
    equipment: "band",
    muscle: "shoulders",
    dayTypes: ["pull"],
    notes: "Go by feel",
    best: null,
    recents: [],
  };
}

describe("backup validation", () => {
  it("round-trips the full spreadsheet library, including missing bests and dates", () => {
    const exercises = sheetToExercises(seed);
    expect(exercises.some((exercise) => exercise.best === null)).toBe(true);
    expect(exercises.some((exercise) => exercise.best?.date === "")).toBe(true);
    expect(parseExportFile(JSON.parse(JSON.stringify(toExportFile(exercises))))).toEqual(exercises);
  });

  it("accepts a new or feel-based exercise with no best or recent sessions", () => {
    const exercise = lift();
    expect(parseExportFile(toExportFile([exercise]))).toEqual([exercise]);
  });

  it.each(["32.5x8, 30x10", "14, 11", "1:40", "23, 16, 1:10", "Light band, went by feel"])(
    "preserves a snapshot and recent session containing %s",
    (raw) => {
      const best = parseSnapshot(raw, "")!;
      const exercise = { ...lift(), best, recents: [best] };
      expect(parseExportFile(toExportFile([exercise]))).toEqual([exercise]);
    },
  );

  it("allows a free-text snapshot without numeric sets", () => {
    const exercise = {
      ...lift(),
      best: { date: "", raw: "Light band, by feel", kind: "mixed" as const, sets: [] },
    };
    expect(parseExportFile(toExportFile([exercise]))).toEqual([exercise]);
  });

  it("allows an empty library", () => {
    expect(parseExportFile(toExportFile([]))).toEqual([]);
  });

  it.each([
    null,
    [],
    {},
    { version: 2, exportedAt: "", exercises: [] },
    { version: 1, exportedAt: 123, exercises: [] },
    { version: 1, exportedAt: "", exercises: {} },
  ])("rejects an invalid backup envelope: %j", (data) => {
    expect(() => parseExportFile(data)).toThrow(/Invalid backup:.*Nothing was imported/);
  });

  it.each([
    ["id", ""],
    ["id", 123],
    ["name", "  "],
    ["name", null],
    ["equipment", "unknown-equipment"],
    ["muscle", "unknown-muscle"],
    ["dayTypes", "pull"],
    ["dayTypes", ["invalid-day"]],
    ["notes", {}],
    ["tags", "Row"],
    ["tags", [42]],
    ["tags", [" "]],
    ["best", undefined],
    ["best", ""],
    ["best", {}],
    ["recents", null],
    ["recents", [null]],
  ])("rejects malformed exercise field %s = %j", (field, value) => {
    const data = toExportFile([lift()]);
    Object.assign(data.exercises[0], { [field]: value });
    expect(() => parseExportFile(data)).toThrow(`exercise 1.${field}`);
  });

  it.each([
    ["date", null],
    ["raw", 12],
    ["kind", "unknown"],
    ["sets", null],
    ["sets", [null]],
    ["sets", []],
    ["sets", [{ weight: "90", reps: 10 }]],
    ["sets", [{ weight: 90, reps: null }]],
    ["sets", [{ weight: Infinity, reps: 10 }]],
    ["sets", [{ weight: -5, reps: 10 }]],
    ["sets", [{ weight: 90, reps: 1.5 }]],
    ["sets", [{ weight: 90, reps: 10, seconds: "slow" }]],
    ["sets", [{ weight: 90, reps: 10, extra: {} }]],
    ["sets", [{ extra: "missing loaded set" }]],
  ])("rejects malformed best field %s = %j", (field, value) => {
    const best = { ...parseSnapshot("90x10", "2026-09-10")!, [field]: value };
    expect(() => parseExportFile({ ...toExportFile([]), exercises: [{ ...lift(), best }] }))
      .toThrow(`exercise 1.best.${field}`);
  });

  it.each(["bodyweight", "timed"])("requires the numeric field for a %s snapshot", (kind) => {
    const best = { date: "", raw: "notes", kind, sets: [{ extra: "by feel" }] };
    expect(() => parseExportFile({ ...toExportFile([]), exercises: [{ ...lift(), best }] }))
      .toThrow("exercise 1.best.sets[0]");
  });

  it("validates nested recent sessions even when best is empty", () => {
    const recents = [{ date: "", raw: "notes", kind: "mixed", sets: [{ extra: 42 }] }];
    expect(() => parseExportFile({ ...toExportFile([]), exercises: [{ ...lift(), recents }] }))
      .toThrow("exercise 1.recents[0].sets[0].extra");
  });

  it("rejects duplicate IDs rather than allowing one exercise to overwrite another", () => {
    expect(() => parseExportFile(toExportFile([lift(), { ...lift(), name: "Different lift" }])))
      .toThrow('exercise 2.id duplicates "band-pull-apart"');
  });
});

import { describe, expect, it } from "vitest";
import seed from "../seed.json";
import { sheetToExercises } from "./fromSheet";
import { restoreTags } from "./restoreTags";
import { matchesSearch, parseTags } from "./tags";

describe("exercise tags", () => {
  it("splits subcategories and removes blanks and case-insensitive duplicates", () => {
    expect(parseTags(" Fly, Upper Chest, , fly ,")).toEqual(["Fly", "Upper Chest"]);
    expect(parseTags("Anti-Extension (Resist Arching Back)")).toEqual(["Anti-Extension (Resist Arching Back)"]);
  });

  it("restores tags by stable ID while preserving renamed lifts, notes and sessions", () => {
    const original = sheetToExercises(seed).find((ex) => ex.tags?.includes("Upper Chest"))!;
    const { tags: _tags, ...legacy } = original;
    const edited = { ...legacy, name: "My renamed lift", notes: "My cue", recents: original.best ? [original.best] : [] };
    const restored = restoreTags(edited);
    expect(restored).toEqual({ ...edited, tags: original.tags });
    expect(restoreTags(restored)).toBe(restored);
    const cleared = { ...edited, tags: [] };
    expect(restoreTags(cleared)).toBe(cleared);
    const custom = { ...edited, tags: ["Favorite"] };
    expect(restoreTags(custom)).toBe(custom);
    const unmatched = { ...edited, id: "custom-unmatched-lift" };
    expect(restoreTags(unmatched)).toBe(unmatched);
  });

  it("searches across names and tags regardless of case or extra spaces", () => {
    const exercise = { ...sheetToExercises(seed)[0], name: "Dumbbell fly", tags: ["Upper Chest", "Fly"] };
    expect(matchesSearch(exercise, " DUMBBELL   upper chest ")).toBe(true);
    expect(matchesSearch(exercise, "upper barbell")).toBe(false);
    expect(matchesSearch(exercise, "")).toBe(true);
    expect(matchesSearch({ ...exercise, tags: undefined }, "fly")).toBe(true);
    expect(matchesSearch({ ...exercise, tags: undefined }, "upper")).toBe(false);
  });
});

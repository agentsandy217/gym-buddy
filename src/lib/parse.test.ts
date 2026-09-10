import { describe, expect, it } from "vitest";
import { classifySets, parseSetToken, parseSheetDate, parseSnapshot } from "./parse";

describe("parseSnapshot", () => {
  it("parses loaded shorthand", () => {
    const snap = parseSnapshot("90x10, 90x7, 85x8, 80x8", "2025-12-04");
    expect(snap?.kind).toBe("loaded");
    expect(snap?.sets).toEqual([
      { weight: 90, reps: 10 },
      { weight: 90, reps: 7 },
      { weight: 85, reps: 8 },
      { weight: 80, reps: 8 },
    ]);
  });

  it("parses bodyweight reps", () => {
    const snap = parseSnapshot("14, 11, 8", "2026-08-17");
    expect(snap?.kind).toBe("bodyweight");
    expect(snap?.sets.map((s) => s.reps)).toEqual([14, 11, 8]);
  });

  it("parses times and half pounds", () => {
    expect(parseSnapshot("1:40", "2026-08-04")?.sets[0]).toEqual({ seconds: 100 });
    expect(parseSetToken("32.5x8")).toEqual({ weight: 32.5, reps: 8 });
  });

  it("allows spaces around x", () => {
    expect(parseSetToken("90 x 10")).toEqual({ weight: 90, reps: 10 });
    expect(parseSetToken("90 × 10")).toEqual({ weight: 90, reps: 10 });
    const snap = parseSnapshot("90 x 10, 90 x 7, 85x8", "2026-01-01");
    expect(snap?.kind).toBe("loaded");
    expect(snap?.sets[0]).toEqual({ weight: 90, reps: 10 });
  });

  it("keeps parenthetical extras and commas inside them", () => {
    const set = parseSetToken("90x22 (22 left, rest, 22 right)");
    expect(set).toMatchObject({ weight: 90, reps: 22, extra: "22 left, rest, 22 right" });
    const snap = parseSnapshot(
      "90x22 (22 left, rest, 22 right), 90x20 (20 left, rest, 20 right)",
      "2026-02-14",
    );
    expect(snap?.kind).toBe("loaded");
    expect(snap?.sets).toHaveLength(2);
  });

  it("classifies mixed circuits as mixed", () => {
    const snap = parseSnapshot("23, 16, 1:10", "2025-07-10");
    expect(snap?.kind).toBe("mixed");
  });
});

describe("parseSheetDate", () => {
  it("reads M/D/YYYY", () => {
    expect(parseSheetDate("10/29/2025")).toBe("2025-10-29");
    expect(parseSheetDate("7/7/2025")).toBe("2025-07-07");
  });
});

describe("classifySets", () => {
  it("needs weight and reps for loaded", () => {
    expect(classifySets([{ weight: 90, reps: 10 }])).toBe("loaded");
    expect(classifySets([{ reps: 14 }])).toBe("bodyweight");
  });
});

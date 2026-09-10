import { describe, expect, it } from "vitest";
import { parseSnapshot } from "./parse";
import { isBetter } from "./rank";
import { targetLine, targetShort } from "./target";

function snap(raw: string) {
  return parseSnapshot(raw, "2026-01-01")!;
}

describe("isBetter", () => {
  it("ranks by top-set weight then reps, not volume", () => {
    const lowVolume = snap("90x10, 90x6, 85x8, 80x8");
    const highVolume = snap("90x9, 90x8, 85x10, 85x8");
    expect(isBetter(lowVolume, highVolume)).toBe(true);
    expect(isBetter(highVolume, lowVolume)).toBe(false);
  });

  it("treats heavier top set as better", () => {
    expect(isBetter(snap("95x5, 90x8"), snap("90x12, 90x12"))).toBe(true);
  });

  it("keeps the existing best on a tie", () => {
    const a = snap("90x10, 90x7");
    const b = snap("90x10, 90x9");
    expect(isBetter(b, a)).toBe(false);
  });

  it("ranks bodyweight by first-set reps", () => {
    expect(isBetter(snap("15, 12, 10"), snap("14, 11, 8"))).toBe(true);
  });

  it("does not auto-compare mixed or mismatched kinds", () => {
    expect(isBetter(snap("23, 16, 1:10"), snap("20, 15, 1:00"))).toBe(false);
    expect(isBetter(snap("14, 11, 8"), snap("25x8, 15x9"))).toBe(false);
  });
});

describe("targetShort", () => {
  it("prints weight x top-set reps", () => {
    expect(targetShort(snap("90x10, 90x7, 85x8, 80x8"))).toBe("90x10");
    expect(targetShort(snap("14, 11, 8"))).toBe("14");
  });
});

describe("targetLine", () => {
  it("omits a sentence when the session is not a clean loaded/bodyweight/timed log", () => {
    expect(targetLine(snap("23, 16, 1:10"))).toBe("");
    expect(targetLine(snap("90x10, 90x7"))).toBe("Start 90. Beat 10.");
  });
});

import { describe, expect, it } from "vitest";
import seed from "../seed.json";
import type { SheetRow } from "../types";
import { inferDayTypes, inferEquipment, inferMuscle, sheetToExercises } from "./fromSheet";

describe("seed", () => {
  it("drops follow-along videos", () => {
    const rows = seed as SheetRow[];
    expect(rows.some((r) => /youtube|http/i.test(r.best))).toBe(false);
    expect(rows.some((r) => /video/i.test(r.category) || /video/i.test(r.subCategory))).toBe(
      false,
    );
    expect(rows.length).toBeGreaterThan(120);
    expect(rows.some((r) => r.name.includes("Dumbbell") && r.name.includes("Bench"))).toBe(
      true,
    );
  });
});

describe("inference", () => {
  it("maps the bench example to push / chest / dumbbell", () => {
    const row = {
      name: "Bench Press Flat Dumbbell x4",
      category: "Chest",
      subCategory: "Heavy Press, General",
      best: "90x10, 90x7, 85x8, 80x8",
      bestDate: "12/4/2025",
      notes: "",
    };
    expect(inferEquipment(row.name)).toBe("dumbbell");
    expect(inferMuscle(row)).toBe("chest");
    expect(inferDayTypes(row, "chest")).toEqual(["push"]);
  });

  it("keeps separate names as separate lifts", () => {
    const list = sheetToExercises([
      {
        name: "T-Bar Row",
        category: "Back",
        subCategory: "Row",
        best: "125x10",
        bestDate: "2/7/2025",
        notes: "",
      },
      {
        name: "T-Bar Row x4",
        category: "Back",
        subCategory: "Row",
        best: "145x8",
        bestDate: "10/17/2025",
        notes: "",
      },
    ]);
    expect(list).toHaveLength(2);
    expect(list[0].id).not.toBe(list[1].id);
  });
});

import type {
  DayType,
  Equipment,
  Exercise,
  Muscle,
  SheetRow,
} from "../types";
import { parseSheetDate, parseSnapshot } from "./parse";

export function slug(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "exercise";
}

export function uniqueId(name: string, existing: Iterable<string>): string {
  const used = new Set(existing);
  let id = slug(name);
  if (used.has(id)) {
    let n = 2;
    while (used.has(`${id}-${n}`)) n++;
    id = `${id}-${n}`;
  }
  return id;
}

export function inferEquipment(name: string): Equipment {
  const n = name.toLowerCase();
  if (/\bhex bar\b/.test(n)) return "hex-bar";
  if (/\blandmine\b/.test(n)) return "landmine";
  if (/\bkettlebell\b/.test(n)) return "kettlebell";
  if (/\bband\b/.test(n)) return "band";
  if (/\bcable\b/.test(n)) return "cable";
  if (/\bdumbbell\b/.test(n)) return "dumbbell";
  if (/\bw bar\b/.test(n) || /\bbarbell\b/.test(n)) return "barbell";
  if (/\bmachine\b/.test(n)) return "machine";
  if (
    /pull ups?|chin ups?|push ups?|dips?|plank|hang|ab wheel|burpee|jump rope|mountain climber|hollow|dead bugs?|crunch|sit ups?|pistol|nordic|wall sit|box jump|jump squat|jump lunge|skater|inverted row|scapular|prone glute|calf raise bodyweight/.test(
      n,
    )
  ) {
    return "bodyweight";
  }
  if (/^squat\b|incline bench press x|t-bar row|hip thrust \(barbell\)/.test(n)) {
    return "barbell";
  }
  return "other";
}

export function inferMuscle(row: SheetRow): Muscle {
  const cat = row.category.toLowerCase();
  const sub = row.subCategory.toLowerCase();
  const n = row.name.toLowerCase();
  if (cat === "back") return "back";
  if (cat === "biceps") return "biceps";
  if (cat === "chest") return "chest";
  if (cat === "core") return "core";
  if (cat === "delts") return "shoulders";
  if (cat === "triceps") return "triceps";
  if (cat === "full body") return "full-body";
  if (cat === "lower body") {
    if (sub.includes("calves") || n.includes("calf")) return "calves";
    if (sub.includes("glutes") || n.includes("glute") || n.includes("hip thrust") || n.includes("kickback")) {
      return "glutes";
    }
    if (sub.includes("hamstrings") || n.includes("romanian") || n.includes("nordic") || n.includes("leg curl")) {
      return "hamstrings";
    }
    if (sub.includes("quads") || n.includes("leg extension")) return "quads";
    if (n.includes("hip thrust")) return "glutes";
    return "quads";
  }
  return "other";
}

export function inferDayTypes(row: SheetRow, muscle: Muscle): DayType[] {
  const sub = row.subCategory.toLowerCase();
  if (muscle === "back" || muscle === "biceps") return ["pull"];
  if (muscle === "chest" || muscle === "triceps") return ["push"];
  if (muscle === "shoulders") {
    if (sub.includes("posterior") || sub.includes("traps") || sub.includes("mobility")) {
      return ["pull"];
    }
    return ["push"];
  }
  if (
    muscle === "quads" ||
    muscle === "hamstrings" ||
    muscle === "glutes" ||
    muscle === "calves"
  ) {
    return ["legs"];
  }
  return ["other"];
}

export function sheetToExercise(row: SheetRow, usedIds: Set<string>): Exercise {
  const id = uniqueId(row.name, usedIds);
  usedIds.add(id);
  const date = parseSheetDate(row.bestDate) ?? "";
  const best = row.best ? parseSnapshot(row.best, date || "1970-01-01") : null;
  if (best && !date) best.date = "";
  const muscle = inferMuscle(row);
  return {
    id,
    name: row.name,
    equipment: inferEquipment(row.name),
    muscle,
    dayTypes: inferDayTypes(row, muscle),
    notes: row.notes,
    best,
    recents: [],
  };
}

export function sheetToExercises(rows: SheetRow[]): Exercise[] {
  const used = new Set<string>();
  return rows.map((row) => sheetToExercise(row, used));
}



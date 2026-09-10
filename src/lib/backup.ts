import { DAY_TYPES, EQUIPMENT, MUSCLES, type Exercise } from "../types";

function invalid(path: string, reason: string): never {
  throw new Error(`Invalid backup: ${path} ${reason}. Nothing was imported.`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid(path, "must be an object");
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string, nonempty = false): string {
  if (typeof value !== "string" || (nonempty && !value.trim())) {
    invalid(path, nonempty ? "must be nonempty text" : "must be text");
  }
  return value;
}

function choice(value: unknown, options: readonly string[], path: string): void {
  if (typeof value !== "string" || !options.includes(value)) {
    invalid(path, `must be one of: ${options.join(", ")}`);
  }
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) invalid(path, "must be a list");
  return value;
}

function snapshot(value: unknown, path: string): void {
  const snap = record(value, path);
  // Empty dates and free-text snapshots are supported by the spreadsheet import.
  string(snap.date, `${path}.date`);
  string(snap.raw, `${path}.raw`);
  choice(snap.kind, ["loaded", "bodyweight", "timed", "mixed"], `${path}.kind`);
  const sets = array(snap.sets, `${path}.sets`);
  if (snap.kind !== "mixed" && sets.length === 0) {
    invalid(`${path}.sets`, "must contain a set for this snapshot kind");
  }
  sets.forEach((value, index) => {
    const setPath = `${path}.sets[${index}]`;
    const set = record(value, setPath);
    for (const field of ["weight", "reps", "seconds"] as const) {
      if (field in set) {
        const number = set[field];
        if (typeof number !== "number" || !Number.isFinite(number) || number < 0) {
          invalid(`${setPath}.${field}`, "must be a finite, nonnegative number");
        }
        if (field !== "weight" && !Number.isInteger(number)) {
          invalid(`${setPath}.${field}`, "must be a whole number");
        }
      }
    }
    if ("extra" in set) string(set.extra, `${setPath}.extra`);
    if (snap.kind === "loaded" && !("weight" in set && "reps" in set)) {
      invalid(setPath, "must include weight and reps for a loaded snapshot");
    }
    if (snap.kind === "bodyweight" && !("reps" in set)) {
      invalid(setPath, "must include reps for a bodyweight snapshot");
    }
    if (snap.kind === "timed" && !("seconds" in set)) {
      invalid(setPath, "must include seconds for a timed snapshot");
    }
  });
}

/** Validate the entire backup before the caller opens a write transaction. */
export function parseExportFile(value: unknown): Exercise[] {
  const data = record(value, "file");
  if (data.version !== 1) invalid("version", "must be 1");
  string(data.exportedAt, "exportedAt");
  const exercises = array(data.exercises, "exercises");
  const ids = new Set<string>();

  exercises.forEach((value, index) => {
    const path = `exercise ${index + 1}`;
    const exercise = record(value, path);
    const id = string(exercise.id, `${path}.id`, true);
    if (ids.has(id)) invalid(`${path}.id`, `duplicates "${id}"`);
    ids.add(id);
    string(exercise.name, `${path}.name`, true);
    choice(exercise.equipment, EQUIPMENT, `${path}.equipment`);
    choice(exercise.muscle, MUSCLES, `${path}.muscle`);
    array(exercise.dayTypes, `${path}.dayTypes`).forEach((day, index) => {
      choice(day, DAY_TYPES, `${path}.dayTypes[${index}]`);
    });
    string(exercise.notes, `${path}.notes`);
    // A new lift or an exercise tracked by feel legitimately has no best.
    if (exercise.best !== null) snapshot(exercise.best, `${path}.best`);
    array(exercise.recents, `${path}.recents`).forEach((recent, index) => {
      snapshot(recent, `${path}.recents[${index}]`);
    });
  });

  return exercises as Exercise[];
}

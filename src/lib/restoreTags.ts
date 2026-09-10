import seedRows from "../seed.json";
import type { Exercise } from "../types";
import { sheetToExercises } from "./fromSheet";

const originals = new Map(sheetToExercises(seedRows).map((exercise) => [exercise.id, exercise]));

export function restoreTags(exercise: Exercise): Exercise {
  // An explicit empty list means the user removed their tags. Preserve it.
  if (exercise.tags !== undefined) return exercise;
  const original = originals.get(exercise.id);
  return original ? { ...exercise, tags: [...(original.tags ?? [])] } : exercise;
}

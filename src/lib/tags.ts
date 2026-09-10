import type { Exercise } from "../types";

export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  return text.split(",").map((tag) => tag.trim()).filter((tag) => {
    const key = tag.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function matchesSearch(exercise: Exercise, query: string): boolean {
  const text = [exercise.name, ...(exercise.tags ?? [])].join(" ").toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every((word) => text.includes(word));
}

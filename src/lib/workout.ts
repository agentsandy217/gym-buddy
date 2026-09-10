import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "../types";

const WORKOUT_KEY = "gym-buddy-workout";

export type WorkoutError = { operation: "load" | "save"; details: string };

function details(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/** One ordered list of IDs; exercise details and bests always come from the library. */
export function useWorkout(exercises: Exercise[], libraryReady: boolean) {
  const [ids, setIds] = useState<string[]>([]);
  const current = useRef<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<WorkoutError | null>(null);
  const available = useMemo(() => new Set(exercises.map((exercise) => exercise.id)), [exercises]);

  const retry = useCallback(() => {
    try {
      const raw = localStorage.getItem(WORKOUT_KEY);
      const saved: unknown = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.every((id) => typeof id === "string" && id.trim())) {
        throw new Error("The saved workout list is not a list of exercise IDs.");
      }
      const next = [...new Set(saved as string[])];
      current.current = next;
      setIds(next);
      setLoaded(true);
      setError(null);
    } catch (error) {
      setLoaded(false);
      setError({ operation: "load", details: details(error) });
    }
  }, []);

  useEffect(() => {
    if (libraryReady) retry();
  }, [libraryReady, retry]);

  const update = useCallback((change: (ids: string[]) => string[]): boolean => {
    if (!libraryReady || !loaded) return false;
    const next = [...new Set(change(current.current))].filter((id) => available.has(id));
    try {
      // Save before updating the screen so a failed write never looks successful.
      localStorage.setItem(WORKOUT_KEY, JSON.stringify(next));
      current.current = next;
      setIds(next);
      setError(null);
      return true;
    } catch (error) {
      setError({ operation: "save", details: details(error) });
      return false;
    }
  }, [available, libraryReady, loaded]);

  // Remove references to deleted lifts, including after restoring a different library.
  useEffect(() => {
    if (ids.some((id) => !available.has(id))) update((ids) => ids);
  }, [ids, available, update]);

  const add = useCallback((id: string) => {
    if (!available.has(id) || current.current.includes(id)) return false;
    return update((ids) => [...ids, id]);
  }, [available, update]);

  const remove = useCallback((id: string) => update((ids) => ids.filter((item) => item !== id)), [update]);
  const clear = useCallback(() => update(() => []), [update]);
  const move = useCallback((id: string, direction: -1 | 1) => update((ids) => {
    const next = [...ids];
    const index = next.indexOf(id);
    const target = index + direction;
    if (index !== -1 && target >= 0 && target < next.length) {
      [next[index], next[target]] = [next[target], next[index]];
    }
    return next;
  }), [update]);

  const selected = useMemo(() => ids.filter((id) => available.has(id)), [ids, available]);
  return { ids: selected, ready: libraryReady && loaded, error, retry, add, remove, move, clear };
}

export type WorkoutList = ReturnType<typeof useWorkout>;

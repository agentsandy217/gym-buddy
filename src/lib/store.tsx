import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import seedRows from "../seed.json";
import type { Exercise, SheetRow, Snapshot } from "../types";
import { deleteOne, importBackup, loadAll, saveAll, saveOne, toExportFile } from "./db";
import { sheetToExercises } from "./fromSheet";
import { formatSnapshot, parseSnapshot, todayISO } from "./parse";
import { isBetter } from "./rank";
import { useWorkout, type WorkoutList } from "./workout";

export type LoadError = {
  stage: "read" | "seed" | "prepare";
  details: string;
};

function errorDetails(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    const name = "name" in error && typeof error.name === "string" ? error.name : "Error";
    return `${name}: ${error.message}`;
  }
  if (typeof error === "string" && error) return error;
  return "The browser did not provide additional error details.";
}

type Store = {
  ready: boolean;
  loadError: LoadError | null;
  retryLoad: () => void;
  exercises: Exercise[];
  workout: WorkoutList;
  byId: (id: string) => Exercise | undefined;
  upsert: (exercise: Exercise) => Promise<void>;
  remove: (id: string) => Promise<void>;
  log: (
    id: string,
    raw: string,
    date: string,
  ) => Promise<{ exercise: Exercise; newBest: boolean }>;
  setBest: (id: string, snap: Snapshot) => Promise<void>;
  exportJson: () => string;
  importJson: (text: string) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function sortExercises(list: Exercise[]): Exercise[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const workout = useWorkout(exercises, ready);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setReady(false);
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stage: LoadError["stage"] = "read";
      try {
        const existing = await loadAll();
        if (cancelled) return;
        let loaded = existing;
        if (existing.length === 0) {
          stage = "seed";
          loaded = sheetToExercises(seedRows as SheetRow[]);
          await saveAll(loaded);
        }
        if (cancelled) return;
        stage = "prepare";
        setExercises(sortExercises(loaded));
        setReady(true);
      } catch (error) {
        if (!cancelled) setLoadError({ stage, details: errorDetails(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const byId = useCallback(
    (id: string) => exercises.find((e) => e.id === id),
    [exercises],
  );

  const upsert = useCallback(async (exercise: Exercise) => {
    await saveOne(exercise);
    setExercises((prev) => {
      const i = prev.findIndex((e) => e.id === exercise.id);
      const next = i === -1 ? [...prev, exercise] : prev.map((e) => (e.id === exercise.id ? exercise : e));
      return sortExercises(next);
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteOne(id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const log = useCallback(
    async (id: string, raw: string, date: string) => {
      const current = exercises.find((e) => e.id === id);
      if (!current) throw new Error("Exercise not found");
      const snap = parseSnapshot(raw, date || todayISO());
      if (!snap) throw new Error("Type a session like 90x10, 90x7, 85x8");
      snap.raw = formatSnapshot(snap);
      const newBest = isBetter(snap, current.best);
      const recents = [snap, ...current.recents].slice(0, 20);
      const next: Exercise = {
        ...current,
        recents,
        best: newBest ? snap : current.best,
      };
      await saveOne(next);
      setExercises((prev) => sortExercises(prev.map((e) => (e.id === id ? next : e))));
      return { exercise: next, newBest };
    },
    [exercises],
  );

  const setBest = useCallback(
    async (id: string, snap: Snapshot) => {
      const current = exercises.find((e) => e.id === id);
      if (!current) throw new Error("Exercise not found");
      const next = { ...current, best: snap };
      await saveOne(next);
      setExercises((prev) => sortExercises(prev.map((e) => (e.id === id ? next : e))));
    },
    [exercises],
  );

  const exportJson = useCallback(() => {
    if (!ready) throw new Error("Saved lifts must load successfully before exporting a backup.");
    return JSON.stringify(toExportFile(exercises), null, 2);
  }, [ready, exercises]);

  const importJson = useCallback(async (text: string) => {
    const list = await importBackup(text);
    setExercises(sortExercises(list));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      loadError,
      retryLoad,
      exercises,
      workout,
      byId,
      upsert,
      remove,
      log,
      setBest,
      exportJson,
      importJson,
    }),
    [ready, loadError, retryLoad, exercises, workout, byId, upsert, remove, log, setBest, exportJson, importJson],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

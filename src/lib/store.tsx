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
import { deleteOne, loadAll, parseExportFile, saveAll, saveOne, toExportFile } from "./db";
import { sheetToExercises } from "./fromSheet";
import { formatSnapshot, parseSnapshot, todayISO } from "./parse";
import { isBetter } from "./rank";

type Store = {
  ready: boolean;
  exercises: Exercise[];
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
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await loadAll();
      if (cancelled) return;
      if (existing.length === 0) {
        const seeded = sheetToExercises(seedRows as SheetRow[]);
        await saveAll(seeded);
        if (!cancelled) setExercises(sortExercises(seeded));
      } else {
        setExercises(sortExercises(existing));
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const exportJson = useCallback(() => JSON.stringify(toExportFile(exercises), null, 2), [exercises]);

  const importJson = useCallback(async (text: string) => {
    const list = parseExportFile(JSON.parse(text));
    await saveAll(list);
    setExercises(sortExercises(list));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      exercises,
      byId,
      upsert,
      remove,
      log,
      setBest,
      exportJson,
      importJson,
    }),
    [ready, exercises, byId, upsert, remove, log, setBest, exportJson, importJson],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

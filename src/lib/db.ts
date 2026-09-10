import type { Exercise, ExportFile } from "../types";

const DB_NAME = "gym-buddy";
const DB_VERSION = 1;
const STORE = "exercises";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadAll(): Promise<Exercise[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as Exercise[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAll(exercises: Exercise[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  store.clear();
  for (const ex of exercises) store.put(ex);
  await txDone(tx);
}

export async function saveOne(exercise: Exercise): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(exercise);
  await txDone(tx);
}

export async function deleteOne(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
}

export function toExportFile(exercises: Exercise[]): ExportFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
  };
}

export function parseExportFile(raw: unknown): Exercise[] {
  if (!raw || typeof raw !== "object") throw new Error("Not a Gym Buddy backup.");
  const data = raw as Partial<ExportFile>;
  if (data.version !== 1 || !Array.isArray(data.exercises)) {
    throw new Error("Not a Gym Buddy backup.");
  }
  return data.exercises;
}

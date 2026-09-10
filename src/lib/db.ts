import type { Exercise, ExportFile } from "../types";
import { parseExportFile } from "./backup";
import { restoreTags } from "./restoreTags";

const DB_NAME = "gym-buddy";
const DB_VERSION = 2;
const SETTINGS = "settings";
const STORE = "exercises";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS);
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
  try {
    return await new Promise<Exercise[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      tx.oncomplete = () => resolve(req.result as Exercise[]);
      tx.onerror = () => reject(tx.error ?? req.error ?? new Error("Reading the local database failed."));
      tx.onabort = () => reject(tx.error ?? new Error("Reading the local database was interrupted (transaction aborted)."));
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function saveAll(exercises: Exercise[], programNotes?: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(programNotes === undefined ? [STORE] : [STORE, SETTINGS], "readwrite");
  if (programNotes !== undefined) tx.objectStore(SETTINGS).put(programNotes, "programNotes");
  const store = tx.objectStore(STORE);
  store.clear();
  for (const ex of exercises) store.put(ex);
  try { await txDone(tx); } finally { db.close(); }
}

export async function saveOne(exercise: Exercise): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(exercise);
  try { await txDone(tx); } finally { db.close(); }
}

export async function deleteOne(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  try { await txDone(tx); } finally { db.close(); }
}

export function toExportFile(exercises: Exercise[], programNotes?: string): ExportFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    ...(programNotes === undefined ? {} : { programNotes }),
  };
}

export async function importBackup(text: string): Promise<Exercise[]> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Invalid backup: the file is not valid JSON. Nothing was imported.");
  }
  const exercises = parseExportFile(raw).map(restoreTags);
  await saveAll(exercises, (raw as ExportFile).programNotes);
  return exercises;
}

export async function loadProgramNotes(): Promise<string> {
  const db = await openDb();
  try {
    const tx = db.transaction(SETTINGS, "readonly");
    const request = tx.objectStore(SETTINGS).get("programNotes");
    await txDone(tx);
    return request.result ?? "";
  } finally { db.close(); }
}

export async function saveProgramNotes(notes: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(SETTINGS, "readwrite");
    tx.objectStore(SETTINGS).put(notes, "programNotes");
    await txDone(tx);
  } finally { db.close(); }
}

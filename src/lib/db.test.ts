import { IDBDatabase, IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise } from "../types";
import { importBackup, loadAll, saveAll, toExportFile } from "./db";
import { parseSnapshot } from "./parse";

const existing: Exercise = {
  id: "bench",
  name: "Bench press",
  equipment: "dumbbell",
  muscle: "chest",
  dayTypes: ["push"],
  notes: "Saved form cue",
  best: parseSnapshot("90x10, 90x7", "2026-09-10"),
  recents: [parseSnapshot("85x10", "2026-09-09")!],
};

const band: Exercise = {
  id: "band",
  name: "Band pull apart",
  equipment: "band",
  muscle: "shoulders",
  dayTypes: ["pull"],
  notes: "Go by feel",
  best: null,
  recents: [],
};

describe("importBackup", () => {
  beforeEach(async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    await saveAll([existing]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["invalid JSON", "{"],
    ["broken exercise after a valid one", JSON.stringify({ ...toExportFile([band]), exercises: [band, { id: "broken" }] })],
    ["duplicate IDs", JSON.stringify(toExportFile([band, { ...band, name: "Duplicate" }]))],
    ["broken recent session", JSON.stringify({ ...toExportFile([]), exercises: [{ ...band, recents: [{}] }] })],
  ])("preserves all saved records when rejecting %s", async (_reason, text) => {
    const open = vi.spyOn(indexedDB, "open");
    await expect(importBackup(text)).rejects.toThrow(/Nothing was imported/);
    // Validation must finish before any database access, including a clear.
    expect(open).not.toHaveBeenCalled();
    expect(await loadAll()).toEqual([existing]);
  });

  it("restores a valid export, preserving empty bests and feel-based snapshots", async () => {
    const notes = parseSnapshot("Light band, went by feel", "")!;
    const replacement = [band, { ...band, id: "band-notes", best: notes, recents: [notes] }];
    const restored = await importBackup(JSON.stringify(toExportFile(replacement)));
    expect(restored).toEqual(replacement);
    expect(await loadAll()).toEqual(replacement);
  });

  it("round-trips saved numeric bests and recent sessions", async () => {
    const exported = JSON.stringify(toExportFile(await loadAll()));
    await saveAll([band]);
    await importBackup(exported);
    expect(await loadAll()).toEqual([existing]);
  });
});

describe("database read failures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("propagates errors opening the database", async () => {
    vi.stubGlobal("indexedDB", {
      open: () => { throw new DOMException("Access denied", "SecurityError"); },
    });
    await expect(loadAll()).rejects.toMatchObject({ name: "SecurityError", message: "Access denied" });
  });

  it("rejects an aborted read instead of leaving startup waiting indefinitely", async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    await saveAll([existing]);
    const transaction = IDBDatabase.prototype.transaction;
    vi.spyOn(IDBDatabase.prototype, "transaction").mockImplementationOnce(function (this: IDBDatabase, ...args) {
      const tx = transaction.apply(this, args);
      queueMicrotask(() => tx.abort());
      return tx;
    });
    await expect(loadAll()).rejects.toBeTruthy();
    expect(await loadAll()).toEqual([existing]);
  });

  it("reports a transaction aborted after the read request succeeds", async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    await saveAll([existing]);
    const getAll = IDBObjectStore.prototype.getAll;
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementationOnce(function (this: IDBObjectStore, ...args) {
      const request = getAll.apply(this, args);
      request.addEventListener("success", () => this.transaction.abort());
      return request;
    });
    await expect(loadAll()).rejects.toThrow("Reading the local database was interrupted (transaction aborted).");
    expect(await loadAll()).toEqual([existing]);
  });
});

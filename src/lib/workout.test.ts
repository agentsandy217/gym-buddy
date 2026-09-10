// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import type { Exercise } from "../types";
import { deleteOne, importBackup, loadAll, saveAll, saveOne } from "./db";
import { parseSnapshot } from "./parse";
import { StoreProvider, useStore } from "./store";

vi.mock("./db", async (importOriginal) => ({
  ...await importOriginal<typeof import("./db")>(),
  loadAll: vi.fn(),
  loadProgramNotes: vi.fn().mockResolvedValue(""),
  saveProgramNotes: vi.fn().mockResolvedValue(undefined), saveAll: vi.fn(), saveOne: vi.fn(), deleteOne: vi.fn(), importBackup: vi.fn(),
}));

const key = "gym-buddy-workout";
const bench: Exercise = {
  id: "bench", name: "Bench press", muscle: "chest", equipment: "dumbbell", dayTypes: ["push"],
  notes: "Form cue", best: parseSnapshot("90x10, 90x7", "2026-09-10"), recents: [],
};
const band: Exercise = {
  id: "band", name: "Band pull apart", muscle: "shoulders", equipment: "band", dayTypes: ["pull"],
  notes: "By feel", best: null, recents: [],
};
const row: Exercise = { ...bench, id: "row", name: "Cable row", muscle: "back", equipment: "cable", dayTypes: ["pull"] };
const library = [band, bench, row];

let root: Root;
let container: HTMLDivElement;
let store: ReturnType<typeof useStore>;

function Screen() {
  store = useStore();
  return createElement(App);
}

async function mount() {
  root = createRoot(container);
  await act(async () => root.render(createElement(StoreProvider, null, createElement(Screen))));
}

async function reopen() {
  await act(async () => root.unmount());
  await mount();
}

function button(label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll<HTMLButtonElement>("button")]
    .find((button) => (button.getAttribute("aria-label") ?? button.textContent) === label);
  expect(found, `Button: ${label}`).toBeDefined();
  return found!;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

function names() {
  return [...container.querySelectorAll(".workout-list .lift-name")].map((name) => name.textContent);
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/#/lifts");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.mocked(loadAll).mockReset().mockResolvedValue(structuredClone(library));
  vi.mocked(saveAll).mockReset().mockResolvedValue(undefined);
  vi.mocked(saveOne).mockReset().mockResolvedValue(undefined);
  vi.mocked(deleteOne).mockReset().mockResolvedValue(undefined);
  vi.mocked(importBackup).mockReset();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("current workout", () => {
  it("adds across muscle filters without navigating or duplicating rapid taps", async () => {
    await mount();
    await click("Chest");
    const add = button("Add Bench press to workout");
    await act(async () => { add.click(); add.click(); });
    expect(window.location.hash).toBe("#/lifts");
    expect(button("Bench press is in your workout").disabled).toBe(true);
    await click("Back");
    await click("Add Cable row to workout");
    await click("Shoulders");
    await click("Add Band pull apart to workout");
    await click("Workout");
    expect(names()).toEqual(["Bench press", "Cable row", "Band pull apart"]);
    expect(container.querySelector("nav .on")?.textContent).toBe("Workout");
    expect(container.querySelector(".lift-do")?.textContent).toBe("90x10");
    expect(container.querySelector(".lift-date")?.textContent).toBe("Sep 10");
    expect(container.querySelector(".workout-list")?.textContent).toContain("No best yet");
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(["bench", "row", "band"]);
    expect(saveOne).not.toHaveBeenCalled();
  });

  it("persists order and removals across reopening, and clears only the queue", async () => {
    localStorage.setItem(key, JSON.stringify(["bench", "band", "row"]));
    window.history.replaceState(null, "", "/#/workout");
    await mount();
    expect(button("Move Bench press up").disabled).toBe(true);
    expect(button("Move Cable row down").disabled).toBe(true);
    await click("Move Band pull apart up");
    await click("Move Bench press down");
    expect(names()).toEqual(["Band pull apart", "Cable row", "Bench press"]);
    await reopen();
    expect(names()).toEqual(["Band pull apart", "Cable row", "Bench press"]);
    await click("Remove Cable row from workout");
    await reopen();
    expect(names()).toEqual(["Band pull apart", "Bench press"]);
    await click("Clear list");
    expect(container.textContent).toContain("Add exercises from Lifts");
    expect(button("Clear list").disabled).toBe(true);
    await reopen();
    expect(names()).toEqual([]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([]);
    expect(store.exercises).toEqual(library);
    expect(deleteOne).not.toHaveBeenCalled();
    expect(saveOne).not.toHaveBeenCalled();
    await click("Add exercises");
    expect(container.querySelector("h1")?.textContent).toBe("Lifts");
    expect(button("Add Bench press to workout").disabled).toBe(false);
  });

  it("opens normal lift details and reflects a new best in the queued row", async () => {
    localStorage.setItem(key, JSON.stringify(["bench"]));
    window.history.replaceState(null, "", "/#/workout");
    await mount();
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".lift-row")!.click();
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(window.location.hash).toBe("#/e/bench");
    expect(container.querySelector(".notes")?.textContent).toBe("Form cue");
    expect(button("Save session")).toBeDefined();
    await act(async () => { await store.log("bench", "95x10, 90x8", "2026-09-11"); });
    await act(async () => {
      window.location.hash = "#/workout";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(container.querySelector(".lift-do")?.textContent).toBe("95x10");
    expect(container.querySelector(".lift-date")?.textContent).toBe("Sep 11");
    expect(store.workout.ids).toEqual(["bench"]);
  });

  it("prunes deleted or missing lifts and never creates duplicate queue entries", async () => {
    localStorage.setItem(key, JSON.stringify(["bench", "gone", "band", "bench"]));
    window.history.replaceState(null, "", "/#/workout");
    await mount();
    expect(names()).toEqual(["Bench press", "Band pull apart"]);
    await act(async () => { await store.remove("bench"); });
    expect(names()).toEqual(["Band pull apart"]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(["band"]);
  });

  it("keeps only IDs still present after a backup replaces the library", async () => {
    localStorage.setItem(key, JSON.stringify(["bench", "band"]));
    window.history.replaceState(null, "", "/#/workout");
    vi.mocked(importBackup).mockResolvedValue([band]);
    await mount();
    await act(async () => { await store.importJson("valid backup"); });
    expect(names()).toEqual(["Band pull apart"]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(["band"]);
  });

  it("leaves the saved selection intact and reports details if a write fails", async () => {
    localStorage.setItem(key, JSON.stringify(["bench"]));
    await mount();
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    });
    await click("Add Band pull apart to workout");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Couldn’t save");
    expect(container.querySelector("details")?.textContent).toContain("QuotaExceededError");
    expect(store.workout.ids).toEqual(["bench"]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(["bench"]);
    expect(button("Add Band pull apart to workout").disabled).toBe(false);
    await click("Add Band pull apart to workout");
    expect(store.workout.ids).toEqual(["bench", "band"]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("does not clear the current list when persisting Clear list fails", async () => {
    localStorage.setItem(key, JSON.stringify(["bench", "band"]));
    window.history.replaceState(null, "", "/#/workout");
    await mount();
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("Write failed"); });
    await click("Clear list");
    expect(names()).toEqual(["Bench press", "Band pull apart"]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(["bench", "band"]);
    await click("Clear list");
    expect(names()).toEqual([]);
  });

  it("reports a read failure and retries without overwriting the stored list", async () => {
    localStorage.setItem(key, JSON.stringify(["bench"]));
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new DOMException("Storage access denied", "SecurityError");
    });
    await mount();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Couldn’t load your workout list");
    expect(button("Add Bench press to workout").disabled).toBe(true);
    expect(localStorage.getItem(key)).toBe('["bench"]');
    await click("Try again");
    expect(store.workout.ids).toEqual(["bench"]);
    expect(button("Bench press is in your workout").disabled).toBe(true);
  });

  it.each(["{", '{"wrong":"shape"}', '["bench",null]'])("preserves a malformed saved list %s and blocks overwriting it", async (raw) => {
    localStorage.setItem(key, raw);
    window.history.replaceState(null, "", "/#/workout");
    await mount();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Couldn’t load");
    expect(button("Clear list").disabled).toBe(true);
    expect(localStorage.getItem(key)).toBe(raw);
  });
});

// @vitest-environment jsdom
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import type { Exercise } from "../types";
import { loadAll, saveAll } from "./db";
import { StoreProvider, useStore } from "./store";

vi.mock("./db", async (importOriginal) => ({
  ...await importOriginal<typeof import("./db")>(),
  loadAll: vi.fn(),
  saveAll: vi.fn(),
}));

const exercise: Exercise = {
  id: "band", name: "Band pull apart", equipment: "band", muscle: "shoulders",
  dayTypes: ["pull"], notes: "Go by feel", best: null, recents: [],
};

let container: HTMLDivElement;
let root: Root;
let store: ReturnType<typeof useStore>;

function Screen() {
  store = useStore();
  return createElement(App);
}

async function render(strict = false) {
  await act(async () => {
    const app = createElement(StoreProvider, null, createElement(Screen));
    root.render(strict ? createElement(StrictMode, null, app) : app);
  });
}

async function retry() {
  const button = container.querySelector("button")!;
  expect(button.textContent).toBe("Try again");
  await act(async () => button.click());
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.mocked(loadAll).mockReset();
  vi.mocked(saveAll).mockReset().mockResolvedValue(undefined);
  // Even a direct link to Backup must be gated on successful loading.
  window.location.hash = "#/backup";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("startup recovery", () => {
  it("identifies a read failure, exposes browser details, and blocks empty exports", async () => {
    vi.mocked(loadAll).mockRejectedValue(new DOMException("Storage access denied", "SecurityError"));
    await render();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("couldn’t read");
    expect(container.querySelector("details")?.textContent).toContain("SecurityError: Storage access denied");
    expect(container.querySelector("details")?.textContent).toContain("Database: gym-buddy");
    expect(container.querySelector("details")?.textContent).toContain("Store: exercises");
    expect(container.textContent).not.toContain("Export");
    expect(() => store.exportJson()).toThrow("must load successfully");
    expect(store.ready).toBe(false);
    expect(saveAll).not.toHaveBeenCalled();
  });

  it("shows loading during retry and restores normal access once the read succeeds", async () => {
    let resolve!: (exercises: Exercise[]) => void;
    vi.mocked(loadAll)
      .mockRejectedValueOnce(new Error("Temporary read failure"))
      .mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    await render();
    await retry();
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Loading saved lifts");
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("details")).toBeNull();
    expect(() => store.exportJson()).toThrow("must load successfully");
    await act(async () => resolve([exercise]));
    expect(store.ready).toBe(true);
    expect(store.loadError).toBeNull();
    expect(container.textContent).toContain("1 lifts live on this phone");
    expect(JSON.parse(store.exportJson()).exercises).toEqual([exercise]);
    expect(loadAll).toHaveBeenCalledTimes(2);
    expect(saveAll).not.toHaveBeenCalled();
  });

  it("shows the latest error and allows another retry if the second read also fails", async () => {
    vi.mocked(loadAll)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockRejectedValueOnce(new Error("Second failure"));
    await render();
    await retry();
    expect(container.querySelector("details")?.textContent).toContain("Second failure");
    expect(container.querySelector("button")?.textContent).toBe("Try again");
    expect(saveAll).not.toHaveBeenCalled();
  });

  it("reports initialization failures separately and can retry first-run setup", async () => {
    vi.mocked(loadAll).mockResolvedValue([]);
    vi.mocked(saveAll)
      .mockRejectedValueOnce(new DOMException("Storage is full", "QuotaExceededError"))
      .mockResolvedValueOnce(undefined);
    await render();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("couldn’t initialize");
    expect(container.querySelector("details")?.textContent).toContain("QuotaExceededError: Storage is full");
    expect(store.ready).toBe(false);
    await retry();
    expect(store.ready).toBe(true);
    expect(store.exercises).toHaveLength(148);
  });

  it("distinguishes unusable saved records from a database read failure", async () => {
    vi.mocked(loadAll).mockResolvedValue([exercise, { ...exercise, name: null } as unknown as Exercise]);
    await render();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("couldn’t prepare");
    expect(container.querySelector("details")?.textContent).toContain("TypeError");
    expect(saveAll).not.toHaveBeenCalled();
  });

  it.each([
    [null, "The browser did not provide additional error details."],
    ["Read failed", "Read failed"],
  ])("handles a failure without a standard Error object: %j", async (error, message) => {
    vi.mocked(loadAll).mockRejectedValue(error);
    await render();
    expect(container.querySelector("details")?.textContent).toContain(message);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("local database");
  });

  it("ignores a stale startup failure after the active StrictMode attempt succeeds", async () => {
    let reject!: (error: Error) => void;
    vi.mocked(loadAll)
      .mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }))
      .mockResolvedValueOnce([exercise]);
    await render(true);
    expect(store.ready).toBe(true);
    await act(async () => reject(new Error("Stale failure")));
    expect(store.loadError).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(JSON.parse(store.exportJson()).exercises).toEqual([exercise]);
  });
});

describe("library navigation", () => {
  it.each(["", "#/", "#/today", "#/lifts"])("opens Lifts from %j with three tabs", async (hash) => {
    window.history.replaceState(null, "", `/${hash}`);
    vi.mocked(loadAll).mockResolvedValue([exercise]);
    await render();
    expect(container.querySelector("h1")?.textContent).toBe("Lifts");
    expect(container.querySelector('input[type="search"]')?.getAttribute("placeholder")).toBe("Search lifts");
    expect([...container.querySelectorAll("nav button")].map((button) => button.textContent)).toEqual(["Lifts", "Workout", "Backup"]);
    expect(container.querySelector("nav .on")?.textContent).toBe("Lifts");
    expect(container.querySelector(".lift-name")?.textContent).toBe(exercise.name);
    expect(saveAll).not.toHaveBeenCalled();
  });

  it("filters the home library by muscle and navigates between Lifts and Backup", async () => {
    window.history.replaceState(null, "", "/");
    vi.mocked(loadAll).mockResolvedValue([
      exercise,
      { ...exercise, id: "bench", name: "Bench press", muscle: "chest", dayTypes: ["push"] },
    ]);
    await render();
    const chest = [...container.querySelectorAll<HTMLButtonElement>(".chip")].find((button) => button.textContent === "Chest")!;
    await act(async () => chest.click());
    expect([...container.querySelectorAll(".lift-name")].map((name) => name.textContent)).toEqual(["Bench press"]);
    for (const tab of ["Backup", "Lifts"]) {
      const button = [...container.querySelectorAll<HTMLButtonElement>("nav button")].find((button) => button.textContent === tab)!;
      await act(async () => {
        button.click();
        // Deliver the hash navigation immediately in the test DOM.
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(container.querySelector("h1")?.textContent).toBe(tab);
      expect(container.querySelector("nav .on")?.textContent).toBe(tab);
    }
    expect(store.exercises).toHaveLength(2);
    expect(saveAll).not.toHaveBeenCalled();
  });
});

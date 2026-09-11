// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../App";
import { StoreProvider } from "../lib/store";
import { loadAll, saveOne } from "../lib/db";
import { parseSnapshot } from "../lib/parse";
import type { Exercise } from "../types";
vi.mock("../lib/db", async (original) => ({
  ...await original<typeof import("../lib/db")>(),
  loadAll: vi.fn(), saveOne: vi.fn(), loadProgramNotes: vi.fn().mockResolvedValue(""),
}));
let root: Root;
let host: HTMLDivElement;
const bench: Exercise = {id:"bench",name:"Bench",muscle:"chest",equipment:"dumbbell",dayTypes:[],notes:"",tags:[],best:parseSnapshot("90x10","2026-09-10"),recents:[]};
async function mount(){root=createRoot(host);await act(async()=>root.render(createElement(StoreProvider,null,createElement(App))));}
async function save(raw:string){
 await act(async()=>{const input=host.querySelector('textarea')!;Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(input,raw);input.dispatchEvent(new Event('input',{bubbles:true}));});
 await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='Save session')!.click();});
}
beforeEach(()=>{
 vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 localStorage.clear();window.history.replaceState(null,'','/#/e/bench');
 vi.mocked(loadAll).mockReset().mockResolvedValue([structuredClone(bench)]);
 vi.mocked(saveOne).mockReset().mockResolvedValue(undefined);
 host=document.createElement('div');document.body.append(host);
});
afterEach(async()=>{await act(async()=>root?.unmount());host.remove();vi.useRealTimers();vi.unstubAllGlobals();});
it('celebrates a committed new best once, preserves the old record label, and does not replay on reopening',async()=>{
 await mount();expect(host.querySelector('.celebration')).toBeNull();
 await save('95x10');expect(saveOne).toHaveBeenCalled();
 expect(host.querySelector('.celebration-record')?.textContent).toBe('95×10');
 expect(host.querySelector('.celebration-previous span')?.textContent).toBe('90×10');
 expect(host.querySelector('.celebration.nuclear')).not.toBeNull();
 await act(async()=>vi.advanceTimersByTime(2800));expect(host.querySelector('.celebration')).toBeNull();
 await save('95x10');expect(host.querySelector('.celebration')).toBeNull();
 const persisted=vi.mocked(saveOne).mock.calls.at(-1)![0];
 vi.mocked(loadAll).mockResolvedValue([persisted]);
 await act(async()=>root.unmount());await mount();expect(host.querySelector('.celebration')).toBeNull();
});
it('does not celebrate ties, worse logs, or failed writes',async()=>{
 await mount();await save('90x10');expect(host.querySelector('.celebration')).toBeNull();
 await save('85x10');expect(host.querySelector('.celebration')).toBeNull();
 vi.mocked(saveOne).mockRejectedValueOnce(new Error('Disk full'));
 await save('100x10');expect(host.querySelector('.celebration')).toBeNull();expect(host.textContent).toContain('Disk full');
});
it('waits for storage to finish before celebrating',async()=>{
 await mount();let finish!:()=>void;vi.mocked(saveOne).mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
 await save('95x10');expect(host.querySelector('.celebration')).toBeNull();
 await act(async()=>finish());expect(host.querySelector('.celebration')).not.toBeNull();
});
it('handles the first best without claiming a previous record was beaten',async()=>{
 vi.mocked(loadAll).mockResolvedValue([{...bench,best:null}]);await mount();await save('50x8');
 expect(host.querySelector('.celebration-record')?.textContent).toBe('50×8');
 expect(host.querySelector('.celebration-previous')?.textContent).toBe('FIRST BEST. LET’S GO.');
});

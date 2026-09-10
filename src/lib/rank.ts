import type { Snapshot } from "../types";

/** Top-set ranking. Volume never wins. Tie keeps the existing best. */
export function isBetter(next: Snapshot, current: Snapshot | null): boolean {
  if (!current) return next.sets.length > 0 || next.raw.length > 0;
  if (next.kind !== current.kind) return false;
  if (next.kind === "mixed") return false;

  const a = next.sets[0];
  const b = current.sets[0];
  if (!a || !b) return false;

  if (next.kind === "loaded") {
    const aw = a.weight ?? -Infinity;
    const bw = b.weight ?? -Infinity;
    if (aw !== bw) return aw > bw;
    return (a.reps ?? -Infinity) > (b.reps ?? -Infinity);
  }
  if (next.kind === "bodyweight") {
    return (a.reps ?? -Infinity) > (b.reps ?? -Infinity);
  }
  if (next.kind === "timed") {
    return (a.seconds ?? -Infinity) > (b.seconds ?? -Infinity);
  }
  return false;
}

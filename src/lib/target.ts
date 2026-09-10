import type { Snapshot } from "../types";
import { formatSeconds, trimNum } from "./parse";

const REP_RANGE_TOP = 12;

export function targetLine(best: Snapshot | null): string {
  if (!best || best.sets.length === 0) return "Log a first session.";
  const top = best.sets[0];

  if (best.kind === "loaded" && top.weight != null && top.reps != null) {
    const atTop = best.sets.filter((s) => s.weight === top.weight && s.reps != null);
    const allHigh =
      atTop.length > 0 && atTop.every((s) => (s.reps ?? 0) >= REP_RANGE_TOP);
    if (allHigh) {
      const step = Number.isInteger(top.weight) && top.weight % 5 === 0 ? 5 : 2.5;
      return `Start ${trimNum(top.weight + step)}. All sets hit ${REP_RANGE_TOP}.`;
    }
    return `Start ${trimNum(top.weight)}. Beat ${top.reps}.`;
  }

  if (best.kind === "bodyweight" && top.reps != null) {
    return `Beat ${top.reps}.`;
  }

  if (best.kind === "timed" && top.seconds != null) {
    return `Beat ${formatSeconds(top.seconds)}.`;
  }

  return "";
}

/** Compact “do this” for the logbook row, e.g. 90x10 */
export function targetShort(best: Snapshot | null): string {
  if (!best || best.sets.length === 0) return "—";
  const top = best.sets[0];

  if (best.kind === "loaded" && top.weight != null && top.reps != null) {
    const atTop = best.sets.filter((s) => s.weight === top.weight && s.reps != null);
    const allHigh =
      atTop.length > 0 && atTop.every((s) => (s.reps ?? 0) >= REP_RANGE_TOP);
    if (allHigh) {
      const step = Number.isInteger(top.weight) && top.weight % 5 === 0 ? 5 : 2.5;
      return trimNum(top.weight + step);
    }
    return `${trimNum(top.weight)}x${top.reps}`;
  }
  if (best.kind === "bodyweight" && top.reps != null) return String(top.reps);
  if (best.kind === "timed" && top.seconds != null) return formatSeconds(top.seconds);
  return "—";
}

export function topSetLabel(best: Snapshot | null): string {
  if (!best || best.sets.length === 0) return "—";
  const top = best.sets[0];
  if (best.kind === "loaded" && top.weight != null && top.reps != null) {
    return `${trimNum(top.weight)}×${top.reps}`;
  }
  if (best.kind === "bodyweight" && top.reps != null) return String(top.reps);
  if (best.kind === "timed" && top.seconds != null) return formatSeconds(top.seconds);
  return best.raw.split(",")[0]?.trim() || "—";
}

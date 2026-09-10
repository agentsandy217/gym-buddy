import type { LoggedSet, SetKind, Snapshot } from "../types";

const WEIGHT_REPS = /^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+)\s*$/i;
const REPS_ONLY = /^(\d+)\s*$/;
const TIME = /^(\d+):(\d{2})\s*$/;

function stripExtra(token: string): { core: string; extra?: string } {
  const trimmed = token.trim();
  const m = trimmed.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  if (m) return { core: m[1].trim(), extra: m[2].slice(1, -1).trim() };
  return { core: trimmed };
}

export function parseSetToken(token: string): LoggedSet | null {
  const { core, extra } = stripExtra(token);
  if (!core) return extra ? { extra } : null;

  let set: LoggedSet | null = null;
  const wr = core.match(WEIGHT_REPS);
  if (wr) set = { weight: Number(wr[1]), reps: Number(wr[2]) };
  else {
    const tm = core.match(TIME);
    if (tm) set = { seconds: Number(tm[1]) * 60 + Number(tm[2]) };
    else {
      const rp = core.match(REPS_ONLY);
      if (rp) set = { reps: Number(rp[1]) };
    }
  }
  if (!set) return extra ? { extra: [core, extra].filter(Boolean).join(" — ") } : { extra: core };
  if (extra) set.extra = extra;
  return set;
}

export function classifySets(sets: LoggedSet[]): SetKind {
  if (sets.length === 0) return "mixed";
  const loaded = sets.every((s) => s.weight != null && s.reps != null);
  if (loaded) return "loaded";
  const timed = sets.every((s) => s.seconds != null);
  if (timed) return "timed";
  const body = sets.every((s) => s.reps != null && s.weight == null && s.seconds == null);
  if (body) return "bodyweight";
  return "mixed";
}

export function splitSetLine(raw: string): string[] {
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  for (const c of raw) {
    if (c === "(") depth++;
    if (c === ")") depth = Math.max(0, depth - 1);
    if (c === "," && depth === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = "";
    } else buf += c;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

export function parseSnapshot(raw: string, date: string): Snapshot | null {
  const text = raw.trim();
  if (!text) return null;
  const parts = splitSetLine(text);
  const sets = parts.map(parseSetToken).filter((s): s is LoggedSet => s != null);
  return { date, raw: text, sets, kind: classifySets(sets) };
}

export function formatSet(set: LoggedSet): string {
  const bits: string[] = [];
  if (set.weight != null && set.reps != null) bits.push(`${trimNum(set.weight)}×${set.reps}`);
  else if (set.seconds != null) bits.push(formatSeconds(set.seconds));
  else if (set.reps != null) bits.push(String(set.reps));
  if (set.extra) bits.push(bits.length ? `(${set.extra})` : set.extra);
  return bits.join(" ");
}

export function formatSnapshot(snap: Snapshot): string {
  if (snap.sets.length === 0) return snap.raw;
  const line = snap.sets.map(formatSet).join(", ");
  return line || snap.raw;
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

export function parseSheetDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return v;
  const mdY = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdY) {
    const m = mdY[1].padStart(2, "0");
    const d = mdY[2].padStart(2, "0");
    return `${mdY[3]}-${m}-${d}`;
  }
  return null;
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

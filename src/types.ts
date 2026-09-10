export const EQUIPMENT = [
  "dumbbell",
  "cable",
  "barbell",
  "machine",
  "bodyweight",
  "kettlebell",
  "band",
  "hex-bar",
  "landmine",
  "other",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes",
  "biceps",
  "triceps",
  "core",
  "calves",
  "full-body",
  "other",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const DAY_TYPES = ["push", "pull", "legs", "other"] as const;
export type DayType = (typeof DAY_TYPES)[number];

export type SetKind = "loaded" | "bodyweight" | "timed" | "mixed";

export type LoggedSet = {
  weight?: number;
  reps?: number;
  seconds?: number;
  extra?: string;
};

export type Snapshot = {
  date: string;
  raw: string;
  sets: LoggedSet[];
  kind: SetKind;
};

export type Exercise = {
  id: string;
  name: string;
  equipment: Equipment;
  muscle: Muscle;
  dayTypes: DayType[];
  tags?: string[];
  notes: string;
  best: Snapshot | null;
  recents: Snapshot[];
};

export type SheetRow = {
  name: string;
  category: string;
  subCategory: string;
  best: string;
  bestDate: string;
  notes: string;
};

export type ExportFile = {
  version: 1;
  exportedAt: string;
  programNotes?: string;
  exercises: Exercise[];
};

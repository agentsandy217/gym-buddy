import type { DayType, Equipment, Muscle } from "../types";

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  dumbbell: "Dumbbell",
  cable: "Cable",
  barbell: "Barbell",
  machine: "Machine",
  bodyweight: "Bodyweight",
  kettlebell: "Kettlebell",
  band: "Band",
  "hex-bar": "Hex bar",
  landmine: "Landmine",
  other: "Other",
};

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  biceps: "Biceps",
  triceps: "Triceps",
  core: "Core",
  calves: "Calves",
  "full-body": "Full body",
  other: "Other",
};

export const DAY_LABEL: Record<DayType | "all", string> = {
  all: "All",
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  other: "Other",
};

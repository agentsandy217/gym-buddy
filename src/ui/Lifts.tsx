import { useMemo, useState } from "react";
import type { Exercise, Muscle } from "../types";
import { MUSCLES } from "../types";
import { LiftCard } from "./Card";
import { MUSCLE_LABEL } from "./labels";
import { go } from "./route";
import type { WorkoutList } from "../lib/workout";
import { WorkoutNotice } from "./WorkoutNotice";

export function Lifts({ exercises, workout }: { exercises: Exercise[]; workout: WorkoutList }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "all">("all");
  const [announcement, setAnnouncement] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (muscle !== "all" && ex.muscle !== muscle) return false;
      if (query && !ex.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [exercises, q, muscle]);

  return (
    <div className="page">
      <header className="top row">
        <div>
          <div className="kicker">Library</div>
          <h1>Lifts</h1>
        </div>
        <button type="button" className="btn" onClick={() => go("#/new")}>
          Add
        </button>
      </header>
      <WorkoutNotice workout={workout} />
      <p className="sr-only" role="status">{announcement}</p>
      <input
        className="search"
        type="search"
        placeholder="Search lifts"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        enterKeyHint="search"
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className="chips wrap">
        <button
          type="button"
          className={muscle === "all" ? "chip on" : "chip"}
          onClick={() => setMuscle("all")}
        >
          All
        </button>
        {MUSCLES.map((m) => (
          <button
            key={m}
            type="button"
            className={muscle === m ? "chip on" : "chip"}
            onClick={() => setMuscle(m)}
          >
            {MUSCLE_LABEL[m]}
          </button>
        ))}
      </div>
      <div className="log-list inset">
        {visible.map((ex) => (
          <LiftCard key={ex.id} exercise={ex} action={
            <button
              type="button"
              className={workout.ids.includes(ex.id) ? "queue-add queued" : "queue-add"}
              disabled={!workout.ready || workout.ids.includes(ex.id)}
              aria-label={workout.ids.includes(ex.id) ? `${ex.name} is in your workout` : `Add ${ex.name} to workout`}
              onClick={() => {
                if (workout.add(ex.id)) setAnnouncement(`${ex.name} added to Workout.`);
              }}
            >
              <span aria-hidden="true">{workout.ids.includes(ex.id) ? "✓" : "+"}</span>
            </button>
          } />
        ))}
        {visible.length === 0 && <p className="empty">No lifts match.</p>}
      </div>
    </div>
  );
}

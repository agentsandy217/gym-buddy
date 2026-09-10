import { useMemo, useState } from "react";
import type { Exercise, Muscle } from "../types";
import { MUSCLES } from "../types";
import { LiftCard } from "./Card";
import { MUSCLE_LABEL } from "./labels";
import { go } from "./route";

export function Lifts({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "all">("all");

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
          <LiftCard key={ex.id} exercise={ex} />
        ))}
        {visible.length === 0 && <p className="empty">No lifts match.</p>}
      </div>
    </div>
  );
}

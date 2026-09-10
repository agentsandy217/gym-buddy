import { useMemo, useState } from "react";
import type { DayType, Exercise } from "../types";
import { DAY_TYPES } from "../types";
import { LiftCard } from "./Card";
import { DAY_LABEL } from "./labels";

const DAY_KEY = "gym-buddy-day";

function readDay(): DayType | "all" {
  const v = sessionStorage.getItem(DAY_KEY);
  if (v === "all" || (DAY_TYPES as readonly string[]).includes(v ?? "")) {
    return v as DayType | "all";
  }
  return "push";
}

export function Today({ exercises }: { exercises: Exercise[] }) {
  const [day, setDay] = useState<DayType | "all">(readDay);
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (day !== "all" && !ex.dayTypes.includes(day)) return false;
      if (query && !ex.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [exercises, day, q]);

  function pickDay(next: DayType | "all") {
    sessionStorage.setItem(DAY_KEY, next);
    setDay(next);
  }

  return (
    <div className="page flush">
      <header className="bar">
        <h1>{DAY_LABEL[day]}</h1>
        <span className="count">{visible.length} lifts</span>
      </header>
      <div className="chips pad">
        {(["all", ...DAY_TYPES] as const).map((d) => (
          <button
            key={d}
            type="button"
            className={day === d ? "chip on" : "chip"}
            onClick={() => pickDay(d)}
          >
            {DAY_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="pad">
        <input
          className="search"
          type="search"
          placeholder="Search this day"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
      <div className="log-list">
        {visible.map((ex) => (
          <LiftCard key={ex.id} exercise={ex} />
        ))}
        {visible.length === 0 && <p className="empty pad">Nothing matches. Try All, or add a lift.</p>}
      </div>
    </div>
  );
}

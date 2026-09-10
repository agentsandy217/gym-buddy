import type { Exercise } from "../types";
import type { ReactNode } from "react";
import { formatShortDate, formatSnapshot } from "../lib/parse";
import { targetShort } from "../lib/target";
import { go } from "./route";

export function LiftCard({ exercise, action }: { exercise: Exercise; action?: ReactNode }) {
  return (
    <div className={action ? "lift-entry with-action" : "lift-entry"}>
      <button type="button" className="lift-row" onClick={() => go(`#/e/${exercise.id}`)}>
        <div className="lift-main">
          <div className="lift-name">{exercise.name}</div>
          {exercise.best ? (
            <div className="lift-best">{formatSnapshot(exercise.best)}</div>
          ) : (
            <div className="lift-best">No best yet</div>
          )}
        </div>
        <div className="lift-side">
          <div className="lift-date">
            {exercise.best?.date ? formatShortDate(exercise.best.date) : "—"}
          </div>
          <div className="lift-do">{targetShort(exercise.best)}</div>
        </div>
      </button>
      {action}
    </div>
  );
}

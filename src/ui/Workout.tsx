import type { Exercise } from "../types";
import type { WorkoutList } from "../lib/workout";
import { LiftCard } from "./Card";
import { WorkoutNotice } from "./WorkoutNotice";
import { go } from "./route";
import { ProgramNotes } from "./ProgramNotes";
import { Mascot } from "./Mascot";

export function Workout({ exercises, workout }: { exercises: Exercise[]; workout: WorkoutList }) {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const selected = workout.ids.map((id) => byId.get(id)).filter((exercise): exercise is Exercise => !!exercise);

  return (
    <div className="page">
      <header className="top row">
        <div>
          <div className="kicker">Your list</div>
          <h1>Workout</h1>
        </div>
        <button type="button" className="text-btn" disabled={!workout.ready || !selected.length} onClick={workout.clear}>
          Clear list
        </button>
      </header>
      <ProgramNotes />
      <WorkoutNotice workout={workout} />
      {!workout.ready ? (
        !workout.error && <p className="muted" role="status">Loading your workout…</p>
      ) : selected.length === 0 ? (
        <div className="workout-empty">
          <Mascot size="large" />
          <p className="lede">Add exercises from Lifts to build your workout.</p>
          <button type="button" className="btn primary" onClick={() => go("#/lifts")}>Add exercises</button>
        </div>
      ) : (
        <>
          <div className="row workout-heading">
            <span className="muted">{selected.length} {selected.length === 1 ? "exercise" : "exercises"}</span>
            <button type="button" className="text-btn" onClick={() => go("#/lifts")}>Add exercises</button>
          </div>
          <p className="muted workout-hint">Your list stays here until you clear it.</p>
          <ol className="workout-list">
            {selected.map((exercise, index) => (
              <li key={exercise.id} className="workout-item">
                <LiftCard exercise={exercise} />
                <div className="workout-controls">
                  <span className="muted workout-position">{index + 1}</span>
                  <button type="button" className="queue-move" disabled={index === 0} aria-label={`Move ${exercise.name} up`} onClick={() => workout.move(exercise.id, -1)}>↑</button>
                  <button type="button" className="queue-move" disabled={index === selected.length - 1} aria-label={`Move ${exercise.name} down`} onClick={() => workout.move(exercise.id, 1)}>↓</button>
                  <button type="button" className="text-btn" aria-label={`Remove ${exercise.name} from workout`} onClick={() => workout.remove(exercise.id)}>Remove</button>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

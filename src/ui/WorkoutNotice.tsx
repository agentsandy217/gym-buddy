import type { WorkoutList } from "../lib/workout";

export function WorkoutNotice({ workout }: { workout: WorkoutList }) {
  if (!workout.error) return null;
  const loading = workout.error.operation === "load";
  return (
    <div className="workout-notice">
      <p className="error" role="alert">
        {loading
          ? "Couldn’t load your workout list. Try loading it again."
          : "Couldn’t save your workout list. Your previous list is unchanged. Try that action again."}
      </p>
      {loading && <button type="button" className="btn" onClick={workout.retry}>Try again</button>}
      <details className="startup-details">
        <summary>Error details</summary>
        <pre>{workout.error.details}</pre>
      </details>
    </div>
  );
}

import type { LoadError } from "../lib/store";

const MESSAGES = {
  read: "The app couldn’t read your saved lifts from this browser’s local database.",
  seed: "The app couldn’t initialize the local database with the starting exercise library.",
  prepare: "The app read the local database but couldn’t prepare your saved lifts for display.",
};

const OPERATIONS = {
  read: "Reading the local database",
  seed: "Initializing the local database",
  prepare: "Preparing saved lifts for display",
};

export function Startup({ error, onRetry }: { error: LoadError | null; onRetry: () => void }) {
  if (!error) {
    return (
      <div className="boot" role="status">
        <div>
          <p>Gym Buddy</p>
          <p className="muted">Loading saved lifts…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="shell no-tab">
      <div className="page startup-error">
        <div className="kicker">Gym Buddy</div>
        <div role="alert">
          <h1>Couldn’t load your lifts</h1>
          <p className="lede">{MESSAGES[error.stage]}</p>
        </div>
        <button type="button" className="btn primary wide" onClick={onRetry}>
          Try again
        </button>
        <details className="startup-details">
          <summary>Error details</summary>
          <pre>{`Operation: ${OPERATIONS[error.stage]}\nDatabase: gym-buddy\nStore: exercises\n\n${error.details}`}</pre>
        </details>
      </div>
    </main>
  );
}

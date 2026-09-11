import { useCallback, useState } from "react";
import type { Exercise } from "../types";
import { formatDisplayDate, formatSnapshot, parseSnapshot, todayISO } from "../lib/parse";
import { targetLine, targetShort, topSetLabel } from "../lib/target";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "./labels";
import { go } from "./route";
import { NewBestCelebration } from "../celebrations/NewBestCelebration";

type Props = {
  exercise: Exercise;
  onLog: (raw: string, date: string) => Promise<{ newBest: boolean }>;
  onSetBest: (index: number) => Promise<void>;
};

export function Detail({ exercise, onLog, onSetBest }: Props) {
  const [raw, setRaw] = useState(exercise.best ? formatSnapshot(exercise.best) : "");
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [celebration, setCelebration] = useState<{ record: string; previous: string } | null>(null);
  const dismissCelebration = useCallback(() => setCelebration(null), []);

  async function save() {
    setBusy(true);
    setError(null);
    setStatus(null);
    setCelebration(null);
    const submitted = parseSnapshot(raw, date);
    const previous = exercise.best ? topSetLabel(exercise.best) : "";
    try {
      const result = await onLog(raw, date);
      if (result.newBest && submitted) {
        setCelebration({ record: topSetLabel(submitted), previous });
      }
      setStatus(result.newBest ? "New best. That’s the target now." : "Logged. Best is unchanged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      {celebration && <NewBestCelebration exercise={exercise.name} {...celebration} durationMs={2800} intensity="nuclear" onDismiss={dismissCelebration} />} 
      <header className="top row">
        <button type="button" className="text-btn" onClick={() => history.back()}>
          Back
        </button>
        <button type="button" className="text-btn" onClick={() => go(`#/e/${exercise.id}/edit`)}>
          Edit
        </button>
      </header>
      <div className="tags">
        <span className="tag">{MUSCLE_LABEL[exercise.muscle]}</span>
        <span className="tag">{EQUIPMENT_LABEL[exercise.equipment]}</span>
      </div>
      <h1 className="detail-name">{exercise.name}</h1>
      {!!exercise.tags?.length && (
        <div className="tags">
          {exercise.tags.map((tag, index) => <span className="tag" key={`${tag}-${index}`}>{tag}</span>)}
        </div>
      )}
      {exercise.notes ? (
        <section className="notes-block">
          <div className="stat-k">Notes</div>
          <p className="notes">{exercise.notes}</p>
        </section>
      ) : null}
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-k">Top set</div>
          <div className="stat-v">{topSetLabel(exercise.best)}</div>
        </div>
        <div className="stat">
          <div className="stat-k">Target</div>
          <div className="stat-v good">{targetShort(exercise.best)}</div>
        </div>
      </div>
      {targetLine(exercise.best) ? (
        <p className="hero-target">{targetLine(exercise.best)}</p>
      ) : null}
      {exercise.best ? (
        <div className="best-block">
          <div className="stat-k">
            Best{exercise.best.date ? ` · ${formatDisplayDate(exercise.best.date)}` : ""}
          </div>
          <div className="best-line">{formatSnapshot(exercise.best)}</div>
        </div>
      ) : (
        <p className="muted">No best yet. First log becomes the target.</p>
      )}

      <label className="label" htmlFor="log-line">
        Today’s sets
      </label>
      <textarea
        id="log-line"
        className="log"
        rows={3}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="90x10, 90x7, 85x8"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <label className="label" htmlFor="log-date">
        Date
      </label>
      <input
        id="log-date"
        className="search"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button type="button" className="btn primary wide" disabled={busy} onClick={() => void save()}>
        Save session
      </button>
      {status ? <p className="flash">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {exercise.recents.length > 0 && (
        <section className="recents">
          <h2>Recent</h2>
          <ul>
            {exercise.recents.map((snap, i) => (
              <li key={`${snap.date}-${i}`}>
                <div>
                  <div className="muted">{snap.date ? formatDisplayDate(snap.date) : "No date"}</div>
                  <div>{formatSnapshot(snap)}</div>
                </div>
                {exercise.best && formatSnapshot(snap) === formatSnapshot(exercise.best) && snap.date === exercise.best.date ? (
                  <span className="muted">Best</span>
                ) : (
                  <button type="button" className="text-btn" onClick={() => void onSetBest(i)}>
                    Set as best
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

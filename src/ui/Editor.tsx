import { useState } from "react";
import type { DayType, Equipment, Exercise, Muscle } from "../types";
import { DAY_TYPES, EQUIPMENT, MUSCLES } from "../types";
import { uniqueId } from "../lib/fromSheet";
import { DAY_LABEL, EQUIPMENT_LABEL, MUSCLE_LABEL } from "./labels";
import { go } from "./route";
import { parseTags } from "../lib/tags";

type Props = {
  existing?: Exercise;
  ids: string[];
  onSave: (exercise: Exercise) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function Editor({ existing, ids, onSave, onDelete }: Props) {
  const [name, setName] = useState(existing?.name ?? "");
  const [equipment, setEquipment] = useState<Equipment>(existing?.equipment ?? "other");
  const [muscle, setMuscle] = useState<Muscle>(existing?.muscle ?? "other");
  const [dayTypes, setDayTypes] = useState<DayType[]>(existing?.dayTypes ?? ["other"]);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [tags, setTags] = useState((existing?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleDay(d: DayType) {
    setDayTypes((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = existing?.id ?? uniqueId(trimmed, ids);
      await onSave({
        id,
        name: trimmed,
        equipment,
        muscle,
        dayTypes: dayTypes.length ? dayTypes : ["other"],
        notes: notes.trim(),
        tags: parseTags(tags),
        best: existing?.best ?? null,
        recents: existing?.recents ?? [],
      });
      go(`#/e/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!onDelete) return;
    if (!confirm(`Delete ${existing?.name ?? "this lift"}?`)) return;
    setBusy(true);
    await onDelete();
    go("#/lifts");
  }

  return (
    <div className="page">
      <header className="top row">
        <button type="button" className="text-btn" onClick={() => history.back()}>
          Back
        </button>
        {onDelete ? (
          <button type="button" className="text-btn danger" onClick={() => void remove()}>
            Delete
          </button>
        ) : (
          <span />
        )}
      </header>
      <h1>{existing ? "Edit lift" : "New lift"}</h1>
      <label className="label" htmlFor="ex-name">
        Name
      </label>
      <input
        id="ex-name"
        className="search"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dumbbell bench press"
        autoCapitalize="words"
      />
      <label className="label" htmlFor="ex-muscle">
        Muscle
      </label>
      <select id="ex-muscle" className="search" value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle)}>
        {MUSCLES.map((m) => (
          <option key={m} value={m}>
            {MUSCLE_LABEL[m]}
          </option>
        ))}
      </select>
      <label className="label" htmlFor="ex-eq">
        Equipment
      </label>
      <select
        id="ex-eq"
        className="search"
        value={equipment}
        onChange={(e) => setEquipment(e.target.value as Equipment)}
      >
        {EQUIPMENT.map((eq) => (
          <option key={eq} value={eq}>
            {EQUIPMENT_LABEL[eq]}
          </option>
        ))}
      </select>
      <div className="label">Day</div>
      <div className="chips">
        {DAY_TYPES.map((d) => (
          <button
            key={d}
            type="button"
            className={dayTypes.includes(d) ? "chip on" : "chip"}
            onClick={() => toggleDay(d)}
          >
            {DAY_LABEL[d]}
          </button>
        ))}
      </div>
      <label className="label" htmlFor="ex-tags">Tags</label>
      <input
        id="ex-tags"
        className="search"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Fly, Upper Chest"
        aria-describedby="ex-tags-help"
      />
      <p id="ex-tags-help" className="muted">Separate tags with commas. Edit or remove any tag here.</p>
      <label className="label" htmlFor="ex-notes">
        Notes
      </label>
      <textarea
        id="ex-notes"
        className="log"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Form cues, whatever you’ll forget"
      />
      {error ? <p className="error">{error}</p> : null}
      <button type="button" className="btn primary wide" disabled={busy} onClick={() => void save()}>
        Save lift
      </button>
    </div>
  );
}

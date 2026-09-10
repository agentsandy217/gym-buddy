import { useStore } from "../lib/store";

export function ProgramNotes() {
  const { programNotes, updateProgramNotes, notesStatus } = useStore();
  const failed = notesStatus.startsWith("Couldn’t");
  return (
    <details className="program-notes">
      <summary>Program notes</summary>
      <label className="label" htmlFor="program-notes">Your current program or split</label>
      <textarea
        id="program-notes"
        className="log"
        rows={7}
        value={programNotes}
        onChange={(event) => updateProgramNotes(event.target.value)}
        placeholder={"Push / Pull / Legs\nSchedule, exercise order, progression, reminders…"}
        aria-describedby="program-notes-status"
      />
      <p id="program-notes-status" className={failed ? "error" : "muted"} role="status">
        {notesStatus || "Saves automatically. Included in backups."}
      </p>
      {failed && <button type="button" className="btn" onClick={() => updateProgramNotes(programNotes)}>Retry save</button>}
    </details>
  );
}

import { useRef, useState } from "react";

type Props = {
  count: number;
  exportJson: () => string;
  importJson: (text: string) => Promise<void>;
};

export function Backup({ count, exportJson, importJson }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setError(null);
    const text = exportJson();
    const blob = new Blob([text], { type: "application/json" });
    const name = `gym-buddy-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: "application/json" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Gym Buddy backup" });
        setStatus("Shared.");
        return;
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Downloaded. Save it in Files or email it to yourself.");
  }

  async function onFile(file: File) {
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      await importJson(text);
      setStatus("Restored from backup.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import that file.");
    }
  }

  return (
    <div className="page">
      <header className="top">
        <div className="kicker">Spare key</div>
        <h1>Backup</h1>
      </header>
      <p className="lede">
        {count} lifts live on this phone. Export when you hit a new best, or before you switch
        phones. Not every day.
      </p>
      <p className="muted">Import replaces your lifts and restores program notes. Older backups without notes keep your current notes.</p>
      <button type="button" className="btn primary wide" onClick={() => void share()}>
        Export
      </button>
      <button type="button" className="btn wide" onClick={() => fileRef.current?.click()}>
        Import backup
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
          e.target.value = "";
        }}
      />
      {status ? <p className="flash">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <section className="help">
        <h2>Add to Home Screen</h2>
        <p>Safari → Share → Add to Home Screen. Opens full screen like an app.</p>
      </section>
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./celebration.css";

export type CelebrationProps = {
  exercise: string;
  record: string;
  previous: string;
  durationMs?: number;
  intensity?: "hype" | "nuclear";
  reduceMotion?: boolean;
  onDismiss: () => void;
};

/** Presentation only: no store access, record mutation, or audio. Mount once per event. */
export function NewBestCelebration({ exercise, record, previous, durationMs = 2800,
  intensity = "nuclear", reduceMotion = false, onDismiss }: CelebrationProps) {
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const still = reduceMotion || systemReduced;
  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const oldFocus = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(onDismiss, durationMs);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", escape);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", escape); oldFocus?.focus({ preventScroll: true }); };
  }, [durationMs, onDismiss]);
  useEffect(() => {
    if (still || !video.current) return;
    video.current.muted = true;
    void video.current.play().catch(() => setMediaFailed(true));
  }, [still]);
  return <div className={`celebration ${intensity} ${still ? "still" : ""}`} data-testid="celebration">
    <button ref={close} className="celebration-dismiss" onClick={onDismiss} aria-label="Dismiss new best celebration">
      <span className="celebration-shockwave" aria-hidden="true" />
      {!still && <div className="celebration-sparks" aria-hidden="true">{Array.from({length: intensity === "nuclear" ? 36 : 20}, (_, i) =>
        <i key={i} style={{ "--angle": `${i * 137.5}deg`, "--travel": `${130 + (i % 7) * 33}px`, "--delay": `${(i % 4) * 35}ms`, "--color": ["var(--good)", "var(--accent)", "#93b8ff", "var(--ink)"][i % 4] } as CSSProperties} />)}</div>}
      <div className="celebration-card">
        <div className="celebration-eyebrow">ALL-TIME BEST <span>✦</span> NEW TARGET SET</div>
        <div className="celebration-media">
          {still || mediaFailed ? <img src={`${import.meta.env.BASE_URL}celebrations/ronnie-poster.jpg`} alt="Ronnie Coleman in the gym" /> :
            <video ref={video} src={`${import.meta.env.BASE_URL}celebrations/ronnie-light-weight.mp4`} poster={`${import.meta.env.BASE_URL}celebrations/ronnie-poster.jpg`} muted playsInline preload="auto" onError={() => setMediaFailed(true)} aria-label="Silent Ronnie Coleman reaction clip" />}
          <div className="celebration-media-shade" />
          <div className="celebration-headline">LIGHT WEIGHT<span>BABY!</span></div>
        </div>
        <div className="celebration-result"><div className="celebration-exercise">{exercise}</div><div className="celebration-record">{record}</div><div className="celebration-previous">{previous ? <><span>{previous}</span> <b>OBLITERATED.</b></> : <b>FIRST BEST. LET’S GO.</b>}</div></div>
        <div className="celebration-footer">TAP ANYWHERE TO GET BACK TO IT <span>↗</span></div>
      </div>
    </button>
    <span className="celebration-sr" role="status">New best for {exercise}: {record}.</span>
  </div>;
}

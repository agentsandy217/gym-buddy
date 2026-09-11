import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { NewBestCelebration } from "../celebrations/NewBestCelebration";
import "../index.css";
import "./preview.css";

const examples = [
  { exercise: "Dumbbell bench press", record: "95 × 10", previous: "90 × 10", label: "More weight" },
  { exercise: "Pull-ups", record: "16 reps", previous: "14 reps", label: "More reps" },
  { exercise: "Plank", record: "2:10", previous: "1:55", label: "More time" },
];
function Playground() {
  const [active, setActive] = useState(false);
  const [duration, setDuration] = useState(2800);
  const [intensity, setIntensity] = useState<"hype" | "nuclear">("hype");
  const [reduced, setReduced] = useState(false);
  const [example, setExample] = useState(0);
  const dismiss = useCallback(() => setActive(false), []);
  const data = examples[example];
  return <main className="lab">
    <header className="lab-header"><a className="lab-brand" href="./preview.html">GYM BUDDY<span>CELEBRATION LAB</span></a><span className="lab-version">PREVIEW 01</span></header>
    <section className="lab-intro"><div className="lab-kicker">SMALL PROGRESS. EXCESSIVE RESPONSE.</div><h1>You earned<br/>a little <em>chaos.</em></h1><p>A silent salute to a new all-time best.<br/>Ronnie takes it from here.</p></section>
    <section className="lab-stage" aria-label="Celebration preview">
      <div className="lab-stage-top"><span>THE MOMENT</span><span className="lab-silent">◉ SILENT BY DESIGN</span></div>
      <div className="lab-poster"><img src={`${import.meta.env.BASE_URL}celebrations/ronnie-poster.jpg`} alt="Ronnie Coleman preparing to lift"/><div/><strong>LIGHT WEIGHT<span>BABY!</span></strong><span className="lab-sticker">NEW BEST ↗</span></div>
      <div className="lab-example"><div><small>{data.exercise}</small><strong>{data.record}</strong></div><span>Previously<br/><s>{data.previous}</s></span></div>
      <button className="lab-play" onClick={() => setActive(true)}>▶ <span>Play celebration</span><span>↗</span></button>
      <p className="lab-help">Replay as much as you want. No workout is saved.</p>
    </section>
    <section className="lab-controls"><div className="lab-section-title"><h2>Make it your kind of ridiculous.</h2><span>01 / RONNIE</span></div>
      <fieldset><legend>Energy</legend><div className="lab-options">{(["hype", "nuclear"] as const).map(value => <button key={value} aria-pressed={intensity === value} onClick={() => setIntensity(value)}>{value === "hype" ? "✦ Hype" : "☄ Nuclear"}</button>)}</div><p>Nuclear adds more sparks and a short card shake.</p></fieldset>
      <fieldset><legend>How long does Ronnie stay?</legend><div className="lab-options">{[2000,2800,4000].map(value => <button key={value} aria-pressed={duration === value} onClick={() => setDuration(value)}>{value / 1000}s</button>)}</div></fieldset>
      <fieldset><legend>Sample new best</legend><div className="lab-options">{examples.map((sample,i) => <button key={sample.label} aria-pressed={example === i} onClick={() => setExample(i)}>{sample.label}</button>)}</div></fieldset>
      <label className="lab-toggle"><span>Reduced motion<small>Still image. No zoom, shake, or particles.</small></span><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)}/></label>
    </section>
    <footer className="lab-footer"><strong>Just the celebration. Not the live app.</strong><p>Sample numbers only. No workout storage, imports, or changes to your records. Your device’s reduced-motion preference is always respected.</p><a href="https://tenor.com/view/light-weight-gif-21674454" target="_blank" rel="noreferrer">Ronnie clip source ↗</a></footer>
    {active && <NewBestCelebration {...data} durationMs={duration} intensity={intensity} reduceMotion={reduced} onDismiss={dismiss}/>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Playground/></StrictMode>);

import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "./lib/store";
import { Backup } from "./ui/Backup";
import { Detail } from "./ui/Detail";
import { Editor } from "./ui/Editor";
import { Lifts } from "./ui/Lifts";
import { Nav } from "./ui/Nav";
import { Today } from "./ui/Today";
import { parseHash, type Route } from "./ui/route";

function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parseHash(hash);
}

export default function App() {
  const store = useStore();
  const route = useRoute();

  if (!store.ready) {
    return (
      <div className="boot">
        <p>Gym Buddy</p>
      </div>
    );
  }

  const showNav = route.name === "today" || route.name === "lifts" || route.name === "backup";

  let body: ReactNode = null;
  if (route.name === "today") body = <Today exercises={store.exercises} />;
  else if (route.name === "lifts") body = <Lifts exercises={store.exercises} />;
  else if (route.name === "backup") {
    body = (
      <Backup
        count={store.exercises.length}
        exportJson={store.exportJson}
        importJson={store.importJson}
      />
    );
  } else if (route.name === "new") {
    body = (
      <Editor
        ids={store.exercises.map((e) => e.id)}
        onSave={store.upsert}
      />
    );
  } else if (route.name === "edit" || route.name === "detail") {
    const exercise = store.byId(route.id);
    if (!exercise) {
      body = (
        <div className="page">
          <p className="empty">That lift isn’t here.</p>
        </div>
      );
    } else if (route.name === "edit") {
      body = (
        <Editor
          key={exercise.id}
          existing={exercise}
          ids={store.exercises.map((e) => e.id)}
          onSave={store.upsert}
          onDelete={() => store.remove(exercise.id)}
        />
      );
    } else {
      body = (
        <Detail
          key={exercise.id}
          exercise={exercise}
          onLog={(raw, date) => store.log(exercise.id, raw, date)}
          onSetBest={async (index) => {
            const snap = exercise.recents[index];
            if (snap) await store.setBest(exercise.id, snap);
          }}
        />
      );
    }
  }

  return (
    <div className={showNav ? "shell" : "shell no-tab"}>
      {body}
      {showNav ? <Nav route={route} /> : null}
    </div>
  );
}

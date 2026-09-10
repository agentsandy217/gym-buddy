import type { Route } from "./route";
import { go } from "./route";

const items = [
  { name: "lifts" as const, href: "#/lifts", label: "Lifts" },
  { name: "workout" as const, href: "#/workout", label: "Workout" },
  { name: "backup" as const, href: "#/backup", label: "Backup" },
];

export function Nav({ route }: { route: Route }) {
  const active = route.name;
  return (
    <nav className="tabbar">
      {items.map((item) => (
        <button
          key={item.name}
          className={active === item.name ? "tab on" : "tab"}
          onClick={() => go(item.href)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

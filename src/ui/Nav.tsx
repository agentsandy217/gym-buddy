import type { Route } from "./route";
import { go } from "./route";

const items = [
  { name: "today" as const, href: "#/", label: "Today" },
  { name: "lifts" as const, href: "#/lifts", label: "Lifts" },
  { name: "backup" as const, href: "#/backup", label: "Backup" },
];

export function Nav({ route }: { route: Route }) {
  const active =
    route.name === "today"
      ? "today"
      : route.name === "backup"
        ? "backup"
        : "lifts";
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

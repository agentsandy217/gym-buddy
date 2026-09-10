export type Route =
  | { name: "today" }
  | { name: "lifts" }
  | { name: "backup" }
  | { name: "new" }
  | { name: "detail"; id: string }
  | { name: "edit"; id: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0 || parts[0] === "today") return { name: "today" };
  if (parts[0] === "lifts") return { name: "lifts" };
  if (parts[0] === "backup") return { name: "backup" };
  if (parts[0] === "new") return { name: "new" };
  if (parts[0] === "e" && parts[1] && parts[2] === "edit") return { name: "edit", id: parts[1] };
  if (parts[0] === "e" && parts[1]) return { name: "detail", id: parts[1] };
  return { name: "today" };
}

export function go(to: string) {
  window.location.hash = to;
}

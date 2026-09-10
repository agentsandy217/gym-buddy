import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((v) => v.length)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function isVideo(row) {
  const cat = row.Category ?? "";
  const sub = row.SubCategory ?? "";
  const best = row.Best ?? "";
  if (/video/i.test(cat) || /video/i.test(sub)) return true;
  if (/youtube\.com|youtu\.be|https?:\/\//i.test(best)) return true;
  return false;
}

const csv = readFileSync(join(root, "exercises.csv"), "utf8");
const [header, ...body] = parseCsv(csv);
const rows = body
  .map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])))
  .filter((r) => (r.Exercise ?? "").trim())
  .filter((r) => !isVideo(r))
  .map((r) => ({
    name: r.Exercise.trim(),
    category: (r.Category ?? "").trim(),
    subCategory: (r.SubCategory ?? "").trim(),
    best: (r.Best ?? "").trim(),
    bestDate: (r["Best Date"] ?? "").trim(),
    notes: (r.Notes ?? "").trim(),
  }));

writeFileSync(join(root, "src/seed.json"), JSON.stringify(rows, null, 2) + "\n");
console.log(`Wrote ${rows.length} exercises to src/seed.json`);

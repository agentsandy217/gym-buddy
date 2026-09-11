import { cp, copyFile } from "node:fs/promises";
await cp("public/celebrations", "dist-preview/celebrations", { recursive: true });
await copyFile("dist-preview/preview.html", "dist-preview/index.html");

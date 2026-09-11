import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deliberately excludes main.tsx / StoreProvider / seed.json and all production data flows.
export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react()],
  build: { outDir: "dist-preview", rollupOptions: { input: "preview.html" } },
});

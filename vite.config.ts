import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true"
      ? `/${(process.env.GITHUB_REPOSITORY ?? "x/app").split("/")[1]}/`
      : "/",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

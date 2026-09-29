// Unit tests (`npm test`). Two settings, both mirroring what Next does: compile
// JSX with React's automatic runtime, and resolve the `@/` path alias from
// tsconfig — so a test can import a component module (e.g. GarmentIcon's
// category list) as the app does. The evaluation has its own config,
// vitest.eval.config.ts.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});

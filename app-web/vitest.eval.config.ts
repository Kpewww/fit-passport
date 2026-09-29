// The Sprint 5 evaluation (eval/README.md). Separate from the unit tests on
// purpose: it may contact retailers (EVAL_LIVE=1) and it writes result files, so
// `npm test` never runs it. `npm run eval` does.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["eval/**/*.eval.ts"],
    testTimeout: 900_000,
  },
});

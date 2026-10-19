import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/vitest/**/*.test.{ts,tsx}"],
    coverage: {
      reportsDirectory: "test/vitest/coverage",
    },
    exclude: ["test/playwright/**", "**/.worktrees/**", "node_modules/**", "dist/**"],
    globals: true,
    passWithNoTests: true,
    reporters: ["default"],
  },
});

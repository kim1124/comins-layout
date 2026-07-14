import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../../src/styles.css", import.meta.url)), "utf8");

describe("comins-grid-layout typography contract", () => {
  it("uses the shared Comins typography tokens in widget chrome", () => {
    expect(css).toContain("--comins-font-family-base");
    expect(css).toContain("--comins-font-size-base");
    expect(css).toContain("font-family: var(--comins-font-family-base");
    expect(css).toContain("font-size: var(--comins-font-size-base");
  });
});

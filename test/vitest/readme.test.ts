import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  dashboardGridCommandNames,
  dashboardGridHandleNames,
  dashboardGridPropNames,
  publicDocTypeContract,
} from "./public-doc-contract";
import { inspectReadmeGif } from "../../scripts/inspect-readme-gif.mjs";

const readme = readFileSync("README.md", "utf8");
const apiContent = readFileSync("example/src/docs/content.tsx", "utf8");
const legacyGifPath = "docs/assets/comins-grid-layout-demo.gif";
const featureGifs = [
  {
    path: "docs/assets/comins-grid-layout-transfer.gif",
    marker: "Palette and grid transfer between controlled dashboards",
  },
  {
    path: "docs/assets/comins-grid-layout-external-drop.gif",
    marker: "External HTML drop target with consumer-owned state removal",
  },
  {
    path: "docs/assets/comins-grid-layout-responsive-persistence.gif",
    marker: "Responsive columns with per-column layout persistence",
  },
  {
    path: "docs/assets/comins-grid-layout-lazy-rendering.gif",
    marker: "React widget content rendering after lazy-scroll intersection",
  },
] as const;

describe("consumer README", () => {
  it("contains the required badges, demo, and consumer sections in order", () => {
    for (const marker of [
      "img.shields.io/npm/v/comins-grid-layout",
      "TypeScript-types%20included",
      "actions/workflows/verify.yml/badge.svg?branch=main",
      "License-MIT",
      ...featureGifs.map(({ path }) => path.split("/").at(-1)!),
    ]) expect(readme).toContain(marker);

    const headings = [
      "## Feature highlights",
      "## Features",
      "## Support",
      "## Installation",
      "## Quick start",
      "## Widget model",
      "## DashboardGrid props",
      "## External drop targets",
      "## Palette and grid transfer",
      "## Engine and responsive options",
      "## useDashboardGrid commands",
      "## Advanced GridStack access",
      "## Persistence",
      "## Styling",
      "## Playground",
      "## Documentation",
      "## Current boundaries",
      "## Development",
      "## Verification and security",
    ];
    const positions = headings.map((heading) => readme.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it("places the local demo command directly under module installation", () => {
    const installationStart = readme.indexOf("## Installation");
    const quickStart = readme.indexOf("## Quick start");
    const installation = readme.slice(installationStart, quickStart);

    expect(installation).toContain("npm install comins-grid-layout react react-dom");
    expect(installation).toContain("### Run the demo");
    expect(installation).toContain("npm run dev");
    expect(installation).toContain("http://127.0.0.1:6001/docs/getting-started");
    expect(installation.indexOf("npm install comins-grid-layout react react-dom"))
      .toBeLessThan(installation.indexOf("### Run the demo"));
  });

  it("documents every public prop, command, and advanced handle method", () => {
    expect(publicDocTypeContract).toEqual([true, true, true]);
    for (const name of [
      ...dashboardGridPropNames,
      ...dashboardGridCommandNames,
      ...dashboardGridHandleNames,
    ]) expect(readme).toContain(`\`${name}\``);
  });

  it("keeps the in-app API reference complete against the same public inventory", () => {
    for (const name of [
      ...dashboardGridPropNames,
      ...dashboardGridCommandNames,
      ...dashboardGridHandleNames,
    ]) expect(apiContent).toContain(name);
  });

  it("keeps deprecated aliases out of canonical TSX examples", () => {
    const tsxExamples = [...readme.matchAll(/```tsx\n([\s\S]*?)```/g)]
      .map((match) => match[1] ?? "")
      .join("\n");
    for (const name of [
      "onWidgetDragStart",
      "onWidgetDragStop",
      "onWidgetResizeStart",
      "onWidgetResizeStop",
      "onWidgetHeaderDoubleClick",
    ]) expect(tsxExamples).not.toContain(name);
    expect(tsxExamples).not.toMatch(/engineOptions=\{\{[^}]*lazyLoad/s);
  });

  it("documents transfer, lazy rendering, deprecation, and browser boundaries", () => {
    for (const text of [
      "fail-closed",
      "insertDashboardWidgetAtLayout",
      "transferDashboardWidget",
      "IntersectionObserver",
      "does not delay React-owned widget content",
      "planned for removal in `0.3.0`",
      "branded Edge is not directly certified",
      "no skeleton/loading-state API is currently provided",
    ]) expect(readme).toContain(text);
  });

  it("documents the per-column persistence and controlled GridStack contracts", () => {
    for (const text of [
      "DashboardColumnLayoutSnapshot",
      "DashboardLayoutsByColumn",
      "layoutsByColumn",
      "active columns' layout-only snapshot",
      "complete state snapshot",
      "Legacy snapshots",
      "12 -> 6 -> 12",
      "escape hatch",
      "raw GridStack add/remove/destroy",
    ]) expect(readme).toContain(text);
  });

  it("keeps four current-feature animations within the GIF contract", async () => {
    expect(existsSync(legacyGifPath)).toBe(false);
    expect(readme).not.toContain(legacyGifPath.split("/").at(-1));

    for (const { marker, path } of featureGifs) {
      expect(readme).toContain(marker);
      expect(existsSync(path), `${path} must exist`).toBe(true);
      if (!existsSync(path)) continue;
      const header = readFileSync(path).subarray(0, 6).toString("ascii");
      expect(["GIF87a", "GIF89a"]).toContain(header);
      expect(statSync(path).size).toBeLessThanOrEqual(5 * 1024 * 1024);
      const metadata = await inspectReadmeGif(path);
      expect(metadata.width).toBeLessThanOrEqual(960);
      expect(metadata.height).toBeLessThanOrEqual(720);
      expect(metadata.duration).toBeLessThanOrEqual(12);
      expect(metadata.frameCount).toBeGreaterThan(1);
      expect(metadata.loopCount).toBe(0);
    }
  });
});

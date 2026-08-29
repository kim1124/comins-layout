import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  dashboardGridCommandNames,
  dashboardGridHandleNames,
  dashboardGridPropNames,
  publicDocTypeContract,
} from "./public-doc-contract";

const readme = readFileSync("README.md", "utf8");
const apiContent = readFileSync("example/src/docs/content.tsx", "utf8");
const gifPath = "docs/assets/comins-grid-layout-demo.gif";

describe("consumer README", () => {
  it("contains the required badges, demo, and consumer sections in order", () => {
    for (const marker of [
      "img.shields.io/npm/v/comins-grid-layout",
      "TypeScript-types%20included",
      "actions/workflows/verify.yml/badge.svg?branch=main",
      "License-MIT",
      "comins-grid-layout-demo.gif",
    ]) expect(readme).toContain(marker);

    const headings = [
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
      "## Verification and security",
    ];
    const positions = headings.map((heading) => readme.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
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

  it("keeps the checked-in animation within the GIF contract", () => {
    const header = readFileSync(gifPath).subarray(0, 6).toString("ascii");
    expect(["GIF87a", "GIF89a"]).toContain(header);
    expect(statSync(gifPath).size).toBeLessThanOrEqual(5 * 1024 * 1024);
  });
});

import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readme = readFileSync("README.md", "utf8");
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
    for (const name of [
      "widgets", "columns", "editable", "movable", "resizable", "className", "refreshKey",
      "showControls", "actionLabels", "renderWidget", "onLayoutCommit", "onWidgetLayoutChange",
      "onWidgetResizeFrame", "onMaximizeWidget", "onMinimizeWidget", "onRestoreWidget",
      "onRemoveWidget", "onWidgetHeaderDoubleClick",
      "addWidget", "updateWidget", "updateWidgetLayout", "removeWidget", "clearWidgets",
      "maximizeWidget", "minimizeWidget", "restoreWidget", "autoArrangeWidgets",
      "fitWidgetsToColumns", "fitWidgetToColumns", "setColumns", "resetLayout", "restoreLayout",
      "refreshLayout", "serializeLayout", "serializeState",
      "getGridStack", "refresh", "commitLayout",
    ]) expect(readme).toContain(`\`${name}\``);
  });

  it("keeps the checked-in animation within the GIF contract", () => {
    const header = readFileSync(gifPath).subarray(0, 6).toString("ascii");
    expect(["GIF87a", "GIF89a"]).toContain(header);
    expect(statSync(gifPath).size).toBeLessThanOrEqual(5 * 1024 * 1024);
  });
});

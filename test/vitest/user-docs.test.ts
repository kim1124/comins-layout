import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { docsPages } from "../../example/src/docs/content";
import { playgroundPaths } from "../../example/src/playground/routes";
import {
  dashboardGridCommandNames,
  dashboardGridHandleNames,
  dashboardGridPropNames,
} from "./public-doc-contract";

const userDocs = [
  "01-quick-start.md",
  "02-controlled-state-and-crud.md",
  "03-widget-interactions-and-actions.md",
  "04-columns-arrange-and-reset.md",
  "05-persistence.md",
  "06-responsive-layouts.md",
  "07-external-drop-targets.md",
  "08-palette-and-grid-transfer.md",
  "09-lazy-rendering.md",
  "10-events-and-content-resize.md",
  "11-engine-options.md",
  "12-advanced-gridstack-access.md",
  "13-styling-accessibility-and-boundaries.md",
  "14-playground.md",
] as const;

const canonicalRoutes = [
  "/docs/getting-started",
  "/examples/widget/basic",
  "/examples/widget/manage",
  "/examples/widget/events",
  "/examples/layout/basic",
  "/examples/layout/lock",
  "/examples/layout/persistence",
  "/examples/layout/arrange",
  "/examples/layout/events",
  "/examples/advanced/lazy-load",
  "/examples/advanced/responsive/column",
  "/examples/advanced/responsive/breakpoints",
  "/examples/advanced/multi-grid/horizontal",
  "/examples/advanced/public-api",
  "/api",
] as const;

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function mergeGuides(directory: "user" | "ko") {
  return userDocs
    .filter((file) => existsSync(join(process.cwd(), "docs", directory, file)))
    .map((file) => read(join("docs", directory, file)))
    .join("\n");
}

describe("comins-grid-layout user documentation contract", () => {
  it("keeps matching English and Korean guides for every shipped area", () => {
    for (const file of userDocs) {
      expect(existsSync(join(process.cwd(), "docs/user", file)), `docs/user/${file}`).toBe(true);
      expect(existsSync(join(process.cwd(), "docs/ko", file)), `docs/ko/${file}`).toBe(true);
    }
  });

  it("documents every public prop, command, and handle in the primary guides", () => {
    const english = mergeGuides("user");
    for (const name of [
      ...dashboardGridPropNames,
      ...dashboardGridCommandNames,
      ...dashboardGridHandleNames,
    ]) {
      expect(english, `${name} should be documented`).toContain(`\`${name}\``);
    }
    for (const name of [
      "DashboardGrid",
      "DashboardGridConfigurationError",
      "DashboardWidget",
      "insertDashboardWidgetAtLayout",
      "serializeDashboardState",
      "transferDashboardWidget",
      "useDashboardDragIn",
      "useDashboardGrid",
    ]) {
      expect(english, `${name} should be documented`).toContain(`\`${name}\``);
    }
  });

  it("keeps Korean guides aligned on public API names and runnable routes", () => {
    const korean = mergeGuides("ko");
    for (const name of [
      "DashboardGrid",
      "DashboardWidget",
      "onLayoutCommit",
      "serializeState",
      "externalDropTargets",
      "onWidgetExternalDrop",
      "useDashboardDragIn",
      "onWidgetDropRequest",
      "lazyRenderWidget",
      "engineOptions",
      "getGridStack",
    ]) {
      expect(korean, `${name} should be documented in Korean guides`).toContain(`\`${name}\``);
    }
    for (const route of canonicalRoutes) expect(korean).toContain(route);
  });

  it("uses only canonical Playground and API routes in README and guides", () => {
    const content = [read("README.md"), mergeGuides("user"), mergeGuides("ko")].join("\n");
    expect(content).not.toContain("/examples/basic/add-remove");
    expect(content).not.toContain("/docs/api");
    for (const route of canonicalRoutes) expect(content).toContain(route);
  });

  it("keeps every documented route backed by the current example application", () => {
    const implementedRoutes = new Set([
      ...playgroundPaths,
      ...docsPages.map((page) => page.path),
    ]);
    for (const route of canonicalRoutes) {
      expect(implementedRoutes.has(route), `${route} should be implemented`).toBe(true);
    }
  });

  it("keeps relative links between user guides resolvable", () => {
    for (const directory of ["user", "ko"] as const) {
      for (const file of userDocs) {
        const content = read(join("docs", directory, file));
        for (const match of content.matchAll(/\]\(\.\/([^#)]+\.md)(?:#[^)]+)?\)/gu)) {
          const target = match[1];
          expect(
            target && existsSync(join(process.cwd(), "docs", directory, target)),
            `docs/${directory}/${file} -> ${target ?? "unknown"}`,
          ).toBe(true);
        }
      }
    }
  });

  it("links npm-rendered README to repository guides with absolute URLs", () => {
    const readme = read("README.md");
    expect(readme).toContain(
      "https://github.com/kim1124/comins-layout/blob/main/docs/user/01-quick-start.md",
    );
    expect(readme).toContain("https://github.com/kim1124/comins-layout/tree/main/docs/user");
    expect(readme).toContain("https://github.com/kim1124/comins-layout/tree/main/docs/ko");
    expect(readme).not.toMatch(/\]\(docs\/(?:user|ko)\//u);
  });

  it("keeps deprecated aliases out of canonical guide examples", () => {
    const examples = [...mergeGuides("user").matchAll(/```tsx\n([\s\S]*?)```/g)]
      .map((match) => match[1] ?? "")
      .join("\n");
    for (const name of [
      "onWidgetDragStart",
      "onWidgetDragStop",
      "onWidgetResizeStart",
      "onWidgetResizeStop",
      "onWidgetHeaderDoubleClick",
    ]) expect(examples).not.toContain(name);
    expect(examples).not.toMatch(/engineOptions=\{\{[^}]*lazyLoad/s);
  });

  it("separates user guides from maintainer and historical documentation", () => {
    const docsIndex = read("docs/README.md");
    expect(docsIndex).toContain("docs/user");
    expect(docsIndex).toContain("docs/ko");
    expect(docsIndex).toContain("Historical Records");
  });
});

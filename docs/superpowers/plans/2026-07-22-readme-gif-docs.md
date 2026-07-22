# Consumer README, Animated Demo, And Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repository-oriented Korean README with a complete English consumer guide, generate a real CRUD/drag/resize GIF from the public package API, and synchronize active API and decision documents.

**Architecture:** Reuse the deterministic `/readme-demo` consumer fixture created by the prerequisite GridStack handle/touch plan. Playwright captures actual UI frames, a repository-owned Swift ImageIO tool assembles the GIF without a new npm dependency, and a Vitest documentation contract prevents the README from drifting away from public props, commands, badges, and asset limits.

**Tech Stack:** Markdown, React/Vite example, Playwright 1.61, Swift 6 ImageIO, Vitest 4, GitHub/npm badge endpoints.

## Global Constraints

- Prerequisite: complete `2026-07-22-gridstack-handle-touch.md` through its full runtime gate.
- Write the root `README.md` in English and make it usable without reading repository-internal docs.
- Keep the current package name `comins-grid-layout`, React peer range `>=18.0.0 <20.0.0`, runtime column range `1..12`, and client-only SSR boundary exact.
- Include exactly the requested badge categories: npm version, TypeScript declarations, GitHub Verify, and MIT license.
- The GIF must come from the actual public component and commands; do not use a simulated or AI-generated product image.
- Keep the GIF at `docs/assets/comins-grid-layout-demo.gif`, no more than 5 MiB, approximately 960 CSS pixels wide, and approximately ten seconds or less.
- Use an absolute GitHub raw-content URL in README so npm rendering resolves the asset.
- Do not add an npm or runtime dependency for image encoding.
- Do not translate the existing complete playground; the capture-only fixture remains independently English.
- Document raw GridStack as an advanced borrowed instance. Comins commands remain the required path for React widget CRUD.
- Document keyboard widget movement/resize, Firefox, and Safari as unsupported boundaries, not open questions.
- Do not change package version, workflows, `SECURITY.md`, provider settings, npm metadata, or remote state in this plan.
- Never include a personal name, personal email, account path, token, detector value, fingerprint, or local environment detail in README, GIF, scripts, docs, reports, or captured frames.

---

## File Map

- Create `scripts/capture-readme-demo.mjs`: start the local example, drive CRUD/drag/resize, capture temporary PNG frames, invoke the encoder, enforce the size budget, and clean up.
- Create `scripts/encode-readme-gif.swift`: assemble PNG frames into a looping GIF with ImageIO.
- Create `docs/assets/comins-grid-layout-demo.gif`: checked-in real-product demo.
- Modify `package.json`: add only the repeatable `docs:readme-gif` script.
- Create `test/vitest/readme.test.ts`: enforce badges, sections, complete API names, GIF header, and size budget.
- Replace `README.md`: English consumer guide.
- Modify `docs/03-component-api-draft.md`: match the current props, commands, and advanced handle.
- Replace `docs/05-open-questions.md`: resolved decisions and explicit support boundaries.
- Modify `docs/README.md`: describe the resolved-decisions document accurately.
- Modify `reports/2026-07-22.md`: append documentation/GIF verification evidence.

---

### Task 1: Build A Repeatable Real-Product GIF Pipeline

**Files:**

- Create: `scripts/capture-readme-demo.mjs`
- Create: `scripts/encode-readme-gif.swift`
- Create: `docs/assets/comins-grid-layout-demo.gif`
- Modify: `package.json`

**Interfaces:**

- Consumes: `/readme-demo`, visible `Add widget`, widget title drag surface, southeast resize handle, and English `Remove` action.
- Produces: `npm run docs:readme-gif` and `docs/assets/comins-grid-layout-demo.gif`.

- [ ] **Step 1: Verify the asset does not already satisfy the contract**

Run:

```bash
test -f docs/assets/comins-grid-layout-demo.gif
```

Expected: FAIL before the new asset is created.

- [ ] **Step 2: Create the Swift ImageIO encoder**

Create `scripts/encode-readme-gif.swift`:

```swift
import Foundation
import ImageIO
import UniformTypeIdentifiers

let arguments = CommandLine.arguments
guard arguments.count >= 5 else {
  FileHandle.standardError.write(Data("gif-encode: invalid arguments\n".utf8))
  exit(1)
}

let outputURL = URL(fileURLWithPath: arguments[1])
guard let delay = Double(arguments[2]), delay > 0 else {
  FileHandle.standardError.write(Data("gif-encode: invalid delay\n".utf8))
  exit(1)
}

let frameURLs = arguments.dropFirst(3).map { URL(fileURLWithPath: $0) }
guard let destination = CGImageDestinationCreateWithURL(
  outputURL as CFURL,
  UTType.gif.identifier as CFString,
  frameURLs.count,
  nil
) else {
  FileHandle.standardError.write(Data("gif-encode: destination failed\n".utf8))
  exit(1)
}

let gifProperties: CFDictionary = [
  kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0],
] as CFDictionary
CGImageDestinationSetProperties(destination, gifProperties)

let frameProperties: CFDictionary = [
  kCGImagePropertyGIFDictionary: [
    kCGImagePropertyGIFDelayTime: delay,
    kCGImagePropertyGIFUnclampedDelayTime: delay,
  ],
] as CFDictionary

for frameURL in frameURLs {
  guard
    let source = CGImageSourceCreateWithURL(frameURL as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    FileHandle.standardError.write(Data("gif-encode: frame failed\n".utf8))
    exit(1)
  }
  CGImageDestinationAddImage(destination, image, frameProperties)
}

guard CGImageDestinationFinalize(destination) else {
  FileHandle.standardError.write(Data("gif-encode: finalize failed\n".utf8))
  exit(1)
}
```

- [ ] **Step 3: Create the Playwright frame capture script**

Create `scripts/capture-readme-demo.mjs`:

```js
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(scriptsRoot);
const outputDirectory = join(repositoryRoot, "docs", "assets");
const outputPath = join(outputDirectory, "comins-grid-layout-demo.gif");
const frameRoot = await mkdtemp(join(tmpdir(), "comins-grid-layout-readme-frames-"));
const port = Number(process.env.COMINS_README_GIF_PORT ?? 6102);
const baseURL = `http://127.0.0.1:${port}`;
let server;
let browser;
let frameNumber = 0;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/readme-demo`);
      if (response.ok) return;
    } catch {
      // The fixed local server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("readme-gif: server unavailable");
}

async function capture(page, count = 1) {
  const demo = page.locator(".readme-demo");
  const box = await demo.boundingBox();
  if (!box) throw new Error("readme-gif: capture surface unavailable");

  for (let index = 0; index < count; index += 1) {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const filename = `frame-${String(frameNumber).padStart(3, "0")}.png`;
    frameNumber += 1;
    await page.screenshot({
      path: join(frameRoot, filename),
      clip: {
        x: Math.floor(box.x),
        y: Math.floor(box.y),
        width: Math.min(960, Math.floor(box.width)),
        height: Math.floor(box.height),
      },
    });
  }
}

async function moveAndCapture(page, start, delta, steps = 12) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(
      start.x + (delta.x * step) / steps,
      start.y + (delta.y * step) / steps,
    );
    await capture(page);
  }
  await page.mouse.up();
  await capture(page, 4);
}

try {
  server = spawn(join(repositoryRoot, "node_modules", ".bin", "vite"), ["--config", "vite.example.config.ts"], {
    cwd: repositoryRoot,
    env: { ...process.env, COMINS_GRID_LAYOUT_PORT: String(port) },
    stdio: "ignore",
  });
  await waitForServer();

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1000, height: 720 } });
  await page.goto(`${baseURL}/readme-demo`);
  await page.getByRole("heading", { name: "Interactive dashboards for React" }).waitFor();
  await capture(page, 8);

  await page.getByRole("button", { name: "Add widget" }).click();
  const widget = page.getByTestId("dashboard-widget-new-widget");
  await widget.waitFor();
  await capture(page, 8);

  const titleBox = await widget.locator(".comins-grid-layout-widget__title").boundingBox();
  if (!titleBox) throw new Error("readme-gif: drag title unavailable");
  await moveAndCapture(
    page,
    { x: titleBox.x + titleBox.width / 2, y: titleBox.y + titleBox.height / 2 },
    { x: 300, y: 0 },
  );

  const widgetBox = await widget.boundingBox();
  if (!widgetBox) throw new Error("readme-gif: resize widget unavailable");
  await widget.hover({ position: { x: widgetBox.width - 4, y: widgetBox.height - 4 } });
  const handleBox = await widget.locator(".ui-resizable-se").boundingBox();
  if (!handleBox) throw new Error("readme-gif: resize handle unavailable");
  await moveAndCapture(
    page,
    { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 },
    { x: 0, y: 110 },
  );

  await page.getByRole("button", { name: "New widget Remove" }).click();
  await widget.waitFor({ state: "detached" });
  await capture(page, 8);

  await mkdir(outputDirectory, { recursive: true });
  const frames = (await readdir(frameRoot))
    .filter((name) => name.endsWith(".png"))
    .sort()
    .map((name) => join(frameRoot, name));
  execFileSync("swift", [join(scriptsRoot, "encode-readme-gif.swift"), outputPath, "0.08", ...frames], {
    cwd: repositoryRoot,
    stdio: "inherit",
  });

  const result = await stat(outputPath);
  if (result.size > 5 * 1024 * 1024) {
    throw new Error("readme-gif: size budget exceeded");
  }
  process.stdout.write("README GIF generated.\n");
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
  await rm(frameRoot, { recursive: true, force: true });
}
```

The only retained output is the GIF. Temporary PNG paths never enter repository files or reports.

- [ ] **Step 4: Add the package script**

Add this script to `package.json` without changing the package version:

```json
"docs:readme-gif": "node scripts/capture-readme-demo.mjs"
```

- [ ] **Step 5: Generate and inspect the GIF**

Run:

```bash
npm run docs:readme-gif
file docs/assets/comins-grid-layout-demo.gif
du -k docs/assets/comins-grid-layout-demo.gif
```

Expected: generation succeeds, `file` reports GIF image data near 960 pixels wide, and the size is below 5120 KiB. Inspect the GIF visually and confirm the visible sequence is initial read, create, drag, resize/update, and delete with English-only copy.

- [ ] **Step 6: Verify cleanup and commit the pipeline**

```bash
git status --short
npm run check:security
git diff --check
git add package.json scripts/capture-readme-demo.mjs scripts/encode-readme-gif.swift docs/assets/comins-grid-layout-demo.gif
git diff --cached --check
git commit -m "docs: add the real Grid Layout demo animation"
```

Expected: no PNG frame directory, dev server, archive, or temporary capture file remains.

---

### Task 2: Replace README With The English Consumer Guide

**Files:**

- Create: `test/vitest/readme.test.ts`
- Replace: `README.md`

**Interfaces:**

- Consumes: public exports and GIF from the prerequisite work and Task 1.
- Produces: a tested English README rendered consistently on GitHub and npm.

- [ ] **Step 1: Write the failing README contract test**

Create `test/vitest/readme.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
npx vitest run test/vitest/readme.test.ts
```

Expected: FAIL against the current Korean, repository-oriented README.

- [ ] **Step 3: Replace README with the exact consumer structure and facts**

Replace `README.md` with an English document containing the following exact opening:

```markdown
# comins-grid-layout

[![npm version](https://img.shields.io/npm/v/comins-grid-layout.svg)](https://www.npmjs.com/package/comins-grid-layout)
![TypeScript types](https://img.shields.io/badge/TypeScript-types%20included-3178C6?logo=typescript&logoColor=white)
[![Verify](https://github.com/kim1124/comins-layout/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/kim1124/comins-layout/actions/workflows/verify.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/kim1124/comins-layout/blob/main/LICENSE)

`comins-grid-layout` is a React dashboard layout module powered by GridStack. It combines serializable React state with widget CRUD, drag, resize, responsive columns, maximize/minimize flows, persistence, and an advanced escape hatch to the underlying GridStack API.

![Widget CRUD, drag, and resize demo](https://raw.githubusercontent.com/kim1124/comins-layout/main/docs/assets/comins-grid-layout-demo.gif)
```

Then write the sections below using the exact public facts and tables. Do not include repository setup before the consumer API.

````markdown
## Features

- Create, render, update, remove, clear, maximize, minimize, restore, arrange, and serialize widgets.
- Drag and resize with desktop pointer input and mobile touch input.
- Change the runtime column count from 1 through 12.
- Keep application data in serializable React state while GridStack owns browser interaction.
- Schedule resize-frame notifications for charts, tables, canvases, and other responsive widget content.
- Access the complete GridStack public instance through an optional advanced ref handle.
- Render 100 or more widgets with repeated runtime column changes covered by the resource gate.

## Support

| Surface | Supported contract |
| --- | --- |
| React / React DOM | `>=18.0.0 <20.0.0` peer dependencies |
| TypeScript | Declarations and declaration maps included; verified with TypeScript 6 |
| Desktop browsers | Current Chromium-based Chrome and Edge; automated with Playwright Chromium |
| Mobile browsers | Current mobile Chrome touch behavior; automated with the Pixel 7 Chromium profile |
| Firefox / Safari | Not currently verified or supported |
| SSR frameworks | Import and render inside a client boundary; the package does not use Next.js-only APIs |
| Runtime network behavior | No package-owned requests, remote assets, telemetry, or error reporting |

Before `1.0.0`, only the latest published version receives security fixes.

## Installation

```bash
npm install comins-grid-layout react react-dom
```

Import both stylesheets once in the client bundle:

```ts
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";
```

## Quick start

```tsx
import { DashboardGrid, useDashboardGrid, type DashboardWidget } from "comins-grid-layout";
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";

type Metric = { label: string; value: string };

const initialWidgets: DashboardWidget<Metric>[] = [
  {
    id: "sales",
    title: "Sales",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "Monthly revenue", value: "$128K" },
  },
];

export function DashboardPage() {
  const dashboard = useDashboardGrid({ initialColumns: 12, initialWidgets });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      refreshKey={dashboard.refreshVersion}
      widgets={dashboard.widgets}
      actionLabels={{ maximize: "Maximize", minimize: "Minimize", restore: "Restore", remove: "Remove" }}
      onMaximizeWidget={dashboard.commands.maximizeWidget}
      onMinimizeWidget={dashboard.commands.minimizeWidget}
      onRemoveWidget={dashboard.commands.removeWidget}
      onRestoreWidget={dashboard.commands.restoreWidget}
      onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
      renderWidget={(widget) => (
        <div>
          <span>{widget.data?.label}</span>
          <strong>{widget.data?.value}</strong>
        </div>
      )}
    />
  );
}
```

`widgets` is the React source of truth. Connect `onWidgetLayoutChange` to `updateWidgetLayout` so committed GridStack movement and resize geometry is retained after rerender.

## Widget model

```ts
type DashboardWidget<TData = unknown> = {
  id: string;
  title?: string;
  layout: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  data?: TData;
  minimized?: boolean;
  maximized?: boolean;
  locked?: boolean;
  movable?: boolean;
  resizable?: boolean;
};
```

Widget IDs are preserved across CRUD, movement, resize, serialization, restore, maximize, and minimize flows.

## DashboardGrid props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `widgets` | `DashboardWidget<TData>[]` | required | Controlled widget models and layout geometry |
| `renderWidget` | `(widget) => ReactNode` | required | Consumer-owned widget content renderer |
| `columns` | `DashboardColumnCount` | `12` | Runtime column count from 1 through 12 |
| `editable` | `boolean` | `true` | Enables both movement and resize when their flags also allow it |
| `movable` | `boolean` | `true` | Enables grid-wide movement |
| `resizable` | `boolean` | `true` | Enables grid-wide resize |
| `className` | `string` | — | Additional class on the grid section |
| `refreshKey` | `number` | — | Requests an adapter refresh when the value changes |
| `showControls` | `boolean` | `true` | Shows widget header actions |
| `actionLabels` | `Partial<DashboardWidgetActionLabels>` | built-in labels | Overrides accessible action labels |
| `onLayoutCommit` | `(snapshot) => void` | — | Receives a committed layout snapshot |
| `onWidgetLayoutChange` | `(id, layout) => void` | — | Receives each committed widget geometry update |
| `onWidgetResizeFrame` | `(event) => void` | — | Receives animation-frame-scheduled content dimensions during resize |
| `onMaximizeWidget` | `(id) => void` | — | Handles maximize action |
| `onMinimizeWidget` | `(id) => void` | — | Handles minimize action |
| `onRestoreWidget` | `(id) => void` | — | Handles restore action |
| `onRemoveWidget` | `(id) => void` | — | Handles remove action |
| `onWidgetHeaderDoubleClick` | `(id) => void` | — | Handles a widget header double-click |

## useDashboardGrid commands

| Command | Signature | Purpose |
| --- | --- | --- |
| `addWidget` | `(widget) => void` | Add a widget while preserving its ID |
| `updateWidget` | `(id, patch) => void` | Update widget data, title, state, or interaction flags |
| `updateWidgetLayout` | `(id, patch) => void` | Update serializable geometry |
| `removeWidget` | `(id) => void` | Remove one widget |
| `clearWidgets` | `() => void` | Remove every widget |
| `maximizeWidget` | `(id) => void` | Expand a widget and retain its previous layout |
| `minimizeWidget` | `(id) => void` | Collapse a widget and retain its previous layout |
| `restoreWidget` | `(id) => void` | Restore the retained layout |
| `autoArrangeWidgets` | `() => void` | Compact widgets with the package layout rule |
| `fitWidgetsToColumns` | `() => void` | Fit every widget into the current columns |
| `fitWidgetToColumns` | `(id) => void` | Fit one widget to the current columns |
| `setColumns` | `(columns) => void` | Clamp and apply a runtime column count from 1 through 12 |
| `resetLayout` | `(snapshot?) => void` | Reset to the initial state or a supplied layout/state snapshot |
| `restoreLayout` | `(snapshot) => void` | Restore a complete state snapshot |
| `refreshLayout` | `() => void` | Increment `refreshVersion` for adapter refresh |
| `serializeLayout` | `() => DashboardLayoutSnapshot` | Serialize columns and geometry only |
| `serializeState` | `() => DashboardStateSnapshot<TData>` | Serialize columns, widgets, and previous layouts |

## Advanced GridStack access

Use a ref only when the package commands do not cover an engine-level operation:

```tsx
import { useRef } from "react";
import { DashboardGrid, type DashboardGridHandle } from "comins-grid-layout";

const gridRef = useRef<DashboardGridHandle>(null);

<DashboardGrid ref={gridRef} widgets={widgets} renderWidget={renderWidget} />;

const grid = gridRef.current?.getGridStack();
grid?.batchUpdate();
grid?.float(true);
grid?.compact();
grid?.batchUpdate(false);

const snapshot = gridRef.current?.commitLayout();
gridRef.current?.refresh();
```

| Handle method | Return type | Purpose |
| --- | --- | --- |
| `getGridStack` | `GridStack \| null` | Borrow the live engine instance while the grid is mounted |
| `refresh` | `void` | Ask GridStack to recalculate its current layout |
| `commitLayout` | `DashboardLayoutSnapshot \| null` | Commit direct engine geometry changes to the controlled callback contract |

- `getGridStack()` returns `null` before initialization and after unmount.
- GridStack methods that emit `change` are committed automatically; `commitLayout()` is for direct geometry changes that do not emit it and suppresses identical duplicate commits.
- Use Comins `addWidget` and `removeWidget` for React content. Raw GridStack CRUD only changes engine/DOM state and may be replaced by the next controlled React render.
- Do not call `destroy()` or remove package listeners on the borrowed instance; `DashboardGrid` owns the engine lifecycle.

## Persistence

Use `serializeState()` for complete persistence, including the `previousLayouts` required by maximize/minimize restore. Use `serializeLayout()` only when widget data and view state are stored elsewhere.

```ts
const stored = dashboard.commands.serializeState();
localStorage.setItem("dashboard", JSON.stringify(stored));

const restored = JSON.parse(localStorage.getItem("dashboard") ?? "null");
if (restored) dashboard.commands.restoreLayout(restored);
```

## Styling

Public CSS classes and custom properties are scoped under `.comins-grid-layout`. The package does not apply a global reset or require a Comins design system. Override package variables on a local container when needed.

## Verification and security

- `npm run verify` runs sensitive-data gates, TypeScript, Vitest, and the production build.
- `npm run verify:full` adds desktop Chromium, mobile Chromium touch behavior, and the isolated 100-widget resource gate.
- Vulnerabilities must be reported privately through [GitHub Private Vulnerability Reporting](https://github.com/kim1124/comins-layout/security/advisories/new).
- See the [security policy](https://github.com/kim1124/comins-layout/blob/main/SECURITY.md), [changelog](https://github.com/kim1124/comins-layout/blob/main/CHANGELOG.md), and [complete example](https://github.com/kim1124/comins-layout/tree/main/example).

## License

[MIT](https://github.com/kim1124/comins-layout/blob/main/LICENSE)
````

- [ ] **Step 4: Run the README contract and inspect rendering**

Run:

```bash
npx vitest run test/vitest/readme.test.ts
npm pack --json --dry-run --ignore-scripts
```

Expected: the test passes, npm includes `README.md`, and no local path or docs asset is added to the runtime tarball. Open the Markdown preview and confirm the table/code/GIF layout is readable at iPad width.

- [ ] **Step 5: Commit the README contract**

```bash
git add README.md test/vitest/readme.test.ts
git diff --cached --check
git commit -m "docs: rewrite the Grid Layout consumer guide"
```

---

### Task 3: Synchronize Active API And Decision Documents

**Files:**

- Modify: `docs/03-component-api-draft.md`
- Replace: `docs/05-open-questions.md`
- Modify: `docs/README.md`

**Interfaces:**

- Consumes: public source and README from earlier tasks.
- Produces: active docs with no implemented decision presented as open.

- [ ] **Step 1: Demonstrate the current documentation drift**

Run:

```bash
rg -n "onWidgetHeaderDoubleClick|DashboardGridHandle|DashboardStateSnapshotInput" docs/03-component-api-draft.md
rg -n "결정이 필요|키보드 기반" docs/05-open-questions.md
```

Expected: the API document lacks at least the handle and header callback, while the open-questions document still lists implemented decisions and keyboard scope as unresolved.

- [ ] **Step 2: Correct the API draft**

Add this prop to the `DashboardGridProps` block in `docs/03-component-api-draft.md`:

```ts
onWidgetHeaderDoubleClick?: (id: string) => void;
```

Change `resetLayout` to:

```ts
resetLayout: (snapshot?: DashboardLayoutSnapshot | DashboardStateSnapshotInput<TData>) => void;
```

Add this section before `Option Semantics`:

````markdown
## DashboardGridHandle

```ts
interface DashboardGridHandle {
  getGridStack(): GridStack | null;
  refresh(): void;
  commitLayout(): DashboardLayoutSnapshot | null;
}
```

The handle is an optional advanced escape hatch. Comins commands remain the primary React state and CRUD API. The returned GridStack instance is borrowed; DashboardGrid owns initialization, listeners, and destruction.
````

Update `Current Export Surface` to state that `DashboardGridHandle` is public while adapter creation remains internal.

- [ ] **Step 3: Replace stale open questions with resolved decisions**

Replace `docs/05-open-questions.md` with:

```markdown
# Resolved Decisions And Support Boundaries

## Resolved Product Decisions

- GridStack is the browser interaction engine and remains behind the package-owned adapter.
- `DashboardGrid` is controlled by the `widgets` prop; `useDashboardGrid()` is the provided state helper.
- Maximize, minimize, restore, auto-arrange, runtime columns, persistence, and widget CRUD use the implemented package commands.
- `DashboardGridHandle` provides advanced access to the borrowed GridStack instance without replacing controlled React state.
- Desktop pointer and mobile Chrome touch drag/resize are supported and covered by Playwright.

## Explicit Support Boundaries

- Runtime columns are limited to 1 through 12.
- Keyboard widget movement and resize are not implemented. Normal button controls retain their keyboard behavior.
- Firefox and Safari are not verified or supported until dedicated browser projects are approved.
- SSR consumers must render the package inside a client boundary.
- Raw GridStack add/remove operations do not create or remove React widget content; use Comins CRUD commands.

## Operational Decisions

- Before 1.0.0, only the latest published version receives security fixes.
- Exact package-artifact inspection and automatic provenance follow Comins Contract v1.2 governance.
- Legacy npm versions and public account metadata are provider-side remediation work and are not hidden by current-change gates.
```

- [ ] **Step 4: Correct the docs index description**

In `docs/README.md`, change the `05-open-questions.md` description to:

```markdown
- `05-open-questions.md`: resolved product decisions, explicit unsupported behavior, and provider-side boundaries
```

Do not rename the historical file in this release; changing inbound links adds no consumer value.

- [ ] **Step 5: Verify the documentation contract and commit**

Run:

```bash
rg -n "onWidgetHeaderDoubleClick|DashboardGridHandle|DashboardStateSnapshotInput" docs/03-component-api-draft.md
rg -n "Resolved Product Decisions|Explicit Support Boundaries|Operational Decisions" docs/05-open-questions.md
! rg -n "결정이 필요" docs/05-open-questions.md
git diff --check
```

Expected: every required marker is present, no stale decision phrase remains, and the diff is clean.

```bash
git add docs/03-component-api-draft.md docs/05-open-questions.md docs/README.md
git diff --cached --check
git commit -m "docs: synchronize the Grid Layout API decisions"
```

---

### Task 4: Run Documentation And Package Verification

**Files:**

- Modify: `reports/2026-07-22.md`

**Interfaces:**

- Consumes: Tasks 1-3 and the prerequisite runtime plan.
- Produces: verified README/GIF/docs evidence for release preparation.

- [ ] **Step 1: Run focused documentation checks**

```bash
npm run docs:readme-gif
npx vitest run test/vitest/readme.test.ts
npm run typecheck
npm run build
```

Expected: the GIF regenerates within the size budget, the README contract passes, and the example/public snippets typecheck and build.

- [ ] **Step 2: Run browser-visible demo verification**

```bash
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "GridStack handle"
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=mobile-chrome --grep "with touch"
```

Expected: the capture fixture still represents working CRUD/API/touch behavior.

- [ ] **Step 3: Run the baseline package gate**

```bash
npm run verify
npm run test:consumer
git diff --check
```

Expected: security, TypeScript, Vitest, build, and consumer package checks pass. The full browser gate already ran in the prerequisite runtime plan and will run again in the release plan.

- [ ] **Step 4: Append the documentation checkpoint**

Append this timestamped section to `reports/2026-07-22.md`, replacing `HH:MM` and statuses with executed evidence:

```markdown
## 0.1.4 Consumer README And Demo Verification — HH:MM KST

### Summary

- Replaced the root README with an English consumer guide covering support, installation, usage, all props, all commands, persistence, styling, and advanced GridStack access.
- Generated the checked-in CRUD/drag/resize GIF from the actual English consumer fixture without a new npm dependency.
- Reconciled the active component API and resolved-decision documents with source.

### Verification

- npm run docs:readme-gif: PASS, GIF within 5 MiB
- focused README Vitest contract: PASS
- npm run typecheck: PASS
- npm run build: PASS
- focused desktop/mobile Playwright: PASS
- npm run verify: PASS
- npm run test:consumer: PASS

### Residual Boundaries

- Firefox, Safari, and keyboard layout manipulation remain explicitly unsupported.
- Version, workflow, release, npm deprecation, support, and account metadata work remains in the dependent release plan.
```

- [ ] **Step 5: Commit report evidence and confirm hygiene**

```bash
npm run check:security
git status --short
git diff --check
git add reports/2026-07-22.md
git diff --cached --check
git commit -m "docs: record README and demo verification"
```

Expected: the only retained generated binary is `docs/assets/comins-grid-layout-demo.gif`; no PNG frames or temporary servers remain.

## Completion Gate

- [ ] README is English and consumer-first, with all required badges and the real GIF at the top.
- [ ] Every public prop, command, and handle method is documented with correct types/defaults.
- [ ] Installation, stylesheet imports, client boundary, browser support, persistence, and raw GridStack safety are explicit.
- [ ] The GIF shows read, create, drag, resize/update, and delete using the actual module.
- [ ] The GIF pipeline is repeatable on macOS and adds no npm/runtime dependency.
- [ ] API and decision docs contain no stale unresolved implementation decision.
- [ ] Focused docs, browser, build, security, and consumer checks pass.
- [ ] Report evidence is value-free and no temporary capture artifact remains.

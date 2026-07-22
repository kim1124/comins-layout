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

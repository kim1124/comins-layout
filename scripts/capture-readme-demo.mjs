import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { inspectReadmeGif } from "./inspect-readme-gif.mjs";

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(scriptsRoot);
const outputDirectory = join(repositoryRoot, "docs", "assets");
const legacyOutputPath = join(outputDirectory, "comins-grid-layout-demo.gif");
const temporaryRoot = await mkdtemp(join(tmpdir(), "comins-grid-layout-readme-gifs-"));
const port = Number(process.env.COMINS_README_GIF_PORT ?? 6102);
const baseURL = `http://127.0.0.1:${port}`;
const gifDelay = 0.08;
const sceneDefinitions = [
  {
    feature: "transfer",
    output: "comins-grid-layout-transfer.gif",
    capture: captureTransfer,
  },
  {
    feature: "external-drop",
    output: "comins-grid-layout-external-drop.gif",
    capture: captureExternalDrop,
  },
  {
    feature: "responsive-persistence",
    output: "comins-grid-layout-responsive-persistence.gif",
    capture: captureResponsivePersistence,
  },
  {
    feature: "lazy-rendering",
    output: "comins-grid-layout-lazy-rendering.gif",
    capture: captureLazyRendering,
  },
];
let server;
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/readme-demo?feature=transfer`);
      if (response.ok) return;
    } catch {
      // The fixed local server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("readme-gif: server unavailable");
}

async function captureFrame(page, frameDirectory, sequence, count = 1) {
  const surface = page.locator(".readme-feature-demo");
  const box = await surface.boundingBox();
  if (!box) throw new Error("readme-gif: capture surface unavailable");

  for (let index = 0; index < count; index += 1) {
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    const filename = `frame-${String(sequence.current).padStart(3, "0")}.png`;
    sequence.current += 1;
    await page.screenshot({
      path: join(frameDirectory, filename),
      clip: {
        x: Math.floor(box.x),
        y: Math.floor(box.y),
        width: Math.min(960, Math.floor(box.width)),
        height: Math.min(720, Math.floor(box.height)),
      },
    });
  }
}

async function dragAndCapture(page, source, target, frameDirectory, sequence) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) throw new Error("readme-gif: drag geometry unavailable");
  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  const end = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + Math.min(targetBox.height / 2, 40),
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= 14; step += 1) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * step) / 14,
      start.y + ((end.y - start.y) * step) / 14,
    );
    await captureFrame(page, frameDirectory, sequence);
  }
  await page.mouse.up();
  await captureFrame(page, frameDirectory, sequence, 6);
}

async function captureTransfer(page, frameDirectory, sequence) {
  const sourceGrid = page.getByTestId("readme-transfer-source");
  const targetGrid = page.getByTestId("readme-transfer-target");
  await page.getByRole("heading", { name: "Palette and Grid Transfer" }).waitFor();
  await captureFrame(page, frameDirectory, sequence, 6);
  await dragAndCapture(
    page,
    page.getByTestId("readme-palette-metric"),
    targetGrid.locator(".grid-stack"),
    frameDirectory,
    sequence,
  );
  await page.getByTestId("dashboard-widget-palette-metric-1").waitFor();
  await dragAndCapture(
    page,
    sourceGrid.getByTestId("dashboard-widget-source-sales").locator(".comins-grid-layout-widget__title"),
    targetGrid.locator(".grid-stack"),
    frameDirectory,
    sequence,
  );
  await targetGrid.getByTestId("dashboard-widget-source-sales").waitFor();
}

async function captureExternalDrop(page, frameDirectory, sequence) {
  await page.getByRole("heading", { name: "External HTML Drop Target" }).waitFor();
  await captureFrame(page, frameDirectory, sequence, 8);
  const widget = page.getByTestId("dashboard-widget-drop-alerts");
  await dragAndCapture(
    page,
    widget.locator(".comins-grid-layout-widget__title"),
    page.getByTestId("readme-drop-trash"),
    frameDirectory,
    sequence,
  );
  await widget.waitFor({ state: "detached" });
  await captureFrame(page, frameDirectory, sequence, 6);
}

async function captureResponsivePersistence(page, frameDirectory, sequence) {
  await page.getByRole("heading", { name: "Responsive Columns and Persistence" }).waitFor();
  await captureFrame(page, frameDirectory, sequence, 8);
  for (const button of ["Use 6 columns", "Move in 6 columns", "Use 12 columns", "Use 6 columns"]) {
    await page.getByRole("button", { name: button }).click();
    await captureFrame(page, frameDirectory, sequence, 7);
  }
}

async function captureLazyRendering(page, frameDirectory, sequence) {
  await page.getByRole("heading", { name: "React Content Lazy Rendering" }).waitFor();
  await captureFrame(page, frameDirectory, sequence, 8);
  const scroll = page.getByTestId("readme-lazy-scroll");
  for (let step = 1; step <= 16; step += 1) {
    await scroll.evaluate((element, progress) => {
      element.scrollTop = (element.scrollHeight - element.clientHeight) * progress;
      element.dispatchEvent(new Event("scroll"));
    }, step / 16);
    await captureFrame(page, frameDirectory, sequence);
  }
  await page.getByTestId("readme-lazy-deferred-content").waitFor();
  await captureFrame(page, frameDirectory, sequence, 8);
}

async function validateGif(path) {
  const metadata = await inspectReadmeGif(path);
  if (metadata.width > 960 || metadata.height > 720) {
    throw new Error(`readme-gif: dimensions exceed 960x720 for ${basename(path)}`);
  }
  if (metadata.duration > 12) {
    throw new Error(`readme-gif: duration exceeds 12 seconds for ${basename(path)}`);
  }
  if (metadata.loopCount !== 0) {
    throw new Error(`readme-gif: infinite loop metadata missing for ${basename(path)}`);
  }
  if (metadata.frameCount < 2) {
    throw new Error(`readme-gif: animation frames missing for ${basename(path)}`);
  }
  if (metadata.size > 5 * 1024 * 1024) {
    throw new Error(`readme-gif: size exceeds 5 MiB for ${basename(path)}`);
  }
  return metadata;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function finalizeGifs(generated) {
  await mkdir(outputDirectory, { recursive: true });
  const stageDirectory = await mkdtemp(join(outputDirectory, ".readme-gif-stage-"));
  const backupDirectory = join(stageDirectory, "backup");
  await mkdir(backupDirectory);
  const installed = [];
  const backedUp = [];

  try {
    for (const item of generated) {
      const staged = join(stageDirectory, item.output);
      await copyFile(item.path, staged);
      await validateGif(staged);
      item.staged = staged;
    }

    const targets = [
      ...generated.map((item) => join(outputDirectory, item.output)),
      legacyOutputPath,
    ];
    for (const target of targets) {
      if (await pathExists(target)) {
        const backup = join(backupDirectory, basename(target));
        await rename(target, backup);
        backedUp.push({ backup, target });
      }
    }

    for (const item of generated) {
      const target = join(outputDirectory, item.output);
      await rename(item.staged, target);
      installed.push(target);
    }
  } catch (error) {
    for (const target of installed.reverse()) {
      await rm(target, { force: true });
    }
    for (const { backup, target } of backedUp.reverse()) {
      if (await pathExists(backup)) await rename(backup, target);
    }
    throw error;
  } finally {
    await rm(stageDirectory, { recursive: true, force: true });
  }
}

try {
  server = spawn(
    process.execPath,
    [
      join(repositoryRoot, "node_modules", "vite", "bin", "vite.js"),
      "--config",
      "vite.example.config.ts",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: repositoryRoot, env: process.env, stdio: "ignore" },
  );
  await waitForServer();

  browser = await chromium.launch({ headless: true });
  const generated = [];
  for (const scene of sceneDefinitions) {
    const frameDirectory = join(temporaryRoot, scene.feature);
    await mkdir(frameDirectory);
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: { width: 1000, height: 720 },
    });
    const sequence = { current: 0 };
    try {
      await page.goto(`${baseURL}/readme-demo?feature=${scene.feature}`);
      await scene.capture(page, frameDirectory, sequence);
    } finally {
      await page.close();
    }

    const frames = (await readdir(frameDirectory))
      .filter((name) => name.endsWith(".png"))
      .sort()
      .map((name) => join(frameDirectory, name));
    const output = join(temporaryRoot, scene.output);
    execFileSync(
      "swift",
      [join(scriptsRoot, "encode-readme-gif.swift"), output, String(gifDelay), ...frames],
      { cwd: repositoryRoot, stdio: "inherit" },
    );
    const metadata = await validateGif(output);
    generated.push({ ...scene, metadata, path: output });
  }

  await finalizeGifs(generated);
  for (const { metadata, output } of generated) {
    process.stdout.write(`${output}: ${JSON.stringify(metadata)}\n`);
  }
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}

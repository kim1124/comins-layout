import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, expect } from "@playwright/test";
import { verifyConsumerIsolation, verifyFrameworkBoundary } from "./verify-framework-boundary.mjs";

const repository = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = await mkdtemp(join(tmpdir(), "comins-grid-consumers-"));
const env = { ...process.env, npm_config_cache: join(temporary, "npm-cache"), npm_config_logs_dir: join(temporary, "npm-logs") };
for (const key of ["NODE_PATH", "NODE_OPTIONS", "TS_NODE_PROJECT", "TS_NODE_COMPILER_OPTIONS"]) delete env[key];
const report = { generatedAt: new Date().toISOString(), tarball: null, consumers: [] };
let browser;
function run(command, args, cwd = repository) {
  try { return execFileSync(command, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
  catch (error) { throw new Error(`${command} ${args.join(" ")}\n${error.stdout ?? ""}\n${error.stderr ?? ""}`, { cause: error }); }
}
const npm = (args, cwd) => run("npm", args, cwd);
// Keep scoped package names and pinned versions distinct from email-like text.
const pin = (name, version) => `${name}@${version}`;
async function json(path, data) { await writeFile(path, JSON.stringify(data, null, 2)); }
async function installed(root, name) { return JSON.parse(await readFile(join(root, "node_modules", name, "package.json"), "utf8")).version; }
async function browserCheck(root) {
  const directory = join(root, "dist");
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const file = resolve(directory, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!file.startsWith(directory + sep)) { response.writeHead(403).end(); return; }
      const body = await readFile(file);
      response.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css" })[extname(file)] ?? "application/octet-stream");
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  browser ??= await chromium.launch();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const widget = page.locator('[data-widget-id="one"]');
    await expect(widget).toBeVisible();
    await expect(page.locator("[data-value]")).toHaveText("42");
    await expect.poll(() => widget.evaluate(element => Boolean(element.gridstackNode))).toBe(true);
    await page.getByRole("button", { name: "Resize One", exact: true }).click();
    await expect(widget).toHaveAttribute("data-layout-w", "8");
    await expect(widget).toHaveAttribute("data-layout-h", "4");
    await page.getByRole("button", { name: "One 복원", exact: true }).click();
    await expect(widget).toHaveAttribute("data-layout-w", "6");
    await page.getByRole("button", { name: "One 최대화", exact: true }).click();
    await expect(widget).toHaveAttribute("data-maximized", "true");
    await expect(widget).toHaveAttribute("data-layout-w", "12");
    await page.getByRole("button", { name: "One 복원", exact: true }).click();
    await expect(widget).toHaveAttribute("data-layout-w", "6");
    await page.getByRole("button", { name: "One 최소화", exact: true }).click();
    await expect(widget).toHaveAttribute("data-minimized", "true");
    await page.getByRole("button", { name: "One 삭제", exact: true }).click();
    await expect(widget).toHaveCount(0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); await new Promise(resolve => server.close(resolve)); }
}

try {
  let tarball;
  if (process.argv[2]) { tarball = resolve(repository, process.argv[2]); assert.match(tarball, /\.tgz$/); await access(tarball); }
  else {
    npm(["run", "build"]);
    const packed = JSON.parse(npm(["pack", "--json", "--ignore-scripts", "--pack-destination", temporary]));
    tarball = join(temporary, packed[0].filename);
  }
  report.tarball = { sha256: createHash("sha256").update(await readFile(tarball)).digest("hex"), filename: tarball.split(sep).at(-1) };
  await mkdir(join(repository, "reports/artifacts/consumer"), { recursive: true });
  const retainedTarball = join(repository, "reports/artifacts/consumer", report.tarball.filename);
  if (tarball !== retainedTarball) await cp(tarball, retainedTarball);
  const versions = [
    { name: "core", framework: "core", packages: [] },
    { name: "react18", framework: "react", packages: ["react@18.3.1", "react-dom@18.3.1", pin("@types/react", "18.3.31"), pin("@types/react-dom", "18.3.7")] },
    { name: "react19", framework: "react", packages: ["react@19.3.0", "react-dom@19.3.0", pin("@types/react", "19.2.18"), pin("@types/react-dom", "19.2.7")] },
    { name: "vue-min", framework: "vue", packages: ["vue@3.5.0", "vue-tsc@3.3.13", pin("@vitejs/plugin-vue", "6.0.10")] },
    { name: "vue-latest", framework: "vue", packages: ["vue@3.5.43", "vue-tsc@3.3.13", pin("@vitejs/plugin-vue", "6.0.10")] },
  ];
  for (const consumer of versions) {
    const root = join(temporary, consumer.name);
    await mkdir(root);
    await json(join(root, "package.json"), { name: "comins-consumer-" + consumer.name, private: true, type: "module" });
    const packages = [tarball, "typescript@6.0.3", ...consumer.packages];
    if (consumer.framework !== "core") packages.push("vite@8.2.2", pin("@types/node", "26.4.1"));
    console.log("Consumer install:", consumer.name);
    npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-package-lock", ...packages], root);
    verifyConsumerIsolation(root, consumer.framework);
    const entryRoot = join(root, "node_modules/comins-grid-layout");
    const graphs = verifyFrameworkBoundary(entryRoot);
    await cp(join(repository, "test/consumer", consumer.framework), root, { recursive: true });
    const compilerOptions = { strict: true, skipLibCheck: false, target: "ES2022", module: "ESNext", moduleResolution: "Bundler", types: consumer.framework === "core" ? [] : ["vite/client"], lib: consumer.framework === "core" ? ["ES2022"] : ["ES2022", "DOM", "DOM.Iterable"], jsx: consumer.framework === "react" ? "react-jsx" : "preserve", outDir: "compiled", noEmit: consumer.framework !== "core" };
    await json(join(root, "tsconfig.json"), { compilerOptions, include: ["main.ts", "main.tsx", "App.vue"], exclude: ["negative.vue"] });
    const typechecker = consumer.framework === "vue" ? "vue-tsc/bin/vue-tsc.js" : "typescript/bin/tsc";
    run(process.execPath, [join(root, "node_modules", typechecker), "-p", "tsconfig.json"], root);
    if (consumer.framework === "core") {
      run(process.execPath, ["compiled/main.js"], root);
      // Separate directory with no node_modules or framework/engine fallback.
      const sandbox = join(temporary, "pure-core");
      await mkdir(sandbox);
      await cp(join(entryRoot, "dist"), join(sandbox, "dist"), { recursive: true });
      await json(join(sandbox, "package.json"), { type: "module" });
      run(process.execPath, ["--input-type=module", "-e", `const core = await import(${JSON.stringify(pathToFileURL(join(sandbox, "dist/core.js")).href)}); if (core.createDashboardLayoutState({columns: 6, widgets: []}).columns !== 6) throw new Error('Core runtime failed');`], sandbox);
    } else {
      await writeFile(join(root, "index.html"), `<html><head><link rel="icon" href="data:,"></head><body><div id="app"></div><script type="module" src="/main.${consumer.framework === "react" ? "tsx" : "ts"}"></script></body></html>`);
      await writeFile(join(root, "vite.config.mjs"), consumer.framework === "vue" ? "import vue from '@vitejs/plugin-vue'; export default { plugins: [vue()] };" : "export default {};");
      if (consumer.framework === "vue") {
        await json(join(root, "tsconfig.negative.json"), { compilerOptions, include: ["negative.vue"] });
        const negative = spawnSync(process.execPath, [join(root, "node_modules", typechecker), "-p", "tsconfig.negative.json"], { cwd: root, env, encoding: "utf8" });
        assert.notEqual(negative.status, 0, "Invalid Vue props/slots/events unexpectedly compiled");
        for (const pattern of [/toUpperCase/, /missingField/, /DashboardColumnCount/, /\(_id: number\)/]) assert.match(negative.stdout, pattern);
      }
      run(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), "build"], root);
      await browserCheck(root);
    }
    const exactVersions = {};
    for (const name of ["comins-grid-layout", "gridstack", "typescript", ...consumer.packages.map(value => value.slice(0, value.lastIndexOf("@")))]) exactVersions[name] = await installed(root, name);
    report.consumers.push({ name: consumer.name, versions: exactVersions, graphs, types: "pass", negativeTypes: consumer.framework === "vue" ? "pass" : "not-applicable", build: consumer.framework === "core" ? "TypeScript" : "Vite production", runtime: consumer.framework === "core" ? "isolated Node" : "Chromium mount/resize/legacy-maximize/restore/legacy-minimize/remove", status: "pass" });
    console.log("Consumer passed:", consumer.name, JSON.stringify(exactVersions));
  }
} finally {
  await browser?.close();
  await mkdir(join(repository, "reports/artifacts/consumer"), { recursive: true });
  await json(join(repository, "reports/artifacts/consumer/result.json"), report);
  await rm(temporary, { recursive: true, force: true });
}

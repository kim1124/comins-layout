import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const FAILURE = "third-party-notice-check: failed\n";
const RELATIONSHIPS = new Set(["external runtime dependency", "peer dependency"]);

function normalizeRepository(repository) {
  const raw = typeof repository === "string" ? repository : repository?.url;
  if (typeof raw !== "string") {
    throw new Error("repository missing");
  }

  return raw
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function parseNoticeTable(content) {
  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[0] !== "Package" && !cells.every((cell) => /^-+$/.test(cell)));

  if (rows.length === 0 || rows.some((cells) => cells.length !== 5)) {
    throw new Error("notice table invalid");
  }

  return rows.map(([name, relationship, spdx, source, license]) => ({
    name,
    relationship,
    spdx,
    source,
    license,
  }));
}

function hasLicenseFile(packageRoot) {
  return readdirSync(packageRoot).some((entry) => /^licen[cs]e(?:\.[a-z0-9]+)?$/i.test(entry));
}

function requireHttpsLicenseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/\/licen[cs]e(?:\.[a-z0-9]+)?$/i.test(url.pathname)) {
    throw new Error("license url invalid");
  }
}

try {
  const root = process.cwd();
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const runtimeDependencies = Object.keys(packageJson.dependencies ?? {});
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});
  const expected = new Map();

  runtimeDependencies.forEach((name) => expected.set(name, "external runtime dependency"));
  peerDependencies.forEach((name) => {
    if (expected.has(name)) {
      throw new Error("dependency scope overlap");
    }
    expected.set(name, "peer dependency");
  });

  if (expected.size === 0) {
    throw new Error("dependencies missing");
  }

  const rows = parseNoticeTable(readFileSync(join(root, "THIRD_PARTY_NOTICES.md"), "utf8"));
  if (rows.length !== expected.size || new Set(rows.map((row) => row.name)).size !== rows.length) {
    throw new Error("notice dependency set mismatch");
  }

  const boundaryUrl = pathToFileURL(join(root, "package-boundary.mjs")).href;
  const boundary = await import(boundaryUrl);
  if (!Array.isArray(boundary.externalPackages) || boundary.externalPackages.some((name) => typeof name !== "string")) {
    throw new Error("package boundary invalid");
  }
  const externalPackages = new Set(boundary.externalPackages);

  for (const row of rows) {
    if (!expected.has(row.name) || expected.get(row.name) !== row.relationship || !RELATIONSHIPS.has(row.relationship)) {
      throw new Error("notice relationship mismatch");
    }
    if (!externalPackages.has(row.name)) {
      throw new Error("external dependency missing");
    }

    const packageRoot = join(root, "node_modules", row.name);
    const installed = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
    if (installed.name !== row.name || typeof installed.license !== "string" || installed.license !== row.spdx) {
      throw new Error("installed license mismatch");
    }
    if (!hasLicenseFile(packageRoot)) {
      throw new Error("installed license missing");
    }
    if (normalizeRepository(installed.repository) !== row.source) {
      throw new Error("repository mismatch");
    }
    requireHttpsLicenseUrl(row.license);
  }

  for (const name of expected.keys()) {
    if (!externalPackages.has(name)) {
      throw new Error("package boundary mismatch");
    }
  }
} catch {
  process.stderr.write(FAILURE);
  process.exitCode = 1;
}

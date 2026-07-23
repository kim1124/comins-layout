import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const checker = join(root, "scripts", "check-third-party-notices.mjs");
const failure = "third-party-notice-check: failed\n";

const notice = `# Third-Party Notices

| Package | Relationship | SPDX | Source | License |
| --- | --- | --- | --- | --- |
| gridstack | external runtime dependency | MIT | https://github.com/gridstack/gridstack.js | https://github.com/gridstack/gridstack.js/blob/master/LICENSE |
| react | peer dependency | MIT | https://github.com/facebook/react | https://github.com/facebook/react/blob/main/LICENSE |
`;

function writeInstalledPackage(cwd, name, license = "MIT", includeLicense = true) {
  const packageRoot = join(cwd, "node_modules", name);
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(join(packageRoot, "package.json"), JSON.stringify({
    name,
    version: "1.0.0",
    license,
    repository: {
      type: "git",
      url: name === "gridstack"
        ? "git+https://github.com/gridstack/gridstack.js.git"
        : "https://github.com/facebook/react.git",
    },
  }));
  if (includeLicense) {
    writeFileSync(join(packageRoot, "LICENSE"), `${license}\n`);
  }
}

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), "comins-grid-license-"));
  writeFileSync(join(cwd, "package.json"), JSON.stringify({
    name: "comins-license-fixture",
    version: "1.0.0",
    dependencies: { gridstack: "^13.0.0" },
    peerDependencies: { react: ">=18" },
  }));
  writeFileSync(join(cwd, "package-boundary.mjs"), "export const externalPackages = ['gridstack', 'react'];\n");
  writeFileSync(join(cwd, "THIRD_PARTY_NOTICES.md"), notice);
  writeInstalledPackage(cwd, "gridstack");
  writeInstalledPackage(cwd, "react");
  return cwd;
}

function run(cwd) {
  return spawnSync(process.execPath, [checker], { cwd, encoding: "utf8" });
}

function constantFailure(result) {
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, failure);
}

test("accepts complete direct dependency notices and package boundaries", () => {
  const cwd = fixture();
  try {
    const result = run(cwd);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("rejects an unregistered direct runtime dependency without disclosing its name", () => {
  const cwd = fixture();
  try {
    const packageJson = JSON.parse(JSON.stringify({
      name: "comins-license-fixture",
      version: "1.0.0",
      dependencies: { gridstack: "^13.0.0", "runtime-extra": "1.0.0" },
      peerDependencies: { react: ">=18" },
    }));
    writeFileSync(join(cwd, "package.json"), JSON.stringify(packageJson));
    writeInstalledPackage(cwd, "runtime-extra");
    constantFailure(run(cwd));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("rejects an SPDX mismatch without disclosing the detected value", () => {
  const cwd = fixture();
  try {
    writeInstalledPackage(cwd, "gridstack", "ISC");
    constantFailure(run(cwd));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("rejects a dependency without its upstream license file", () => {
  const cwd = fixture();
  try {
    rmSync(join(cwd, "node_modules", "gridstack", "LICENSE"));
    constantFailure(run(cwd));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("rejects a runtime dependency omitted from the external package boundary", () => {
  const cwd = fixture();
  try {
    writeFileSync(join(cwd, "package-boundary.mjs"), "export const externalPackages = ['react'];\n");
    constantFailure(run(cwd));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

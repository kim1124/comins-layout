import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(scriptsRoot);
const temporaryRoot = await mkdtemp(join(tmpdir(), "comins-grid-layout-consumer-"));
const npmEnvironment = {
  ...process.env,
  npm_config_cache: join(temporaryRoot, "npm-cache"),
  npm_config_logs_dir: join(temporaryRoot, "npm-logs"),
};

await mkdir(npmEnvironment.npm_config_cache, { recursive: true });
await mkdir(npmEnvironment.npm_config_logs_dir, { recursive: true });

function runNpm(args, options = {}) {
  return execFileSync("npm", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: npmEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

try {
  runNpm(["run", "build"]);
  const packed = JSON.parse(runNpm(["pack", "--json", "--pack-destination", temporaryRoot]));
  const tarballName = packed[0]?.filename;
  assert.equal(typeof tarballName, "string", "npm pack did not return a tarball filename");

  const consumerRoot = join(temporaryRoot, "consumer");
  await mkdir(consumerRoot);
  await writeFile(
    join(consumerRoot, "package.json"),
    JSON.stringify({ name: "comins-grid-layout-consumer-smoke", private: true, type: "module" }),
  );

  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-package-lock", join(temporaryRoot, tarballName), "react@18", "react-dom@18"],
    { cwd: consumerRoot, env: npmEnvironment, stdio: "inherit" },
  );

  const smokePath = join(consumerRoot, "smoke.mjs");
  await writeFile(
    smokePath,
    `import assert from "node:assert/strict";
import * as packageEntry from "comins-grid-layout";

assert.ok(Object.keys(packageEntry).length > 0);
assert.match(import.meta.resolve("comins-grid-layout/styles.css"), /^file:/);
process.stdout.write("Consumer package smoke check passed.\\n");
`,
  );
  execFileSync(process.execPath, [smokePath], {
    cwd: consumerRoot,
    env: npmEnvironment,
    stdio: "inherit",
  });
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}

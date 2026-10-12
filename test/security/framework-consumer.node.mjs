import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { verifyFrameworkBoundary, verifyConsumerIsolation } from "../../scripts/verify-framework-boundary.mjs";
const repository = fileURLToPath(new URL("../..", import.meta.url));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "comins-framework-boundary-"));
  const put = (file, content) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), content); };
  const manifest = { type: "module", exports: {}, dependencies: { gridstack: "^13.2.0" } };
  for (const [entry, framework] of [["index", "react"], ["react", "react"], ["vue", "vue"], ["core", null]]) {
    manifest.exports[entry === "index" ? "." : "./" + entry] = { import: `./dist/${entry}.js`, types: `./dist/${entry}.d.ts` };
    put(`dist/${entry}.js`, framework ? `import '${framework}'; export {};` : "export const n = 1;");
    put(`dist/${entry}.d.ts`, entry === "vue" ? "export { default as Grid } from './vue/Grid.vue';" : "export declare const n: number;");
  }
  put("dist/vue/Grid.vue.d.ts", "declare const Grid: unknown; export default Grid;");
  put("package.json", JSON.stringify(manifest));
  put("THIRD_PARTY_LICENSES/lucide.txt", readFileSync(join(repository, "THIRD_PARTY_LICENSES/lucide.txt")));
  return { root, put, manifest, clean: () => rmSync(root, { recursive: true, force: true }) };
}
test("accepts separate complete framework graphs", () => { const f = fixture(); try { assert.ok(verifyFrameworkBoundary(f.root)); } finally { f.clean(); } });
for (const [name, file, content] of [
  ["Vue runtime cannot transitively load React", "dist/vue.js", "import './shared.js';"],
  ["Vue declarations cannot load React", "dist/vue.d.ts", "import type { ReactNode } from 'react'; export type X = ReactNode;"],
  ["Core cannot expose upstream engine types", "dist/core.d.ts", "export type { GridStackOptions } from 'gridstack';"],
  ["Core cannot expose DOM globals", "dist/core.d.ts", "export declare const element: HTMLElement;"],
  ["computed imports fail closed", "dist/vue.js", "export const load = name => import(name);"],
]) test(name, () => { const f = fixture(); try { f.put(file, content); f.put("dist/shared.js", "import 'react';"); assert.throws(() => verifyFrameworkBoundary(f.root)); } finally { f.clean(); } });
test("missing SFC declarations fail", () => { const f = fixture(); try { rmSync(join(f.root, "dist/vue/Grid.vue.d.ts")); assert.throws(() => verifyFrameworkBoundary(f.root)); } finally { f.clean(); } });
test("copied icon license must exist and remain intact", () => { const f = fixture(); try { f.put("THIRD_PARTY_LICENSES/lucide.txt", "MIT"); assert.throws(() => verifyFrameworkBoundary(f.root)); } finally { f.clean(); } });
test("frameworks must not be package runtime dependencies", () => { const f = fixture(); try { f.manifest.dependencies.react = "*"; f.put("package.json", JSON.stringify(f.manifest)); assert.throws(() => verifyFrameworkBoundary(f.root)); } finally { f.clean(); } });
test("Vue consumer rejects installed React even through a transitive dependency", () => { const f = fixture(); try { f.put("node_modules/react/package.json", "{}"); assert.throws(() => verifyConsumerIsolation(f.root, "vue")); } finally { f.clean(); } });
test("React consumer rejects Vue and Core rejects frameworks", () => { const f = fixture(); try { f.put("node_modules/vue/package.json", "{}"); assert.throws(() => verifyConsumerIsolation(f.root, "react")); assert.throws(() => verifyConsumerIsolation(f.root, "core")); } finally { f.clean(); } });

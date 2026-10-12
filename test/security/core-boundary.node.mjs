import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkCoreBoundary, checkBrowserBoundary } from "../../scripts/check-core-boundary.mjs";

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), "comins-core-boundary-"));
  const put = (file, text) => {
    mkdirSync(join(root, file, ".."), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  try { run(root, put); } finally { rmSync(root, { recursive: true, force: true }); }
}

test("accepts neutral transitive source and declarations", () => fixture((root, put) => {
  put("src/core.ts", 'export type { Value } from "./core/value"; export const version = 1;');
  put("src/core/value.ts", "export type Value = { count: number };");
  assert.equal(checkCoreBoundary({ root }).files, 2);
  put("dist/core.d.ts", "export declare const value: number;");
  put("dist/core.js", 'export { value } from "./shared.js";');
  put("dist/shared.js", "export const value = 1;");
  assert.equal(checkCoreBoundary({ root, artifact: true }).files, 3);
}));

for (const [name, content] of [
  ["React type", 'export type { ReactNode as Value } from "react";'],
  ["GridStack type", 'export type { GridStack as Value } from "gridstack";'],
  ["DOM global", "export type Value = HTMLElement;"],
  ["timer", "export const Value = setTimeout(() => {}, 1);"],
  ["Browser reexport", 'export { Value } from "../browser/value";'],
  ["dynamic import", 'export const Value = () => import("vue");'],
  ["computed import", 'export const Value = (name: string) => import(name);'],
]) {
  test("rejects transitive " + name, () => fixture((root, put) => {
    put("src/core.ts", 'export * from "./core/value";');
    put("src/core/value.ts", content);
    put("src/browser/value.ts", "export const Value = 1;");
    assert.throws(() => checkCoreBoundary({ root }));
  }));
}

test("rejects artifact type-only and runtime leaks", () => fixture((root, put) => {
  put("dist/core.js", "export const value = 1;");
  put("dist/core.d.ts", 'export type { Node } from "./shared";');
  put("dist/shared.d.ts", 'export type { GridStack as Node } from "gridstack";');
  assert.throws(() => checkCoreBoundary({ root, artifact: true }));
  put("dist/core.d.ts", "export declare const value: number;");
  put("dist/core.js", 'export { value } from "./shared.js";');
  put("dist/shared.js", 'export { ref as value } from "vue";');
  assert.throws(() => checkCoreBoundary({ root, artifact: true }));
}));

test("Browser rejects transitive framework types while allowing neutral DOM code", () => fixture((root, put) => {
  put("src/browser/connection.ts", 'export type { Value } from "../core/value"; export const ready = (el: HTMLElement) => el.isConnected;');
  put("src/core/value.ts", "export type Value = number;");
  assert.equal(checkBrowserBoundary({ root, entries: ["src/browser/connection.ts"] }).files, 2);
  put("src/core/value.ts", 'export type { Ref as Value } from "vue";');
  assert.throws(() => checkBrowserBoundary({ root, entries: ["src/browser/connection.ts"] }));
}));

for (const content of ['const Vue = require("vue");', 'import Vue = require("vue");', '/// <reference types="react" />\nexport {};']) {
  test("Browser rejects alternate framework import syntax: " + content, () => fixture((root, put) => {
    put("src/browser/connection.ts", content);
    assert.throws(() => checkBrowserBoundary({ root, entries: ["src/browser/connection.ts"] }));
  }));
}

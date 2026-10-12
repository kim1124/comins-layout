import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function classifyChangedPaths(paths) {
  const scope = { policy: false, docs: false, fast: false, browser: false, cross_browser: false, resource: false };
  for (const path of paths) {
    if (!path) continue;
    if (/(^|\/)AGENTS\.md$/.test(path) || /^(\.codex\/|SECURITY\.md$|\.gitleaks\.toml$|\.githooks\/|\.github\/workflows\/|scripts\/check-public-identities\.mjs$|test\/security\/)/.test(path)) scope.policy = true;
    if (/^(README\.md$|docs\/|test\/playwright\/(?:specs\/)?README\.md$)/.test(path)) scope.docs = true;
    if (!/(^|\/)AGENTS\.md$/.test(path) && !/^(\.codex\/|\.github\/workflows\/|README\.md$|CHANGELOG\.md$|SECURITY\.md$|docs\/|reports\/|test\/playwright\/(?:specs\/)?README\.md$)/.test(path)) scope.fast = true;
    if (/^(src\/(?:components|gridstack)\/|example\/|test\/playwright\/[^/]+\.ts$|test\/playwright\/specs\/.*\.spec\.ts$|playwright\.config\.ts$|vite\.example\.config\.ts$|package(?:-lock)?\.json$)/.test(path)) scope.browser = scope.cross_browser = true;
    if (/^(src\/components\/DashboardGrid\.tsx$|src\/gridstack\/|test\/playwright\/(?:resource-stability|resource-probe|framework-fixtures)\.ts$|test\/playwright\/specs\/(?:dashboard-grid|framework-parity)\.spec\.ts$|playwright\.config\.ts$|package(?:-lock)?\.json$)/.test(path)) scope.resource = true;
    if (/^(src\/(?:core(?:\.ts$|\/)|browser\/|react(?:\.ts$|\/)|vue(?:\.ts$|\/)|ui\/|index\.ts$)|vite(?:\.example)?\.config\.ts$|tsconfig[^/]*\.json$|package-boundary\.mjs$|scripts\/classify-change-scope\.mjs$)/.test(path)) {
      scope.fast = scope.browser = scope.cross_browser = scope.resource = true;
    }
  }
  return scope;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = classifyChangedPaths(readFileSync(0, "utf8").split(/\r?\n/));
  for (const [name, value] of Object.entries(result)) console.log(`${name}=${value}`);
}

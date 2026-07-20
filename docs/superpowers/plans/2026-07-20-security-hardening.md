# Repository and Release Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Minimize GitHub Actions publication authority, harden widget-ID DOM lookup, and add repository update and secret-file guardrails without publishing or writing to the remote repository.

**Architecture:** Build and verify the npm tarball in an unprivileged job, then pass the immutable artifact to a minimal environment-gated OIDC stage job. Escape widget IDs at the GridStack adapter boundary and keep all update automation review-only.

**Tech Stack:** GitHub Actions, npm 11 staged publishing, Node.js 24, TypeScript 6, GridStack 12, Vitest 4, Playwright 1.61.

## Global Constraints

- Keep React and React DOM as peer dependencies and add no package dependency.
- Keep GridStack access inside `src/gridstack`.
- Preserve widget IDs and public APIs.
- Do not push, open a PR, stage an npm package, publish, or change remote settings.
- Run `npm run verify:full` because adapter lookup affects browser-visible GridStack behavior.
- Record configuration, security, release, behavior, and test-contract changes in `reports/2026-07-20.md`.

---

### Task 1: Escape Widget IDs at the Adapter Boundary

**Files:**
- Create: `test/vitest/adapter.test.ts`
- Modify: `src/gridstack/adapter.ts`

**Interfaces:**
- Consumes: `CSS.escape(value: string): string` and `HTMLElement.querySelector()`.
- Produces: package-internal `findWidgetElementById(element: HTMLElement, widgetId: string): HTMLElement | null`.

- [x] **Step 1: Write the failing selector regression test**

```ts
const id = 'sales\"] .grid-stack-item';
const escapedId = 'sales\\\"\\]\\ \\.grid-stack-item';
vi.stubGlobal("CSS", { escape: vi.fn(() => escapedId) });
expect(findWidgetElementById(element, id)).toBe(item);
expect(element.querySelector).toHaveBeenCalledWith(`[data-widget-id="${escapedId}"]`);
```

- [x] **Step 2: Run the focused test and confirm RED**

Run: `npm run test:run -- test/vitest/adapter.test.ts`

Expected: FAIL because `findWidgetElementById` is not exported by `src/gridstack/adapter.ts`.

- [x] **Step 3: Add the minimal helper and route sync through it**

```ts
export function findWidgetElementById(element: HTMLElement, widgetId: string) {
  return element.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(widgetId)}"]`);
}
```

- [x] **Step 4: Run the focused test and confirm GREEN**

Run: `npm run test:run -- test/vitest/adapter.test.ts`

Expected: the new test passes with no warning or error.

### Task 2: Split and Pin GitHub Actions Workflows

**Files:**
- Modify: `.github/workflows/verify.yml`
- Modify: `.github/workflows/publish.yml`

**Interfaces:**
- Consumes: manual `version` input, GitHub artifact storage, `npm` environment, GitHub OIDC.
- Produces: an unprivileged `verify-and-pack` job and a minimal `stage` job that accepts one `.tgz` artifact.

- [x] **Step 1: Pin official actions and disable checkout credential persistence**

Use the verified full SHAs for `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-artifact@v4`, and `actions/download-artifact@v4`, with readable major-version comments.

- [x] **Step 2: Move all source verification to `verify-and-pack`**

Keep exact-version validation, existing-package validation, `npm ci`, Playwright install, `verify:full`, `test:consumer`, and pack inspection in a job with only `contents: read`.

- [x] **Step 3: Upload the actual package tarball**

Run `npm pack --json`, expose the single generated filename through `$GITHUB_OUTPUT`, and upload only that file with `if-no-files-found: error` and one-day retention.

- [x] **Step 4: Minimize the environment-gated stage job**

Make `stage` depend on `verify-and-pack`, give only this job `id-token: write`, do not check out source, download the package artifact, and run `npm stage publish ./*.tgz --access public`.

### Task 3: Add Repository Guardrails and Correct Release Documentation

**Files:**
- Create: `.github/dependabot.yml`
- Modify: `.gitignore`
- Modify: `CHANGELOG.md`
- Modify: `SECURITY.md`

**Interfaces:**
- Consumes: Dependabot npm and GitHub Actions ecosystems.
- Produces: review-only weekly update PRs, local secret-file exclusions, accurate `0.1.2` notes, and an explicit supported-version table.

- [x] **Step 1: Add weekly grouped Dependabot update definitions**

Configure npm production/development minor and patch groups, plus one GitHub Actions group. Do not configure auto-merge.

- [x] **Step 2: Add local secret-file ignore patterns**

Ignore `.env`, `.env.*`, `.npmrc`, `*.pem`, `*.key`, `*.p12`, and `*.pfx`, while allowing `.env.example` and `.npmrc.example`.

- [x] **Step 3: Correct the release and support statements**

Describe `0.1.2` as prepared rather than republished, record selector/workflow hardening, state that no public API changed, and support the current `0.1.x` line.

### Task 4: Verify and Report

**Files:**
- Create: `reports/2026-07-20.md`

**Interfaces:**
- Consumes: outputs from all verification and inspection commands.
- Produces: exact pass/fail evidence and residual remote or historical risks.

- [x] **Step 1: Parse workflow and Dependabot YAML**

Run Ruby Psych safe parsing for `.github/workflows/*.yml` and `.github/dependabot.yml`.

- [x] **Step 2: Run package gates**

Run `npm run verify:full`, `npm run test:consumer`, `npm pack --dry-run --json`, `npm audit --json`, and `npm audit --omit=dev --json`.

- [x] **Step 3: Run privacy and secret scans**

Scan tracked files and the dry-run package file list for private-key markers, common provider tokens, identifying home paths, and non-placeholder emails without printing discovered secret values.

- [x] **Step 4: Record evidence and inspect the final diff**

Update `reports/2026-07-20.md`, then run `git diff --check`, inspect `git diff --stat`, inspect the complete diff, and record unexecuted remote steps as residual risks.

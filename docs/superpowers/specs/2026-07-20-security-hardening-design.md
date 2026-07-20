# Repository and Release Security Hardening Design

## Purpose

`comins-grid-layout`의 GitHub Actions와 npm staged publishing 경계를 최소 권한으로 분리하고, consumer-controlled widget ID가 DOM selector 문법을 깨뜨리지 않도록 한다. 변경은 로컬 브랜치에서 검증하며 push, PR 생성, npm stage 또는 publish는 별도 승인 전까지 수행하지 않는다.

## Confirmed Decisions

- `main` 변경은 기존 ruleset의 PR 및 `verify` required check를 통과해야 한다.
- package install, test, build, consumer smoke test, pack은 OIDC 권한이 없는 job에서 실행한다.
- GitHub `npm` environment와 `id-token: write`는 검증된 package tarball을 npm staging에 제출하는 job에만 부여한다.
- npm trusted publisher는 `publish.yml`, `npm` environment, stage-only 권한을 계속 사용한다.
- GitHub Actions는 공식 action tag가 가리키는 full commit SHA로 고정하고 사람이 읽을 수 있는 major tag를 주석으로 남긴다.
- widget ID는 serializable string 계약을 유지하되 DOM attribute selector에 넣기 전에 `CSS.escape()`로 escape한다.
- Dependabot은 npm과 GitHub Actions update PR을 생성하지만 자동 merge 또는 release는 수행하지 않는다.

## Workflow Architecture

```text
manual workflow_dispatch on main
  -> verify-and-pack (contents: read)
       -> checkout without persisted credentials
       -> exact version and existing package checks
       -> immutable install, full tests, consumer smoke test
       -> dry-run inspection and package tarball
       -> immutable workflow artifact
  -> GitHub npm environment approval
  -> stage (contents: read, id-token: write)
       -> download verified package artifact
       -> npm stage publish <tarball>
  -> npm staged package inspection
  -> maintainer 2FA approval outside GitHub Actions
```

The `stage` job does not check out source or install project dependencies. It receives only the immutable artifact produced by the successful verification job. Public publication remains impossible until a maintainer separately approves the npm stage with 2FA.

## Runtime Selector Hardening

`syncGridWidgets()` currently interpolates `widget.id` directly into a CSS attribute selector. A quote, bracket, backslash, or other selector-significant character can make `querySelector()` throw or select the wrong node. A package-internal helper will create the selector with `CSS.escape(widgetId)`, and `syncGridWidgets()` will use that helper.

The regression test stubs the browser `CSS.escape()` boundary, passes a selector-significant ID, and verifies that only the escaped selector reaches `querySelector()`. The helper remains internal because `src/index.ts` will not re-export it.

## Repository Hygiene

- `.gitignore` excludes local environment files, npm credentials, and common private-key containers while allowing documented example files.
- `.github/dependabot.yml` creates weekly grouped update PRs for npm dependencies and GitHub Actions.
- `CHANGELOG.md` describes `0.1.2` as prepared, not already republished, and records the runtime and workflow hardening.
- `SECURITY.md` explicitly supports the current `0.1.x` line instead of leaving the support window undefined.

## Verification

- Observe the selector regression test fail before changing `src/gridstack/adapter.ts`, then pass after the minimal implementation.
- Parse all workflow and Dependabot YAML files.
- Run `npm run verify:full`, `npm run test:consumer`, and `npm pack --dry-run --json`.
- Run `npm audit` for all and production dependencies.
- Inspect the package file list and scan tracked/package content for private keys, common provider tokens, personal home paths, and non-placeholder email addresses.
- Run `git diff --check` and review the complete diff.

## Residual Boundaries

- Account 2FA, CodeQL, repository action policy, npm profile, trusted publisher, and staged-package approval are remote settings and are not changed by this local patch.
- Old Git objects and already-published npm metadata require separate support or destructive remediation and are outside this change.
- Full-SHA enforcement at repository level should be enabled only after this pinned workflow reaches `main`.

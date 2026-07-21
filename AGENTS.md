# comins-grid-layout Agent Map

## Repository Ownership

- SCOPE: `comins-grid-layout` package, `src`, `src/core`, `src/gridstack`, `src/components`, `example`, `test`, `GUIDE.md`.
- CONTEXT: 이 저장소는 package source, 문서, 테스트, 작업 보고, release 준비의 단일 기준이다.
- MUST: Comins Contract v1.2를 채택한다. policy, security, public API, release 작업 전에는 `comins-governance`의 `COMINS_CONTRACT.md`를 명시적으로 확인한다.
- MUST: `comins-grid-layout`, GitHub `kim1124/comins-layout`, `main`을 독립 package 운영 기준으로 사용한다.
- DO NOT: 다른 저장소의 workspace 명령, 소스 동기화, 변경 복제, 동시 릴리스를 별도 요청 없이 수행한다.
- DO NOT: `AGENTS.override.md`를 커밋한다. 로컬 임시 예외로만 사용한다.
- MUST: 하위 규칙은 `src/core/AGENTS.md`, `src/gridstack/AGENTS.md`, `src/components/AGENTS.md`, `test/AGENTS.md`, `example/AGENTS.md`를 따른다.
- MUST: Project documentation starts at `README.md`, `GUIDE.md`, and `docs/README.md`.

## Work Boundaries

- Review, diagnose, research, and plan requests are read-only unless implementation is explicitly requested.
- In-scope implementation may edit local files and run non-destructive verification.
- REQUIRE explicit request before push, publish, external writes, destructive commands, or material scope expansion.
- MUST: 모든 Comins 작업은 `gpt-5.6-sol`과 `xhigh` reasoning을 기본으로 사용한다.
- MUST: 취약점 조사, runtime memory leak·retention·out-of-memory, security 작업에는 `gpt-5.6-sol`과 최소 `xhigh`를 사용한다.
- MUST: 지침 계획, Plan mode, implementation plan 작성·갱신에는 `gpt-5.6-sol`과 최소 `max`를 사용한다.

## Sensitive Data

- Never track personal names, personal email addresses, local account paths, credentials, tokens, secrets, or value-derived fingerprints.
- Use only an approved public handle, GitHub noreply identity, service identity, explicit placeholder, or repository-relative path.
- Run the required Gitleaks hook, security CI, and exact package-artifact gate; redact scanner output and fail closed when a required gate is unavailable.
- Handle legacy history or provider metadata through a separate audit without enforcement baselines or finding suppressions.

## Product Goals

- MUST: Support create, read, update, move, resize, maximize, minimize, arrange, reset, and serialize widget flows.
- MUST: Support runtime column count `1..12`, movement/resize toggles, and scheduled resize signals for widget content.

## Implementation Rules

- DO NOT: introduce Next.js-only APIs.
- MUST: Keep React and React DOM as peer dependencies.
- MUST: Keep GridStack interaction behind a package-owned adapter boundary.
- MUST: Store layout state in serializable objects.
- MUST: Preserve widget IDs across all operations.
- MUST: Clamp runtime column count to `1..12`.
- MUST: Treat 100+ widgets and repeated column changes as baseline requirements.

## Verification Commands

- RUN: `npm run verify` for package baseline: sensitive-data gates, lint, Vitest, build.
- RUN: `npm run verify:full` for package full gate: baseline plus Playwright.
- MUST: Run `npm run verify:full` for GridStack lifecycle, drag, resize, column-cycle, or browser-visible behavior changes.

## Reporting

REPORT: behavior, public API, configuration, security, release, 또는 test-contract 변경 시 `reports/YYYY-MM-DD.md`에 timestamp, summary, changed files, commands actually run, pass/fail result, residual risks를 기록한다.

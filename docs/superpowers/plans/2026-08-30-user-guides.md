# comins-grid-layout 사용자 가이드 정합화 계획

- 작성일: 2026-08-30
- 기준 버전: `comins-grid-layout@0.2.1`
- 기준 브랜치: `codex-readme-feature-highlights`
- 기준 커밋: `cf53960cff99c3a931607ef25b23af0d6eb64ff8`

## 목표

Data Table에서 확정한 문서 운영 기준을 적용해 영문 `docs/user`와 국문 `docs/ko`를 동일한 파일 구조로 제공한다. README는 설치, 데모 실행, 기능 탐색을 담당하고 상세 사용법·상태 소유권·거부 조건·미지원 경계는 기능별 가이드가 담당한다.

## 범위

- 현재 `0.2.1` public API만 문서화한다.
- README의 데모 실행 위치를 유지하고 canonical Playground/API route를 사용한다.
- 영문 가이드를 primary, 국문 가이드를 동일 구조의 secondary 문서로 제공한다.
- npm tarball의 `files` 목록, package version, dependency, runtime `src/**`는 변경하지 않는다.
- README 전용 실제 UI fixture, GIF 생성 스크립트와 문서 계약 테스트는 재현 가능한 문서 자산으로 함께 유지한다.

## 가이드 목록

1. Quick Start
2. Controlled State and CRUD
3. Widget Interactions and Actions
4. Columns, Arrange, and Reset
5. Persistence
6. Responsive Layouts
7. External Drop Targets
8. Palette and Grid Transfer
9. Lazy Rendering
10. Events and Content Resize
11. Engine Options
12. Advanced GridStack Access
13. Styling, Accessibility, and Boundaries
14. Playground

## 공통 문서 계약

- 목적과 적용 시점
- public package import만 사용하는 최소 예제
- React controlled state의 write-back 위치
- 관련 props, commands, handle
- 실패·거부·미지원 조건
- canonical Playground route와 연관 가이드
- 신규 예제에서 `0.3.0` 제거 예정 alias 사용 금지

## 검증

```bash
npm run test:run -- test/vitest/readme.test.ts test/vitest/user-docs.test.ts
npm run verify
git diff --check
```

문서와 문서용 fixture만 변경하므로 전체 Playwright는 요구하지 않는다. README 전용 fixture 변경에 대한 기존 focused Chromium 31/31 증거를 유지하고, 가이드 작업에서 runtime 또는 routing 구현을 변경할 경우에만 affected E2E를 재실행한다.

## 완료 경계

- 버전 변경, push, PR, merge, tag, Release, npm publish는 수행하지 않는다.
- 로컬 커밋은 README, 영문·국문 가이드, GIF와 재현·검증 부속 파일을 한 문서 변경으로 묶는다.

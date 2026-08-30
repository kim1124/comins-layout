# README Current Feature Highlights And GIF Refresh Plan

**상태:** 사용자 범위 승인 완료, 로컬 구현 진행 중

**기준선:** `main`의 `cf53960cff99c3a931607ef25b23af0d6eb64ff8`, `comins-grid-layout@0.2.1`

**목표:** 공개 API와 런타임을 변경하지 않고 README 첫 화면과 기능 탐색을 현재 `0.2.1` 대표 기능에 맞춘다. 기존 CRUD 중심 단일 GIF를 제거하고 실제 public API로 동작하는 기능별 GIF 4개를 제공한다.

## 확정 결정

- `data-table`의 current-feature refresh와 같은 기능별 독립 GIF 구성을 사용한다.
- README 설치 명령 바로 아래에 `npm run dev`와 기본 로컬 URL을 포함한 데모 실행 방법을 추가한다.
- 대표 기능은 Multi-grid Transfer, External Drop Target, Responsive/Per-column Persistence, React Content Lazy Rendering으로 고정한다.
- 기존 `docs/assets/comins-grid-layout-demo.gif`는 README와 생성 계약에서 제거한다.
- 새 GIF는 실제 `DashboardGrid`, `useDashboardGrid`, `useDashboardDragIn`과 공개 helper만 사용한다.
- `src/`, package version, dependencies, exports, 일반 Playground 동작, release 상태는 변경하지 않는다.
- commit, push, PR, merge, publish는 이 로컬 구현 범위에 포함하지 않는다.

## README 정보 구조

1. 배지와 제품 설명
2. 현재 기능별 GIF 4개를 연결하는 `Feature highlights`
3. `Features`와 `Support`
4. `Installation`
5. 설치 명령 바로 아래의 `Run the demo`
6. `Quick start`
7. 기존 complete prop/command/handle inventory와 기능 계약
8. `Playground`, `Documentation`, `Current boundaries`, `Development`, `Verification and security`, `License`

루트 README의 complete public inventory는 이전 `0.2.1` drift gate를 유지한다. 세부 설명을 줄일 때도 모든 public prop, command, handle 이름과 deprecated 경계는 남긴다.

## GIF Storyboard

각 GIF는 960×720 이하, 12초 이하, 5MiB 이하, 무한 반복을 지킨다.

### Multi-grid Transfer

- Palette widget을 target Grid로 copy한다.
- source Grid widget을 target Grid로 move한다.
- 두 controlled state가 실제 callback 결과로 갱신되는 장면을 표시한다.

### External Drop Target

- Grid widget을 일반 HTML trash target으로 이동한다.
- `onWidgetExternalDrop` 이후 consumer-owned `removeWidget`이 실행되는 상태를 표시한다.
- target은 GridStack widget이나 package-owned wrapper로 모사하지 않는다.

### Responsive And Per-column Persistence

- 12-column과 6-column 상태를 전환한다.
- 각 column에서 다른 geometry를 만들고 재방문 시 저장된 geometry가 복원되는 장면을 표시한다.
- top-level controlled state와 `serializeState()` 계약을 사용한다.

### React Content Lazy Rendering

- `[data-dashboard-lazy-scroll]` 안의 eager widget과 아직 mount되지 않은 lazy widget을 구분한다.
- 실제 scroll 후 lazy content가 한 번 mount되고 이후 유지되는 상태를 표시한다.
- native `DashboardGridEngineOptions.lazyLoad`, skeleton, full virtualization을 현재 기능으로 표현하지 않는다.

## 변경 파일

- `README.md`
- `example/src/readme-demo.tsx`
- `example/src/styles.css`
- `scripts/capture-readme-demo.mjs`
- 필요 시 repository-owned GIF 검사 helper
- `docs/assets/comins-grid-layout-transfer.gif`
- `docs/assets/comins-grid-layout-external-drop.gif`
- `docs/assets/comins-grid-layout-responsive-persistence.gif`
- `docs/assets/comins-grid-layout-lazy-rendering.gif`
- `docs/assets/comins-grid-layout-demo.gif` 삭제
- `test/vitest/readme.test.ts`
- README demo focused Playwright spec

## 구현 및 검증 순서

1. README 구조, 4개 GIF 경로, 데모 실행 방법과 asset budget 계약을 테스트에 먼저 반영한다.
2. `/readme-demo?feature=<id>` 전용 fixture를 실제 controlled state로 구현한다.
3. 기능별 browser state와 상호작용을 focused Playwright로 검증한다.
4. capture script가 네 GIF를 임시 경로에 모두 생성·검증한 뒤에만 기존 자산을 교체하도록 만든다.
5. README 본문, 대체 텍스트, Playground 및 상세 문서 링크를 갱신한다.
6. 네 GIF의 시작·핵심·종료 장면을 육안 검토한다.
7. focused Vitest, focused Playwright, `npm run verify` 상당 gate와 `git diff --check`를 실행한다.

## 완료 기준

- 설치 명령 바로 아래에서 데모 실행 명령과 `http://127.0.0.1:6001/docs/getting-started`를 확인할 수 있다.
- README에서 네 대표 기능의 GIF, 핵심 계약, 실행 route를 바로 찾을 수 있다.
- GIF는 실제 public component interaction만 캡처하며 크기·시간·loop 계약을 통과한다.
- complete public API inventory, browser/support 경계, deprecation, persistence 설명이 유지된다.
- package/runtime/dependency/version 변경이 없다.
- affected tests와 baseline이 통과하고 생성 임시 파일과 server process가 남지 않는다.

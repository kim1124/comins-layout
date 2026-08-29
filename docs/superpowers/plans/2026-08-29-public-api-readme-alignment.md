# 0.2.1 Public API And README Alignment Plan

**상태:** `0.2.1` 로컬 구현 및 affected 검증 완료. push, PR, Release, publish는 수행하지 않음.

**구현 결과:** `/examples/internal/**` consumer route는 제거했다. 기존 복합 Playground component는 current route로 직접 이전하기 어려운 selector-significant ID, 100-widget resource, interaction-boundary 회귀를 위해 `/__test__/**` harness로만 유지했으며 public navigation과 문서에서는 노출하지 않는다. 상세 검증은 `reports/2026-08-29.md`에 기록한다.

**기준선:** 로컬 `main`의 `comins-grid-layout@0.2.0`. React controlled state가 source of truth이고 GridStack은 `src/gridstack` 어댑터 내부에 유지된다.

**목표 버전:** `comins-grid-layout@0.2.1`. 문서, 예제, type deprecation, 정합성 gate를 포함하는 patch release로 계획한다. 로컬 version metadata 변경은 구현 범위에 포함하되 tag, GitHub Release, npm publish는 별도 승인 범위다.

**목표:** 현재 구현된 공개 기능, 옵션, 이벤트, command, handle, Playground 예제를 하나의 소비자 계약으로 정리한다. 효과가 없거나 신규 계약과 중복되는 API는 `0.2.1`에서 즉시 삭제하지 않고 deprecated 처리한 뒤 다음 minor에서 제거한다.

## 확정 결정

- `0.2.1` 소비자 호환성을 유지한다. 이번 정합화에서 공개 prop, command, type, export의 런타임 제거는 하지 않는다.
- 효과가 없거나 중복된 API는 대체 API와 제거 목표 버전을 포함한 `@deprecated` JSDoc을 추가한다.
- 문서와 예제는 deprecated API가 아닌 canonical API만 사용한다. 기존 API는 별도 호환성 표에서만 설명한다.
- `package.json`과 root `package-lock.json` version은 `0.2.0`에서 `0.2.1`로 함께 변경한다. dependency resolution은 변경하지 않는다.
- 다음 minor인 `0.3.0`에서 deprecated API 제거를 검토한다. 실제 제거와 `0.3.0` version 변경은 별도 승인 범위다.
- `0.2.1`의 tag, GitHub Release, npm publish, push/PR은 이 계획의 로컬 구현 범위에 포함하지 않는다.
- `onLayoutCommit={dashboard.commands.applyLayoutSnapshot}`을 controlled layout 동기화의 기본 예제로 사용한다. `onWidgetLayoutChange`는 개별 geometry 저장이 의도된 경우에만 설명한다.
- 기존 `externalDropTargets`와 신규 incoming palette/Grid transfer는 서로 다른 계약으로 문서화한다.
- raw GridStack CRUD, native dynamic sub-grid, keyboard move/resize, Safari 인증은 현재 지원 범위로 확장하지 않는다.
- historical `reports/**`와 완료된 `docs/superpowers/**` 증적은 정합화 대상으로 다시 쓰지 않는다. 이 계획 문서와 active consumer 문서만 변경한다.

## 조사 결과와 처리 기준

### 1. 유지할 canonical 공개 계약

다음 항목은 현재 구현과 테스트가 일치하므로 제거 대상이 아니다.

- `DashboardGrid`, `useDashboardGrid`, serializable snapshots, per-column `layoutsByColumn`
- `onLayoutCommit`과 atomic `applyLayoutSnapshot`
- 의도적으로 개별 geometry를 전달하는 `onWidgetLayoutChange`
- `externalDropTargets`와 non-destructive `onWidgetExternalDrop`
- `useDashboardDragIn`, `gridId`, `acceptExternalWidgets`, `gridTransferMode`, `onWidgetDropRequest`
- `insertDashboardWidgetAtLayout`, `transferDashboardWidget`, `insertWidgetAt`
- `lazyRenderWidget`와 per-widget `DashboardWidget.lazyLoad` override
- `sizeToContent`, `resizeToContentParent`, responsive columns, runtime interaction flags
- safe handle query, `refresh`, `compact`, `commitLayout`
- `getGridStack()` backward-compatibility escape hatch

### 2. `0.2.1`에서 deprecated 처리할 항목

| 대상 | 확인된 문제 | canonical 대체 | `0.2.1` 처리 | 다음 minor 처리 |
| --- | --- | --- | --- | --- |
| `DashboardGridEngineOptions.lazyLoad` | GridStack native lazy rendering은 GridStack이 DOM/content를 생성할 때 동작한다. React가 먼저 widget content를 렌더링하는 현재 어댑터에서는 content 지연 효과가 없다. | `DashboardGrid.lazyRenderWidget`와 `DashboardWidget.lazyLoad` | mapping과 타입은 유지하되 deprecated JSDoc 추가, README/예제에서 제거 | 타입과 mapper 전달 제거 |
| `onWidgetDragStart` / `onWidgetDragStop` | `onBeforeMove` / `onAfterMove`와 동일 lifecycle을 다른 이름으로 중복 노출한다. | `onBeforeMove` / `onAfterMove` | callback 실행 순서를 보존하고 deprecated 표시 | props와 adapter plumbing 제거 |
| `onWidgetResizeStart` / `onWidgetResizeStop` | `onBeforeResize` / `onAfterResize`와 중복된다. | `onBeforeResize` / `onAfterResize` | deprecated 표시, 기존 실행 순서 보존 | props와 adapter plumbing 제거 |
| `onWidgetHeaderDoubleClick` | 실제 이벤트 영역은 header 전체가 아니라 title이며 `onTitleDoubleClick`과 중복된다. | `onTitleDoubleClick` | title-only semantics를 명시하고 deprecated 표시 | prop과 shell alias 제거 |
| `DashboardWidgetShellProps.onHeaderDoubleClick` | component alias도 같은 중복과 명칭 오류를 가진다. | `onTitleDoubleClick` | deprecated 표시 | prop 제거 |
| `DashboardGridOptionInput.cellHeight` / `margin` | 이미 deprecated이며 `engineOptions`와 중복된다. | `engineOptions.cellHeight` / `engineOptions.margin` | 제거 버전과 migration 문구 보강 | alias 제거 |
| `DashboardGridAdapterOptionOverrides`와 mapper의 두 번째 인자 | package adapter 내부 `acceptWidgets` bridge가 root public type으로 노출됐다. 일반 consumer 계약이 아니다. | `DashboardGrid.acceptExternalWidgets` | internal-use deprecation 표시, 기존 signature 보존 | root export와 public second argument 제거 또는 internal mapper 분리 |

### 3. 유지하되 설명을 바로잡을 항목

- `DashboardWidget.lazyLoad`는 단독으로 content를 지연하지 않는다. `lazyRenderWidget=true`일 때 widget별 opt-out/override로 동작한다고 명시한다.
- lazy observer root는 가장 가까운 `[data-dashboard-lazy-scroll]`이고, 없으면 viewport다. 한 번 렌더링된 content는 다시 unmount하지 않으며 `IntersectionObserver`가 없으면 eager rendering으로 전환한다.
- `renderWidgetActions`는 `showControls=true`일 때 기본 action group을 대체한다. `showControls=false`에서는 custom action도 렌더링하지 않는다.
- `insertWidgetAt`은 이미 검증된 single-grid target snapshot을 reducer에 적용하는 fire-and-forget command다. 거부 이유가 필요한 palette insertion에는 `insertDashboardWidgetAtLayout`, 두 Grid의 atomic 결과에는 `transferDashboardWidget`을 사용한다.
- `resetLayout(snapshot?)`과 `restoreLayout(snapshot)`은 reducer 진입점은 유사하지만 mutation semantic이 각각 `layout:reset`, `layout:restore`이므로 둘 다 유지한다.
- `getGridStack()`은 삭제 대상이 아니라 명시적인 escape hatch다. raw mutation 결과는 반드시 `commitLayout`과 controlled state 반영을 거쳐야 하며 raw CRUD/lifecycle ownership 이전은 지원하지 않는다.
- named `DashboardGrid` 조합으로 만든 controlled nested example은 지원한다. GridStack native `subGridDynamic`과 anonymous engine-owned nested mutation은 지원하지 않는다.

## 수정 범위

### Task 1. 공개 API inventory와 deprecation contract 고정

**변경 파일**

- `src/core/types.ts`
- `src/components/DashboardGrid.tsx`
- `src/components/DashboardWidget.tsx`
- `src/gridstack/option-mapper.ts`
- `src/index.ts`
- `CHANGELOG.md`

**작업**

1. 위 표의 항목에 replacement와 `0.3.0` 제거 목표를 포함한 `@deprecated` JSDoc을 추가한다.
2. `0.2.1` runtime mapping, callback 호출 순서, return type은 변경하지 않는다.
3. README에서 이미 사용하는 `DashboardWidgetActionLabels`를 root type export로 추가한다. 이는 additive change이며 기존 runtime에는 영향이 없다.
4. `src/index.ts`의 export를 component, state helper, advanced utility, internal-shaped candidate로 분류한 inventory fixture를 만든다.
5. `cominsGridLayoutPackage`, configuration validator, state helpers, scheduler, option mapper, `DashboardWidgetShell`은 이 작업에서 임의로 제거하지 않는다. 문서상 public/advanced/internal 역할만 명확히 한다.
6. `CHANGELOG.md`에 `0.2.1` 항목을 추가해 deprecation과 문서 정합화 내용을 기록한다. `0.2.0`의 잘못된 Playwright WebKit 주장은 당시 증적을 훼손하지 않도록 `0.2.1` 정정 항목에서 현재 release artifact와 project matrix에 맞게 바로잡는다.

**완료 기준**

- 기존 consumer type fixture가 수정 없이 통과한다.
- deprecated API가 canonical 예제에 남지 않는다.
- 공개 API 제거가 없고 package version 변경은 `0.2.0`에서 `0.2.1`로만 한정된다.

### Task 2. lazy loading 설명과 예제 정정

**변경 파일**

- `README.md`
- `src/core/types.ts`
- `example/src/playground/AdvancedExamples.tsx`
- `example/src/docs/content.tsx`
- `docs/02-architecture.md`
- `docs/03-component-api-draft.md`
- `docs/05-open-questions.md`
- `test/vitest/option-mapper.test.ts`
- lazy rendering 관련 focused Vitest/Playwright spec

**작업**

1. Advanced Lazy Loading 예제에서 효과가 없는 `engineOptions.lazyLoad`를 제거하고 `lazyRenderWidget`만으로 실제 React content mount 지연을 증명한다.
2. per-widget `lazyLoad=false`가 global content lazy를 해제하고, `true`만으로 global lazy를 활성화하지 않는 계약을 문서화한다.
3. observer root, retain-mounted, no-IntersectionObserver fallback, SSR initial markup 경계를 정확히 기록한다.
4. native GridStack lazy loading과 Comins React content lazy loading을 별도 표로 구분한다.
5. 현재 구현되지 않은 skeleton, `renderSkeleton`, `isWidgetLoading`, `rootMargin`, `threshold`, full virtualization은 지원 기능으로 주장하지 않는다.
6. `docs/06-transfer-lazy-loading-plan.md`에는 Slice A의 현재 통합 상태와 Slice B 중 실제 구현된 최소 content-lazy 경계만 상태 배너로 표시한다. 미구현 체크리스트를 완료로 바꾸지 않는다.

**완료 기준**

- Lazy 예제에서 native option을 제거해도 content mount 지연 테스트가 통과한다.
- README와 Docs가 skeleton/full virtualization을 현재 기능으로 오해하게 하지 않는다.
- 100-widget outer DOM 유지와 content mount 지연을 서로 다른 성능 특성으로 설명한다.

### Task 3. event API canonicalization

**변경 파일**

- `README.md`
- `src/components/DashboardGrid.tsx`
- `src/components/DashboardWidget.tsx`
- `src/gridstack/adapter.ts`
- `example/src/playground/WidgetExamples.tsx`
- `example/src/docs/content.tsx`
- `docs/03-component-api-draft.md`
- event 관련 Vitest/Playwright spec

**작업**

1. canonical lifecycle을 `onBeforeMove -> onMove -> onAfterMove`, `onBeforeResize -> onResize -> onAfterResize`, title-only double-click three-stage callback으로 정리한다.
2. legacy callback은 별도 compatibility 표로 이동하고 canonical 예제에서 사용하지 않는다.
3. 현재 호출 순서를 회귀 테스트로 고정한다.
   - move start: `onBeforeMove` 후 legacy `onWidgetDragStart`
   - move stop: layout commit 후 legacy `onWidgetDragStop`, 그 다음 `onAfterMove`
   - resize도 같은 구조를 유지한다.
   - title: before, action, legacy alias, after 순서를 유지한다.
4. `onWidgetHeaderDoubleClick` 설명을 header 전체가 아닌 title-only legacy alias로 정정한다.
5. `onWidgetResizeFrame`은 content pixel size 알림이고 `onResize`는 layout geometry lifecycle임을 명시한다.

**완료 기준**

- canonical 이벤트 예제에는 legacy callback 이름이 없다.
- legacy callback focused tests는 `0.2.1`에서 계속 통과한다.
- README, `/api`, Widget Events가 동일한 payload와 순서를 설명한다.

### Task 4. controlled state 사용 예제 통일

**변경 파일**

- `README.md`
- `example/src/docs/content.tsx`
- `example/src/readme-demo.tsx`
- `docs/03-component-api-draft.md`
- consumer type fixture

**작업**

1. Quick Start와 Docs Basic을 모두 `onLayoutCommit={dashboard.commands.applyLayoutSnapshot}`으로 통일한다.
2. `onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}`을 기본 예제에서 제거하고 개별 persistence가 필요한 advanced 설명으로 이동한다.
3. 같은 예제에서 `onLayoutCommit`을 단순 log로 쓰고 실제 상태는 per-widget callback으로 갱신하는 혼합 패턴을 제거한다.
4. 모든 TSX 예제에 required `widgets`와 `renderWidget`을 포함하거나, 부분 snippet이면 해당 전제 변수를 바로 위에 명시한다.
5. `actionLabels`의 import 가능한 public type과 기본 한국어 label을 설명한다.
6. `renderWidgetActions`와 `showControls` 조합을 실제 조건과 일치시킨다.

**완료 기준**

- README Quick Start, Docs Basic, component API sample이 같은 controlled-state 패턴을 사용한다.
- complete example fixture가 TypeScript consumer 환경에서 compile된다.
- fragment에서 정의되지 않은 `dashboardProps`, `renderWidget`, `snapshot`, `widget` 참조가 남지 않는다.

### Task 5. transfer 계약과 예제 완성

**변경 파일**

- `README.md`
- `example/src/docs/content.tsx`
- `docs/02-architecture.md`
- `docs/03-component-api-draft.md`
- `docs/05-open-questions.md`
- `docs/README.md`
- `test/vitest/readme.test.ts`
- transfer 관련 focused specs

**작업**

1. README에 `Palette and grid transfer` section을 추가한다.
2. 다음 public surface를 props/commands/type 표와 complete example에 포함한다.
   - `useDashboardDragIn`
   - `gridId`
   - `acceptExternalWidgets`
   - `gridTransferMode`
   - `onWidgetDropRequest`
   - `insertWidgetAt`
   - `insertDashboardWidgetAtLayout`
   - `transferDashboardWidget`
3. outgoing plain-HTML drop과 incoming widget transfer를 방향, 상태 소유권, callback, mutation 책임 기준으로 비교한다.
4. palette는 copy, Grid source는 기본 move, 명시적 copy, duplicate ID/predicate rejection, locked/non-movable/minimized/maximized source 거부를 문서화한다.
5. `acceptExternalWidgets`만 설정하고 `onWidgetDropRequest`를 처리하지 않으면 controlled state가 변경되지 않는다는 fail-closed 동작을 설명한다.
6. drag가 아닌 button alternative도 동일 pure helper를 사용한다는 접근성 계약을 기록한다.

**완료 기준**

- README만 읽어도 palette insertion과 cross-grid move/copy를 구현할 수 있다.
- raw GridStack `acceptWidgets`, `setupDragIn`, CRUD를 consumer 예제에서 호출하지 않는다.
- transfer rejection이 양쪽 controlled state를 변경하지 않는다는 설명과 테스트가 일치한다.

### Task 6. engine, responsive, handle 설명 정합화

**변경 파일**

- `README.md`
- `example/src/docs/content.tsx`
- `docs/03-component-api-draft.md`
- `docs/05-open-questions.md`
- handle/option mapper focused tests

**작업**

1. engine option을 runtime-sync, safe-reinitialize, initialization-only, deprecated/no-effect 네 그룹으로 나눈다.
2. `rtl`과 `sizeToContent`은 safe reinitialize, `nonce`는 initialization-only, native `lazyLoad`는 deprecated/no React-content effect로 표시한다.
3. handle 표에 `getColumnCount`, `getRowCount`, `getFloat`, `isAreaEmpty`, `willItFit`을 추가한다.
4. Advanced handle 예제에 `onLayoutCommit` 연결을 포함하고, raw mutation이 없는데 먼저 `commitLayout()`을 호출하는 무의미한 문장을 제거한다.
5. `compact()` 반환 snapshot을 `applyLayoutSnapshot`에 반영하는 complete example을 사용한다.
6. `refreshKey`, `commands.refreshLayout()`, handle `refresh()`의 동일 adapter refresh 진입점과 사용 위치를 비교한다.
7. responsive 상태에서는 engine actual column을 snapshot/onColumnsChange로 controlled state에 반영하는 계약을 설명한다.

**완료 기준**

- option 변경 시 실제 runtime sync/reinitialize/init-only 동작을 오해할 문장이 없다.
- handle 예제가 React controlled state를 우회한 채 종료되지 않는다.
- deprecated mapper alias는 canonical 문서와 예제에서 제거된다.

### Task 7. browser와 미지원 경계 정정

**변경 파일**

- `README.md`
- `CHANGELOG.md`
- `docs/04-verification-strategy.md`
- `docs/05-open-questions.md`
- `test/playwright/README.md`
- `test/vitest/playwright-project-policy.test.ts`

**작업**

1. 브랜드 Edge를 직접 자동화한 것처럼 표현하지 않는다. Chromium 기반 compatibility와 실제 Desktop Chrome project evidence를 구분한다.
2. Firefox는 전체 suite가 아니라 `@firefox-parity` 대표 engine-sensitive scenario만 실행한다고 명시한다.
3. Mobile Chrome도 `@mobile-touch` tagged scenario 범위로 제한해 설명한다.
4. WebKit project가 현재 matrix에 없음을 README, CHANGELOG, verification docs에서 일치시킨다.
5. Safari macOS/iOS와 실제 Safari 인증은 미검증 경계로 유지한다.
6. keyboard widget move/resize 미지원과 일반 button keyboard control 지원을 README Support에 추가한다.
7. controlled named nested grids와 native dynamic sub-grid 미지원 경계를 구분한다.

**완료 기준**

- 문서의 browser claim이 `playwright.config.ts` project/grep 정책을 초과하지 않는다.
- Playwright WebKit과 branded Safari를 동일 근거로 취급하지 않는다.
- 미지원 기능을 Playground 존재만으로 지원 기능처럼 주장하지 않는다.

### Task 8. 중복·내부 예제 경로 정리

**변경 파일**

- `example/src/main.tsx`
- `example/src/playground/routes.ts`
- `example/src/playground/WidgetPlayground.tsx`
- `example/src/playground/LayoutPlayground.tsx`
- `example/src/playground/AdvancedPlayground.tsx`
- current focused Playground components
- Playwright specs that use `/examples/internal/**` or `/examples/transfer`

**작업**

1. navigation에 없는 `/examples/internal/widget|layout|advanced`를 public example route로 유지하지 않는다.
2. 해당 route를 사용하는 browser tests를 current canonical Widget/Layout/Advanced routes로 옮긴다.
3. canonical route에서 재현하기 어려운 test harness만 별도 test fixture로 최소 분리한다. consumer Playground에 오래된 구현을 중복 유지하지 않는다.
4. coverage parity가 확인된 뒤 legacy three Playground components와 route switch를 삭제한다.
5. `/examples/transfer`는 `0.2.1` compatibility redirect로 유지하되 canonical 문서와 테스트는 `/examples/advanced/multi-grid/horizontal`을 사용한다.
6. redirect 하나만 회귀 테스트하고 동일 TransferPlayground를 별도 canonical page처럼 중복 검증하지 않는다.
7. `/readme-demo`는 GIF와 resource/browser fixture로 사용되므로 유지한다.

**완료 기준**

- 사용자에게 노출되는 기능별 예제와 browser test fixture가 분리된다.
- canonical route와 hidden internal route가 같은 기능을 서로 다른 방식으로 설명하지 않는다.
- legacy component 삭제 전 기존 browser behavior coverage가 current routes로 이전된다.

### Task 9. active 문서 동기화

**변경 파일**

- `README.md`
- `CHANGELOG.md`
- `docs/01-requirements.md`
- `docs/02-architecture.md`
- `docs/03-component-api-draft.md`
- `docs/04-verification-strategy.md`
- `docs/05-open-questions.md`
- `docs/06-transfer-lazy-loading-plan.md`
- `docs/README.md`
- `example/src/docs/content.tsx`

**작업**

1. README를 consumer quick start와 support boundary의 canonical 문서로 정한다.
2. `/api` content는 README보다 상세한 전체 props, commands, events, handle, utility reference로 정한다.
3. `docs/03-component-api-draft.md`의 `draft` 상태가 더 이상 맞지 않으면 current public API reference로 이름과 제목을 후속 정리하되, 파일 rename은 링크 영향 검토 후 별도 patch로 수행한다.
4. `docs/06-transfer-lazy-loading-plan.md`는 current API reference가 아닌 부분 구현·미구현 계획임을 문서 상단과 `docs/README.md`에서 명확히 한다.
5. active docs 사이의 transfer, lazy, browser, nested, event, persistence 용어를 동일하게 맞춘다.
6. historical plans/reports의 당시 evidence는 문장 정규화나 현재 사실 덮어쓰기를 하지 않는다.

**완료 기준**

- active 문서 검색에서 상충하는 support claim이 없다.
- current `0.2.0` 기준선, `0.2.1` 목표, `0.3.0` 제거 목표를 혼동하지 않는다.
- claim은 정제하되 historical evidence는 보존한다.

### Task 10. 문서 정합성 gate 강화

**변경 파일**

- `test/vitest/readme.test.ts`
- 신규 public-doc contract fixture 또는 기존 type fixture
- consumer smoke fixture
- `package.json`은 기존 command로 충분하지 않을 때만 최소 변경

**작업**

1. `DashboardGridProps`, `DashboardGridCommands`, `DashboardGridHandle`의 `keyof`와 documented name 배열의 양방향 completeness를 type-level로 검증한다.
2. 현재처럼 일부 이름의 단순 문자열 포함만 확인하는 테스트를 전체 공개 surface parity 검사로 교체한다.
3. transfer, lazy, deprecation, support-boundary section의 필수 문구를 별도 contract로 고정한다.
4. Quick Start, transfer, lazy, handle complete snippets에 대응하는 실제 consumer TSX fixture를 typecheck한다.
5. README table에 이름이 있어도 설명이나 예제가 다른 문제를 잡기 위해 canonical fixture의 API 조합을 browser/consumer smoke에서 실행한다.
6. 새 공개 prop/command/handle 추가 시 documented inventory를 갱신하지 않으면 typecheck 또는 Vitest가 실패하도록 한다.

**완료 기준**

- transfer props나 `insertWidgetAt`, safe query가 다시 누락되면 gate가 실패한다.
- deprecated API가 canonical example에 재등장하면 gate가 실패한다.
- README 테스트 이름의 “every public prop, command, handle” 주장이 실제 검사 범위와 일치한다.

### Task 11. `0.2.1` version metadata와 로컬 release readiness 확인

**변경 파일**

- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `README.md`
- `reports/YYYY-MM-DD.md`

**작업**

1. package와 root lockfile version을 `0.2.0`에서 `0.2.1`로 변경한다.
2. dependency version, integrity, resolution은 변경하지 않고 lockfile diff가 root package metadata에 한정되는지 확인한다.
3. `CHANGELOG.md`의 `0.2.1` 항목과 README의 설치·지원·migration 설명이 실제 변경 범위와 일치하는지 최종 대조한다.
4. package artifact 검증, consumer smoke, `npm pack --dry-run`으로 배포 후보의 파일 구성과 public type surface를 로컬에서 확인한다.
5. tag, GitHub Release, npm publish, push/PR은 실행하지 않고 별도 승인 대기 상태로 남긴다.

**완료 기준**

- `package.json`과 root `package-lock.json`이 모두 `0.2.1`이며 dependency graph에 무관한 변경이 없다.
- package artifact와 consumer smoke가 `0.2.1` metadata 기준으로 통과한다.
- npm registry의 현재 배포 버전을 변경하거나 `0.2.1`이 이미 배포됐다고 주장하지 않는다.

## 구현 순서

1. Task 1에서 공개 API inventory와 deprecation annotation을 먼저 고정한다.
2. Task 2와 Task 3에서 lazy/event canonical contract를 정리한다.
3. Task 4부터 Task 6까지 README와 API 예제를 실제 사용 경로로 통일한다.
4. Task 7에서 support claim을 현재 browser matrix와 맞춘다.
5. Task 8에서 test coverage를 current routes로 옮긴 뒤 legacy example을 제거한다.
6. Task 9에서 active 문서를 일괄 동기화한다.
7. Task 10의 parity gate를 마지막 문서 상태에 맞춰 고정한다.
8. Task 11에서 `0.2.1` version metadata를 반영하고 로컬 package artifact를 확인한다.
9. affected verification과 diff review를 실행하고, 의미 있는 변경 결과를 `reports/YYYY-MM-DD.md`에 기록한다.

## 검증 계획

### 구조와 타입

- `npm run typecheck`
- README/public API completeness Vitest
- consumer smoke fixture
- `git diff --check`

### focused Vitest

- `test/vitest/readme.test.ts`
- `test/vitest/option-mapper.test.ts`
- `test/vitest/configuration.test.ts`
- `test/vitest/dashboard-grid-handle.test.tsx`
- `test/vitest/use-dashboard-grid.test.tsx`
- `test/vitest/drag-in-contract.test.tsx`
- `test/vitest/widget-transfer.test.ts`
- event ordering과 lazy content boundary 관련 spec

### focused browser

- Docs/Playground routing과 compatibility redirect: Chromium
- Widget Events lifecycle: Chromium과 tagged Firefox parity
- Lazy Loading content mount: Chromium
- Transfer palette/Grid move-copy: Chromium, tagged Firefox parity, tagged Mobile Chrome touch
- internal route 제거로 이동한 affected dashboard interaction specs: Chromium
- 실제 Safari는 실행하지 않으며 미검증으로 보고한다.

### baseline

- 의미 있는 code/example/test 변경 완료 후 `npm run verify` 한 번
- `npm run verify:package-artifact`
- `npm run test:consumer`
- `npm pack --dry-run`
- lazy lifecycle 영향이 실제 adapter/resource behavior를 바꾸는 경우에만 기존 `chromium-resource` gate 실행
- publication 또는 maintainer 명시 요청이 없으므로 `npm run verify:full`은 실행하지 않는다.

## 다음 minor 제거 gate

`0.3.0` 구현을 시작하기 전 다음을 별도 승인받는다.

1. deprecated API별 repository usage와 공개 migration 문서 재검증
2. deprecated callback 없이 current examples/tests 통과 확인
3. `DashboardGridEngineOptions.lazyLoad` 제거 후 Comins content lazy 회귀 확인
4. mapper legacy alias와 adapter-only override root export 제거
5. public type diff와 consumer smoke를 포함한 breaking-change 검토
6. version, CHANGELOG, publish/PR/merge는 별도 release workflow로 수행

## 잔여 리스크

- npm에 이미 공개된 `0.2.0` consumer가 deprecated callback이나 mapper overload를 사용 중일 수 있으므로 repository 내부 미사용만으로 즉시 제거할 수 없다.
- JSDoc deprecation은 runtime warning을 발생시키지 않는다. 이 계획은 console warning을 추가하지 않아 production noise와 hot-path 비용을 만들지 않는다.
- current lazy content boundary는 skeleton과 loading state를 제공하지 않는다. 문서 정정으로 기능이 추가되는 것은 아니며 별도 제품 결정 없이는 구현 범위를 확장하지 않는다.
- hidden internal Playground는 browser regression fixture 역할을 겸하고 있으므로 coverage 이전 전에 삭제하면 회귀 검증이 약해질 수 있다.
- controlled nested example은 raw GridStack native nested feature 전체를 대표하지 않는다.
- 브라우저 support 문구는 configured project evidence까지만 보장하며 branded Edge와 Safari를 추론으로 인증하지 않는다.

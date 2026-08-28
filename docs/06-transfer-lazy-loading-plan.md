# Grid Transfer And Lazy Loading Implementation Plan

**상태:** 승인된 구현 계획 (`2026-08-25`)

## 1. 목표

다음 마이너 버전 `0.3.0`의 개발 범위를 두 개의 독립적인 세로 단위로 구현한다.

1. 외부 팔레트 Drag-in, 대상 Grid 승인, Grid 간 위젯 이동
2. 지연 렌더링, 스켈레톤 UI, placeholder 스타일 변수, 안전한 drag/resize 옵션

각 단위는 공개 API, 제어형 React 상태, GridStack 어댑터, Playground, 문서, 기능 중심 테스트까지 포함해야 완료된다. Playground와 검증이 없는 공개 기능은 완료로 처리하지 않는다.

이 문서는 구현 계획이다. 버전 변경, 원격 push, PR 생성·병합, 태그, Release, npm publish는 별도 승인 범위다.
신규 dependency를 추가하지 않고 현재 React, GridStack, Vitest, Playwright 구성 안에서 구현한다.

## 2. 확정 결정

- 팔레트에서 Grid로 드롭할 때는 팔레트 항목을 유지하고 새 위젯을 복사한다.
- Grid 간 드롭은 기본적으로 원본 Grid에서 대상 Grid로 이동한다.
- Grid 간 전송은 기본 `move`와 명시적 `gridTransferMode="copy"`를 지원한다.
- 대상 Grid에 동일한 위젯 ID가 있으면 드롭을 거부하고 양쪽 상태를 변경하지 않는다.
- Grid 간 상태 전환은 package-owned typed request와 pure helper로 계산하고, 소비자가 두 controlled Grid 상태에 반영한다. 별도 `DashboardGridGroup` 또는 Provider는 추가하지 않는다.
- `maximized` 또는 `minimized` 위젯은 먼저 복원한 뒤에만 Grid 간 이동·복사를 허용한다.
- Lazy Loading으로 한 번 렌더링된 실제 위젯 콘텐츠는 화면 밖으로 나가도 마운트를 유지한다.
- 기본 스켈레톤을 제공하고 소비자가 `renderSkeleton`으로 교체할 수 있게 한다.
- 예제는 패키지 공개 API만 사용하며 GridStack raw CRUD를 호출하지 않는다.
- 드래그 없이 동일 작업을 수행할 수 있는 버튼을 Playground에 제공한다.

## 3. 확인된 현재 구조

- `DashboardGrid`는 `widgets.map()`으로 모든 Grid item, shell, `renderWidget()` 결과를 즉시 렌더링한다.
- React의 `widgets`가 source of truth이고 GridStack은 `src/gridstack/adapter.ts` 내부에서만 사용된다.
- 기존 `externalDropTargets`는 Grid 위젯을 외부 HTML 대상에 놓았다는 비파괴 콜백이다. 신규 Drag-in과 방향 및 목적이 다르므로 기존 API를 변경하지 않는다.
- `addDashboardWidget()`은 활성 Grid와 column cache의 첫 빈 공간에 배치한다. 드롭된 `x/y/w/h`를 정확히 적용하는 별도 삽입 계약이 필요하다.
- `layoutsByColumn`은 위젯 ID와 column별 geometry를 보존하므로 이동·복사도 활성 layout과 기존 cache를 함께 갱신해야 한다.
- 설치된 GridStack `13.0.1`은 `acceptWidgets`, `GridStack.setupDragIn()`, `dropped`, drag/resize option, native `lazyLoad`를 제공한다.
- GridStack native lazy loading은 `createWidgetDivs()`와 `GridStack.renderCB()` 경로에 연결된다. React가 렌더링한 element를 `makeWidget()`으로 등록하는 현재 구조에서는 `renderWidget()` 호출을 지연시키지 못한다.
- 현재 drag placeholder는 `src/styles.css`에 고정 스타일로 존재한다.
- 현재 Playwright 정책은 Chromium 일반 시나리오, 대표 Firefox parity, Mobile Chrome touch, 단일 Chromium resource gate로 분리되어 있고 retry는 없다.

## 4. 공통 설계 원칙

### 4.1 상태 소유권

- GridStack은 포인터·터치 gesture, drop 승인 시점, preview, 최종 geometry만 계산한다.
- GridStack이 생성하거나 이동한 임시 DOM을 영구 상태로 사용하지 않는다.
- adapter는 `dropped`에서 React 소유 DOM과 engine을 기존 controlled snapshot으로 정리한 뒤 typed request를 전달한다.
- drop request는 신규 widget의 `targetLayout`과 충돌 처리로 이동한 기존 target widget까지 포함하는 전체 `targetSnapshot`을 함께 전달한다.
- 소비자는 공개 core helper 또는 `useDashboardGrid()` command를 이용해 상태를 반영한다.
- callback을 처리하지 않거나 처리 중 예외가 발생해도 원본 Grid와 대상 Grid는 기존 상태를 유지한다.

### 4.2 데이터 및 ID

- widget ID는 Grid 내부에서 유일해야 한다.
- 자동 ID 변경은 하지 않는다. 팔레트의 `createWidget()`이 매 drag마다 최종 ID를 생성한다.
- 대상 ID 충돌은 `acceptExternalWidgets` 단계와 `dropped` 직전에 다시 검사한다.
- 이동 성공 시 source의 활성 layout, `previousLayouts`, 모든 기존 `layoutsByColumn`에서 ID를 제거한다.
- target의 활성 column에는 GridStack이 계산한 geometry를 적용하고, target의 기존 비활성 column cache에는 현재 first-available 규칙으로 정규화한 geometry를 추가한다.
- 일반 `addWidget()`의 기존 동일 ID 교체 동작은 호환성을 위해 변경하지 않는다. 신규 drop/transfer helper만 fail-closed 삽입을 사용한다.

### 4.3 지원 경계

- `locked` 또는 `movable: false`인 위젯은 Grid 간 전송 source가 될 수 없다.
- `maximized` 또는 `minimized`인 위젯은 source별 restore geometry를 대상 Grid에서 안전하게 재구성할 수 없으므로 먼저 복원해야 이동·복사할 수 있다.
- 같은 Grid 안의 이동은 기존 drag/commit 계약을 그대로 사용하며 transfer request를 발생시키지 않는다.
- cross-frame, shadow root, nested Grid, async accept callback, full DOM virtualization은 `0.3.0` 범위에서 제외한다.
- `acceptWidgets`, `lazyLoad`, raw drag lifecycle callback, raw resize callback, custom helper function을 `DashboardGridEngineOptions`에 그대로 노출하지 않는다.

### 4.4 접근성

- 포인터 drag는 유일한 조작 수단이 될 수 없다.
- 팔레트에는 동일한 factory를 사용하는 “추가” 버튼을 제공한다.
- Grid 간 이동에는 대상 Grid를 선택하여 실행하는 버튼을 제공한다.
- skeleton container는 `aria-busy`를 사용하고 skeleton 장식 요소는 접근성 트리에서 제외한다.
- shimmer는 `prefers-reduced-motion: reduce`에서 제거한다.

## 5. 공개 API 계약

다음 이름과 동작을 구현 기준으로 사용한다. 구현 중 TypeScript 충돌처럼 저장소에서만 확인 가능한 비제품 문제가 발견되면 동작과 데이터 계약은 유지하고 최소 범위에서 타입 표현만 조정한다.

### 5.1 안전한 drag/resize 옵션

```ts
export type DashboardDragOptions = {
  handle?: string;
  appendTo?: string;
  pause?: boolean | number;
  scroll?: boolean;
  cancel?: string;
};

export type DashboardResizeOptions = {
  handles?: string;
  autoHide?: boolean;
  element?: string;
};

export type DashboardGridEngineOptions = {
  // existing fields
  dragOptions?: DashboardDragOptions;
  resizeOptions?: DashboardResizeOptions;
};
```

- 기존 `dragHandle`, `resizeHandles`는 유지한다.
- 새 중첩 옵션이 있으면 `dragOptions.handle`, `resizeOptions.handles`가 기존 단축 필드보다 우선한다.
- 함수 callback, `HTMLElement`, `helper`는 공개 타입에 포함하지 않는다.

### 5.2 팔레트 Drag-in

```ts
export type DashboardDragInPreviewLayout = Pick<
  DashboardWidgetLayout,
  "w" | "h" | "minW" | "minH" | "maxW" | "maxH"
>;

export type UseDashboardDragInOptions<TData> = {
  sourceId: string;
  previewLayout: DashboardDragInPreviewLayout;
  createWidget: () => DashboardWidget<TData>;
  dragOptions?: DashboardDragOptions;
  disabled?: boolean;
};

export function useDashboardDragIn<TData>(
  options: UseDashboardDragInOptions<TData>,
): React.RefCallback<HTMLElement>;
```

- hook은 source element가 mount될 때 `GridStack.setupDragIn()`을 설정한다.
- 내부 helper는 항상 clone이다.
- `createWidget()`은 drag 시작마다 한 번 호출한다.
- unmount, ref 교체, `disabled` 변경 시 draggable을 destroy하고 registry를 정리한다.
- factory 예외, 빈 ID, layout ID 불일치, 비정상 geometry는 fail-closed 처리한다.

### 5.3 대상 Grid와 drop request

```ts
export type DashboardWidgetTransferMode = "copy" | "move";

export type DashboardWidgetDropCandidate<TData> = {
  source:
    | { kind: "palette"; sourceId: string }
    | { kind: "grid"; gridId: string; widgetId: DashboardWidgetId };
  targetGridId: string;
  widget: DashboardWidget<TData>;
  mode: DashboardWidgetTransferMode;
};

export type DashboardWidgetDropRequest<TData> = DashboardWidgetDropCandidate<TData> & {
  operationId: string;
  targetLayout: DashboardWidgetLayout;
  targetSnapshot: DashboardLayoutSnapshot;
};

export type DashboardGridProps<TData> = {
  // existing props
  gridId?: string;
  acceptExternalWidgets?: boolean | ((candidate: DashboardWidgetDropCandidate<TData>) => boolean);
  gridTransferMode?: DashboardWidgetTransferMode;
  onWidgetDropRequest?: (request: DashboardWidgetDropRequest<TData>) => void;
};
```

- `acceptExternalWidgets` 기본값은 `false`다.
- external acceptance를 사용하는 Grid에는 비어 있지 않은 `gridId`를 요구한다.
- 팔레트 candidate의 mode는 항상 `copy`다.
- Grid source의 mode는 `gridTransferMode ?? "move"`다.
- 소비자 callback을 GridStack의 raw `dropped` 인자와 결합하지 않는다.
- 기존 `onWidgetExternalDrop`의 이름과 의미는 유지한다.

### 5.4 제어형 상태 helper

```ts
export type DashboardWidgetTransferRejection =
  | "duplicate-id"
  | "missing-widget"
  | "not-transferable"
  | "invalid-layout";

export type DashboardWidgetTransferResult<TData> =
  | {
      accepted: true;
      source: DashboardLayoutState<TData>;
      target: DashboardLayoutState<TData>;
    }
  | {
      accepted: false;
      reason: DashboardWidgetTransferRejection;
      source: DashboardLayoutState<TData>;
      target: DashboardLayoutState<TData>;
    };
```

추가할 helper는 다음 책임을 갖는다.

- `insertDashboardWidgetAtLayout(state, widget, targetLayout, targetSnapshot)`: 중복 ID를 교체하지 않고 신규 widget과 충돌로 이동한 기존 widget의 정확한 target geometry를 함께 적용한다.
- `transferDashboardWidget({ source, target, widgetId, targetLayout, targetSnapshot, mode })`: 전체 target snapshot 검증을 먼저 완료하고 accepted인 경우에만 source를 제거한다.
- 반환 state는 입력을 mutate하지 않는다.
- `useDashboardGrid()`에는 palette consumer를 위한 `insertWidgetAt(widget, targetLayout, targetSnapshot)` command를 추가한다.
- 서로 다른 두 hook의 이동은 `transferDashboardWidget()` 결과를 각 hook의 기존 `restoreLayout()`에 같은 event turn에서 전달한다.

### 5.5 Lazy Rendering과 skeleton

```ts
export type DashboardLazyRenderOptions = {
  rootMargin?: string;
  threshold?: number | ReadonlyArray<number>;
};

export type DashboardGridProps<TData> = {
  // existing props
  lazyRender?: boolean | DashboardLazyRenderOptions;
  isWidgetLoading?: (widget: DashboardWidget<TData>) => boolean;
  renderSkeleton?: (widget: DashboardWidget<TData>) => React.ReactNode;
};
```

- `lazyRender` 기본값은 `false`로 기존 동작을 보존한다.
- `true`의 기본값은 viewport 기준 `rootMargin: "200px 0px"`, `threshold: 0`이다.
- outer `.grid-stack-item`, `.grid-stack-item-content`, widget shell과 geometry attribute는 처음부터 렌더링한다.
- 실제 `renderWidget()` 결과만 가시 영역 진입 전까지 생략한다.
- 최초 가시화 후 mounted ID set에서 제거하지 않는다.
- browser에 `IntersectionObserver`가 없으면 mount effect에서 eager render로 전환한다.
- lazy SSR은 skeleton markup을 출력하고 client의 첫 render와 일치시킨 뒤 observer 또는 eager fallback을 적용한다.
- `isWidgetLoading()`이 true이면 실제 콘텐츠는 mount하되 skeleton을 표시하고 `aria-busy="true"`를 유지한다.
- loading이 false로 바뀌면 skeleton을 제거하고, `sizeToContent`가 활성화된 경우 해당 widget에 대해 resize/commit을 한 번 예약한다.
- drag/resize 중 발생한 신규 가시화와 loading 완료 반영은 interaction stop 이후 한 번에 처리한다.

## 6. Slice A — Palette Drag-in And Grid Transfer

### Task A1. Core placement와 atomic transfer 계약

**변경 파일**

- Modify: `src/core/types.ts`
- Modify: `src/core/layout-state.ts`
- Add: `src/core/widget-transfer.ts`
- Modify: `src/core/use-dashboard-grid.ts`
- Modify: `src/index.ts`
- Add: `test/vitest/widget-transfer.test.ts`
- Modify: `test/vitest/use-dashboard-grid.test.tsx`

**작업**

- [x] 중복 ID, exact geometry, 충돌로 이동한 기존 target geometry, 다른 column 수, inactive cache, copy, move, source 보존 실패 사례를 먼저 테스트한다.
- [x] locked, non-movable, minimized, maximized source가 `not-transferable`로 거부되는 테스트를 추가한다.
- [x] target 검증 실패 시 source/target object가 그대로 반환되는 no-op identity를 검증한다.
- [x] active target geometry는 GridStack 결과를 보존하고 inactive cache만 deterministic first-available로 배치한다.
- [x] move는 모든 source cache에서 ID와 restore entry를 제거하고 copy는 source를 그대로 둔다.
- [x] `insertWidgetAt` reducer action과 command를 추가한다.
- [x] 모든 snapshot이 JSON 직렬화 가능하고 widget data가 손실되지 않는지 검증한다.

**Focused gate**

```bash
npm run test:run -- test/vitest/widget-transfer.test.ts test/vitest/layout-state.test.ts test/vitest/use-dashboard-grid.test.tsx
npm run typecheck
```

**결과 (`2026-08-25`)**

- Focused Vitest: 49/49 통과
- TypeScript: 통과
- Package baseline `npm run verify`: security 25/25, Vitest 122/122, license, TypeScript, build 통과
- Core-only 변경이므로 Playwright는 실행하지 않음

### Task A2. Palette source lifecycle

**변경 파일**

- Add: `src/gridstack/drag-in.ts`
- Add: `src/gridstack/transfer-registry.ts`
- Add: `src/components/use-dashboard-drag-in.ts`
- Modify: `src/index.ts`
- Add: `test/vitest/drag-in-contract.test.tsx`

**작업**

- [x] callback ref mount 시에만 GridStack을 dynamic import한다.
- [x] source element와 clone을 WeakMap 기반 registry에 연결한다.
- [x] drag 시작마다 factory를 호출하여 candidate를 생성하고 drag 종료 후 폐기한다.
- [x] `GridStack.setupDragIn()`에는 package-owned start/stop/helper만 전달한다.
- [x] source unmount와 ref 교체 시 `GridStack.getDD().draggable(element, "destroy")`를 호출하고 registry entry를 제거한다.
- [x] 동일 element 재설정, Strict Mode effect 재실행, factory 실패가 listener 또는 candidate를 누적하지 않도록 한다.
- [x] SSR import에서 `window`, `document`, GridStack을 평가하지 않는지 확인한다.

**Focused gate**

```bash
npm run test:run -- test/vitest/drag-in-contract.test.tsx
npm run typecheck
```

**결과 (`2026-08-25`)**

- Focused Vitest: 12/12 통과
- Task A1 transfer 회귀 포함 focused Vitest: 27/27 통과
- TypeScript: 통과
- Package baseline `npm run verify`: security 25/25, Vitest 134/134, license, TypeScript, build 통과
- target adapter 계약은 Task A3에서 구현하며 실제 browser drag는 Task A4 route·spec에서 검증하므로 Playwright는 실행하지 않음

### Task A3. Target acceptance와 controlled rollback

**변경 파일**

- Modify: `src/core/configuration.ts`
- Modify: `src/components/DashboardGrid.tsx`
- Modify: `src/gridstack/option-mapper.ts`
- Modify: `src/gridstack/adapter.ts`
- Modify: `src/gridstack/transfer-registry.ts`
- Modify: `test/vitest/configuration.test.ts`
- Modify: `test/vitest/dashboard-grid-configuration.test.tsx`
- Modify: `test/vitest/dashboard-grid-handle.test.tsx`
- Modify: `test/vitest/option-mapper.test.ts`

**작업**

- [x] transfer-enabled target에는 유효한 `gridId`가 필요하다는 fail-closed 설정 테스트를 추가한다.
- [x] option mapper에는 raw consumer predicate를 넣지 않고 adapter-owned `acceptWidgets` bridge만 설치한다.
- [x] palette와 Grid source를 registry에서 찾지 못하면 거부한다.
- [x] consumer predicate가 false를 반환하거나 예외를 던지면 거부한다.
- [x] target의 현재 widgets로 중복 ID를 enter 시점과 drop 시점에 검사한다.
- [x] Grid source가 locked/non-movable/minimized/maximized이거나 source registry가 stale하면 거부한다.
- [x] `dropped`에서 source, target, mode, widget, final `x/y/w/h`, 전체 target snapshot, operation ID를 읽는다.
- [x] GridStack의 임시 target node와 source 변경을 controlled snapshot으로 되돌린 뒤 `onWidgetDropRequest`를 한 번 호출한다.
- [x] no-op consumer, callback 예외, route unmount에서도 React 소유 DOM이 다른 Grid로 남지 않는지 확인한다.
- [x] 기존 internal drag, `onWidgetExternalDrop`, layout commit 순서를 회귀시키지 않는다.

**Focused gate**

```bash
npm run test:run -- test/vitest/configuration.test.ts test/vitest/dashboard-grid-configuration.test.tsx test/vitest/dashboard-grid-handle.test.tsx test/vitest/option-mapper.test.ts
npm run typecheck
```

**결과 (`2026-08-25`)**

- A3 focused Vitest 및 registry 회귀: 61/61 통과
- TypeScript: 통과
- Package baseline `npm run verify`: security 25/25, Vitest 155/155, license, TypeScript, build 통과
- Transfer Playground와 실제 drag E2E는 Task A4의 route·spec과 함께 실행하여 중복 검증을 피함

### Task A4. Transfer Playground

**변경 파일**

- Add: `example/src/playground/TransferPlayground.tsx`
- Add: `example/src/playground/components/WidgetPalette.tsx`
- Modify: `example/src/playground/PlaygroundShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/styles.css`
- Add: `test/playwright/specs/transfer-playground.spec.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`

**예제 계약**

- [x] `/examples/transfer`에 재사용 가능한 KPI, 차트, 표 palette를 표시한다.
- [x] 서로 다른 column 수를 가진 Grid A와 Grid B를 동시에 표시한다.
- [x] palette item drag와 동일 factory를 사용하는 “추가” 버튼을 제공한다.
- [x] Grid 위젯마다 대상 Grid를 선택하는 “다른 Grid로 이동” 버튼을 제공한다.
- [x] Grid 전송 mode는 기본 `move`이며 Playground toggle로 명시적 `copy`도 확인할 수 있게 한다.
- [x] 허용 type과 거부 type을 모두 보여주고 accepted/rejected 사유를 live status에 표시한다.
- [x] duplicate ID 시 source와 target의 widget count 및 geometry가 유지되는 것을 화면에서 확인할 수 있게 한다.
- [x] operation ID, source, target, mode, 최종 geometry를 예제 상태 패널에 표시한다.
- [x] 두 Grid 모두 package public API만 사용하고 raw GridStack CRUD 버튼이나 호출을 두지 않는다.

**E2E 계약**

- [x] Chromium: palette 복사 후 palette 항목 유지, target exact geometry, 버튼 추가 동등성을 검증한다.
- [x] Chromium + `@firefox-parity`: Grid A → B 이동과 source 제거/target 추가를 검증한다.
- [x] Chromium: 명시적 Grid copy에서 source가 유지되고 target에 같은 ID가 추가되는지 검증한다.
- [x] 같은 시나리오에서 duplicate ID 또는 predicate 거부 후 양쪽 상태가 유지되는지 검증한다.
- [x] `@mobile-touch`: palette touch drag-in 한 건과 비-drag 추가 버튼을 검증한다.
- [x] route 전환 후 stale draggable, duplicate callback, console/page error가 없는지 검증한다.

**Focused gate**

```bash
npm run test:e2e -- test/playwright/specs/transfer-playground.spec.ts --project=chromium
npm run test:e2e -- test/playwright/specs/transfer-playground.spec.ts --project=firefox
npm run test:e2e -- test/playwright/specs/transfer-playground.spec.ts --project=mobile-chrome
npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts --project=chromium
```

**결과 (`2026-08-25`)**

- Transfer Playground Chromium: 4/4 통과
- Firefox 실제 Grid A → B 이동: 1/1 통과
- Mobile Chrome palette touch drag-in 및 버튼 대체: 1/1 통과
- 기존 mobile plain-div external drop 회귀: 1/1 통과
- Docs/Playground routing Chromium: 7/7 통과
- TypeScript: 통과
- Package baseline `npm run verify`: security 25/25, Vitest 155/155, license, TypeScript, build 통과
- 최초 Chromium과 Mobile Chrome 실패는 target 중앙이 실제 viewport 밖인 테스트 좌표 문제로 분류했고, visible target 좌표 및 공용 touch helper의 target scroll 보강 후 통과

## 7. Slice B — Lazy Rendering, Skeleton, Placeholder, Options

### Task B1. Safe option mapping

**변경 파일**

- Modify: `src/core/types.ts`
- Modify: `src/core/configuration.ts`
- Modify: `src/gridstack/option-mapper.ts`
- Modify: `test/vitest/configuration.test.ts`
- Modify: `test/vitest/option-mapper.test.ts`

**작업**

- [ ] selector string, `pause`, `scroll`, `autoHide`의 정상·비정상 입력 테스트를 먼저 추가한다.
- [ ] `dragOptions`와 `resizeOptions`의 안전한 필드만 GridStack option으로 변환한다.
- [ ] 기존 `dragHandle`, `resizeHandles`, `alwaysShowResizeHandle` 호환성과 precedence를 검증한다.
- [ ] raw callback, helper function, DOM element를 public 타입에 추가하지 않는다.
- [ ] routine option 변경은 GridStack instance 재생성 없이 `adapter.sync()`로 반영한다.

**Focused gate**

```bash
npm run test:run -- test/vitest/configuration.test.ts test/vitest/option-mapper.test.ts
npm run typecheck
```

### Task B2. Visibility lifecycle과 skeleton rendering

**변경 파일**

- Add: `src/components/use-dashboard-lazy-render.ts`
- Modify: `src/components/DashboardGrid.tsx`
- Modify: `src/components/DashboardWidget.tsx`
- Modify: `src/gridstack/adapter.ts`
- Modify: `src/styles.css`
- Add: `test/vitest/lazy-render-contract.test.tsx`
- Modify: `test/vitest/dashboard-grid-handle.test.tsx`

**작업**

- [ ] lazy disabled SSR가 기존 `renderWidget()` markup을 유지하는 테스트를 추가한다.
- [ ] lazy enabled SSR가 deterministic skeleton markup과 `aria-busy`를 출력하는 테스트를 추가한다.
- [ ] 빈 `rootMargin`, 범위를 벗어난 threshold, 비정상 threshold 배열을 generic configuration error로 거부한다.
- [ ] widget별 DOM ref를 observer에 연결하되 outer Grid item과 shell은 항상 유지한다.
- [ ] intersect된 ID는 mounted set에 한 번만 추가하고 offscreen에서 제거하지 않는다.
- [ ] widget 삭제, 전체 clear, route unmount 시 observer와 pending state를 정리한다.
- [ ] drag/resize start에서 visibility 변경을 freeze하고 stop에서 한 번 flush한다.
- [ ] `isWidgetLoading`이 false로 전환되면 해당 widget만 reveal하고 `sizeToContent` refresh를 animation frame 한 번으로 병합한다.
- [ ] `IntersectionObserver`가 없는 client에서는 effect 후 eager render한다.
- [ ] default skeleton과 custom slot 모두 widget title/controls와 geometry를 흔들지 않게 한다.

### Task B3. CSS placeholder와 skeleton theme

**변경 파일**

- Modify: `src/styles.css`
- Modify: `example/src/styles.css`

**작업**

- [ ] 현재 placeholder 시각값을 기본값으로 보존하면서 background, border, radius, inset CSS 변수를 추가한다.
- [ ] skeleton surface, highlight, radius, animation duration CSS 변수를 추가한다.
- [ ] skeleton과 GridStack drag placeholder class를 분리한다.
- [ ] skeleton은 pointer event를 가로채지 않고 shell drag/resize handle을 유지한다.
- [ ] reduced-motion에서는 shimmer animation을 제거한다.
- [ ] 색상·폰트 자체만 확인하는 E2E는 추가하지 않는다.

### Task B4. Lazy Loading Playground

**변경 파일**

- Add: `example/src/playground/LazyLoadingPlayground.tsx`
- Modify: `example/src/playground/PlaygroundShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/styles.css`
- Modify: `example/src/readme-demo.tsx`
- Add: `test/playwright/specs/lazy-loading-playground.spec.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**예제 계약**

- [ ] `/examples/lazy-loading`에 viewport 밖 widget이 충분히 생기도록 100개 fixture를 제공한다.
- [ ] lazy on/off, loading 완료, custom skeleton, placeholder theme, drag/resize option을 제어하는 공개 API 예제를 제공한다.
- [ ] 전체 Grid item 수, 실제 `renderWidget()` mount 수, busy widget 수를 화면에 표시한다.
- [ ] 첫 widget은 custom skeleton, 나머지는 default skeleton을 사용한다.
- [ ] scroll 진입, loading 완료, drag, resize, `sizeToContent` 결과를 상태 패널에서 확인할 수 있게 한다.
- [ ] 기존 단일 Chromium resource test가 lazy path를 실제로 통과하도록 readme demo의 100-widget 모드에 `lazyRender`를 적용한다.

**E2E 계약**

- [ ] Chromium: 최초 100개 outer item과 제한된 실제 content mount 수를 검증한다.
- [ ] scroll 후 해당 widget이 skeleton → content로 전환되고 다시 offscreen이 되어도 mounted count가 감소하지 않는지 검증한다.
- [ ] loading 중 drag/resize가 끝난 뒤 geometry commit이 한 번 발생하는지 검증한다.
- [ ] loading 완료 후 `sizeToContent`가 한 번 반영되고 callback/observer가 중복되지 않는지 검증한다.
- [ ] `IntersectionObserver`를 계측하여 route unmount 후 observed target이 남지 않는지 검증한다.
- [ ] 기존 단일 `@resource-stability` 시나리오를 확장해 100-widget lazy mount 수와 기존 CDP budget을 함께 검증한다. 별도 resource test를 추가하지 않는다.

**Focused gate**

```bash
npm run test:e2e -- test/playwright/specs/lazy-loading-playground.spec.ts --project=chromium
npm run test:e2e -- test/playwright/specs/dashboard-grid.spec.ts --project=chromium-resource --no-deps
```

## 8. 문서와 공개 계약 정합성

**변경 파일**

- Modify: `README.md`
- Modify: `docs/02-architecture.md`
- Modify: `docs/03-component-api-draft.md`
- Modify: `docs/04-verification-strategy.md`
- Modify: `docs/05-open-questions.md`
- Modify: `example/src/docs/content.tsx`
- Modify: `test/vitest/readme.test.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`

**작업**

- [ ] 기존 external drop과 신규 incoming drag-in의 차이를 표와 예제로 구분한다.
- [ ] `useDashboardDragIn`, `acceptExternalWidgets`, drop request, transfer helper 예제를 추가한다.
- [ ] Lazy SSR, retain-mounted, `IntersectionObserver` fallback, skeleton slot을 문서화한다.
- [ ] safe drag/resize option과 raw callback/helper 비지원 경계를 문서화한다.
- [ ] `/examples/transfer`, `/examples/lazy-loading` 링크를 README와 API 문서에 연결한다.
- [ ] `docs/04-verification-strategy.md`의 broad `verify:full` 안내를 Governance v1.7의 affected-spec 정책과 맞춘다.
- [ ] `docs/05-open-questions.md`에 본 문서의 확정 결정과 v0.3 명시적 지원 경계를 반영한다.
- [ ] package version은 구현 PR에서 변경하지 않고 release 단계에서만 `0.3.0`으로 변경한다.

## 9. 회귀 및 최종 검증

### 9.1 기존 interaction 영향 범위

adapter의 drag/drop lifecycle을 변경하므로 다음 기존 계약을 focused rerun한다.

- internal drag layout commit 및 callback 순서
- 기존 `externalDropTargets` 성공·비대상·locked/non-movable·resize 중 무시
- browser boundary 밖 drag 종료와 후속 drag 복구
- Mobile Chrome 기존 touch drag/resize
- option update 시 instance 유지와 cleanup

예시 명령:

```bash
npm run test:e2e -- test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "drag lifecycle|external drop|browser boundary|leaving the grid"
npm run test:e2e -- test/playwright/specs/dashboard-grid.spec.ts --project=firefox --grep "drag lifecycle|external drop"
npm run test:e2e -- test/playwright/specs/dashboard-grid.spec.ts --project=mobile-chrome
```

### 9.2 전체 package baseline

의미 있는 코드와 테스트 계약이 모두 안정화된 뒤 한 번만 실행한다.

```bash
npm run verify
```

- security, license, TypeScript, Vitest, build 결과를 분리해서 기록한다.
- 전체 `npm run test:e2e`와 `npm run verify:full`은 실행하지 않는다. 실제 publish 또는 maintainer의 명시적 요청이 있을 때만 실행한다.
- 실패하면 단일 failed spec/job으로 범위를 좁히고 전체 gate를 반복하지 않는다.
- 의미 있는 구현 변경이 완료되면 `reports/YYYY-MM-DD.md`에 변경 파일, focused 검증, 결과, 미실행 항목, 잔여 리스크를 기록한다.

## 10. 구현 순서와 완료 기준

1. Task A1로 pure state contract를 먼저 고정한다.
2. Task A2–A3으로 adapter의 drag-in과 controlled rollback을 완성한다.
3. Task A4의 Playground와 브라우저 검증까지 통과한 뒤 Slice A를 완료한다.
4. Task B1로 option contract를 고정한다.
5. Task B2–B3으로 lazy lifecycle과 styling을 구현한다.
6. Task B4의 Playground와 100-widget 검증까지 통과한 뒤 Slice B를 완료한다.
7. 문서 정합성과 기존 affected interaction 회귀를 확인한다.
8. `npm run verify`를 한 번 실행하고 보고서를 작성한다.

완료 조건은 다음과 같다.

- 두 신규 Playground route에서 실제 동작을 재현할 수 있다.
- palette copy, Grid move, reject/rollback, duplicate ID 정책이 public state 결과로 검증된다.
- drag를 사용하지 않는 추가·이동 경로가 동일한 core helper를 사용한다.
- lazy mode에서 100개 outer item을 유지하면서 초기 실제 content mount 수가 viewport 범위로 제한된다.
- 한 번 로드한 content가 offscreen에서 unmount되지 않는다.
- drag/resize 및 `sizeToContent`와 lazy 상태 전환이 중복 commit을 만들지 않는다.
- observer, draggable, GridStack event, document/window listener가 route unmount 후 남지 않는다.
- 기존 external drop, internal drag/resize, column cache, serialization 계약이 통과한다.
- `npm run verify`가 통과하고 미실행된 broad gate가 명시된다.

## 11. 잔여 기술 리스크

- GridStack의 cross-grid `dropped`가 React 소유 element를 이동하는 시점과 rollback 순서는 실제 브라우저에서 검증해야 한다. 임시 DOM을 안전하게 복구할 수 없으면 Grid item 자체 이동 대신 adapter-owned clone proxy를 사용한다.
- 두 개의 독립 `useDashboardGrid()` dispatch는 같은 event turn의 React batching을 전제로 한다. Playground에서 source/target snapshot이 한 paint 안에 바뀌는지 확인한다.
- 서로 다른 target column과 `maxRow` 조건에서 GridStack이 반환한 geometry를 core가 다시 변형하지 않아야 한다.
- `sizeToContent`는 실제 콘텐츠와 비동기 font/image 높이에 영향을 받는다. 최초 loading 완료 후 한 번의 예약 refresh로 부족한 사례는 소비자의 기존 `refreshLayout()` 호출 경계로 남긴다.
- Lazy Rendering은 실제 widget body mount 비용을 줄이지만 100개의 outer Grid item DOM 자체는 유지한다. full virtualization은 별도 버전 범위다.
- 실 Safari는 자동화 계약 밖이므로 이번 구현 검증만으로 Safari 지원을 주장하지 않는다.

## 12. 참고 자료

- GridStack API: <https://gridstackjs.com/doc/html/classes/GridStack.html>
- GridStack options: <https://gridstackjs.com/doc/html/interfaces/GridStackOptions.html>
- GridStack two grids example: <https://gridstackjs.com/demo/two.html>
- GridStack lazy loading example: <https://gridstackjs.com/demo/lazy_load.html>
- WCAG 2.2 Dragging Movements: <https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements>

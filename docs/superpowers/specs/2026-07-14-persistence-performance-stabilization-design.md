# Persistence and Performance Stabilization Design

## Purpose

`comins-grid-layout`의 dashboard state가 maximize/minimize 이후에도 JSON 저장과 복원을 거쳐 원래 레이아웃으로 돌아가도록 보장한다. 동시에 100개 이상 위젯과 반복 column 변경에서 browser resource가 누적되지 않는지 Chrome DevTools 기준으로 검증한다.

## Confirmed Decisions

- `serializeState()`는 maximize/minimize 복원에 필요한 정보를 포함하는 완전한 state snapshot이다.
- `serializeLayout()`은 layout 전달용 snapshot으로 유지한다.
- 100개 이상 위젯과 반복 column 변경은 기본 지원 범위다.
- 완료 판단은 기능 완료와 오류 없음뿐 아니라 Chrome DevTools에서 JS Heap, DOM Nodes, Event Listeners가 반복 동작 뒤에 누적되지 않는 것을 확인해야 한다.
- npm publish, dependency version policy, license, CI 작업은 안정화 완료 뒤 별도 범위로 처리한다.
- Codex 기본 설정은 `gpt-5.6-terra`와 `xhigh`를 유지한다. 메모리 누수 등 중대한 하자가 발견된 경우에만 Sol로 전환한다.

## Current Failure

현재 `DashboardStateSnapshot`은 `columns`와 `widgets`만 저장한다. maximize 또는 minimize 실행 전의 geometry는 internal `previousLayouts` map에만 존재한다. 따라서 maximize -> serialize -> rehydrate -> restore 순서에서는 restore가 원래 geometry를 찾지 못하고 최대화 또는 최소화된 geometry를 유지한다.

## Selected Persistence Design

### Snapshot Shape

`DashboardStateSnapshot<TData>`에 `previousLayouts`를 추가한다.

```ts
type DashboardStateSnapshot<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
};
```

`previousLayouts`는 widget ID를 key로 하고 maximize/minimize 직전의 normalized geometry를 value로 저장한다. widget의 public data에 restore 전용 field를 추가하지 않으므로 consumer data와 internal interaction state가 섞이지 않는다.

### Save and Restore Flow

```text
normal widget layout
  -> maximize/minimize
  -> previousLayouts[id] stores original geometry
  -> serializeState() stores widgets + previousLayouts
  -> createDashboardLayoutState(snapshot) restores both
  -> restoreWidget(id) applies previousLayouts[id]
```

`maximize -> minimize -> restore`의 기존 semantics는 유지한다. 이미 기억한 original geometry는 subsequent minimize가 덮어쓰지 않는다.

### Backward Compatibility

이 프로젝트는 아직 npm에 배포하지 않았지만, 이관 초기 snapshot을 안전하게 읽을 수 있도록 `createDashboardLayoutState()`는 `previousLayouts`가 없는 input을 빈 map으로 처리한다. 새 `serializeState()` output은 항상 `previousLayouts`를 포함한다.

Restore map entry는 key와 layout ID가 다르거나 대상 widget이 존재하지 않는 경우 복원에 사용하지 않는다. layout은 현재 column count 기준으로 기존 normalize path를 거친다.

## Performance and Leak Verification Design

### Automated Scenario

Playwright test는 다음을 수행한다.

1. stable ID와 non-overlapping geometry를 가진 100개 widget dashboard를 mount한다.
2. `1..12` columns를 왕복하는 sequence를 반복하고 최종적으로 시작 column으로 돌아온다.
3. representative widget의 drag와 resize를 포함한 interaction을 완료하고 idle state로 돌아온다.
4. console error, stale interaction class, duplicate widget DOM, layout commit failure가 없는지 확인한다.

자동 검증은 DOM consistency와 interaction completion을 보장한다. Chrome DevTools resource counter의 최종 합격 판단을 대신하지 않는다.

### Chrome DevTools Protocol

headful Chromium을 사용하여 다음 sequence를 세 번 반복한다.

1. page load 후 idle 상태와 garbage collection 이후의 baseline을 기록한다.
2. 100개 widget column cycle 및 interaction scenario를 실행한다.
3. 시작 column, idle state, garbage collection 이후의 counters를 기록한다.

기록 대상은 Chrome DevTools Performance Monitor의 JS Heap, DOM Nodes, Event Listeners다. 자동 수집은 CDP `Performance.getMetrics`와 `Memory.getDOMCounters`를 보조 증거로 사용한다.

### Pass Criteria

- 세 cycle 모두 interaction 완료 뒤 console error가 없다.
- 시작 상태로 복귀했을 때 DOM Nodes와 Event Listeners가 baseline보다 누적 증가하지 않는다.
- garbage collection 이후의 JS Heap은 cycle마다 계속 증가하지 않고 baseline 수준으로 안정화된다.
- Chrome DevTools에서 기록한 baseline, 각 cycle result, 최종 판정을 `reports/YYYY-MM-DD.md`에 남긴다.

절대 숫자는 Chrome과 실행 환경에 따라 달라지므로 pass/fail은 동일 browser session의 baseline 대비 변화와 반복 cycle 간 누적 여부로 판단한다.

## Implementation Boundaries

- `src/core/types.ts`, `src/core/layout-state.ts`, `src/core/use-dashboard-grid.ts`만 persistence contract 변경 대상으로 한다.
- `src/gridstack/adapter.ts`의 GridStack boundary는 유지한다. performance test에서 결함이 확인된 경우에만 최소 수정한다.
- `test/vitest/layout-state.test.ts`에서 persistence round-trip TDD를 먼저 수행한다.
- browser resource scenario는 `test/playwright/specs/dashboard-grid.spec.ts` 또는 별도 performance spec에 작성한다.
- `README.md`, `docs/03-component-api-draft.md`, `docs/04-verification-strategy.md`, `docs/05-open-questions.md`은 확정된 contract에 맞춰 업데이트한다.

## Explicitly Out of Scope

- npm publish와 release automation
- dependency version policy와 license 추가
- mobile drag/resize의 미지원 browser test 확대
- keyboard move/resize API
- Codex 전역 또는 프로젝트 model configuration 변경

## Risks and Controls

| Risk | Control |
| --- | --- |
| snapshot field 추가로 기존 consumer snapshot load가 깨짐 | missing `previousLayouts`를 empty map으로 받아들인다. |
| current state와 persistence data가 서로 다른 widget ID를 참조함 | rehydrate 시 target widget과 key/ID match를 확인하고 무효 entry를 사용하지 않는다. |
| Chromium counter가 실행 환경마다 다른 절대값을 보임 | 동일 browser session의 baseline-return sequence를 세 번 반복해 누적 여부로 판정한다. |
| adapter 수정이 drag/resize parity를 회귀시킴 | adapter가 실제 결함 지점일 때만 수정하고 focused Playwright 뒤 `npm run verify:full`을 실행한다. |

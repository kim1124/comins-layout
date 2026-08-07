# Playground Consolidation And Column Layout Persistence Design

## Goal

`comins-grid-layout` Playground를 큰 dashboard를 직접 조작하기 쉬운 세 개의
화면으로 통합하고, 각 column 수에 독립적인 widget geometry를 저장하고 복원하는
공개 상태 계약을 추가한다.

이 설계는 로컬 구현과 검증 계획 수립을 승인한다. 원격 push, pull request, merge,
npm publish, tag, GitHub Release는 각각 별도 승인을 받아야 한다.

## Confirmed Decisions

- Examples 메뉴는 `위젯`, `레이아웃`, `고급 예제` 세 화면으로 통합한다.
- 각 화면은 상단에 짧은 설명과 조작 controls를 두고, 하단에는 하나의 전체 폭
  `DashboardGrid`를 둔다.
- `위젯` 화면은 CRUD, 이동 잠금, 리사이즈 잠금, 전체 잠금을 하나의 Grid에서
  보여준다.
- `레이아웃` 화면은 CRUD, runtime columns `1`–`12`, 저장/복원, 자동 정렬,
  빈 공간 채우기를 하나의 Grid에서 보여준다.
- `고급 예제` 화면은 typed external drop target, column별 layout 저장/복원,
  responsive breakpoints, GridStack compact modes, float와 read-only engine 조회를
  보여준다.
- column별 layout 저장은 Playground 전용 구현이 아니라 패키지의 공개 serializable
  state 기능으로 제공한다.
- 기존 단일 active-layout snapshot은 하위 호환 입력으로 계속 읽는다.
- GridStack raw CRUD, `removable`, nested grids, inter-grid 이동은 controlled React
  source of truth와 충돌할 수 있으므로 이번 범위에 포함하지 않는다.
- 기존에 정상 동작하던 CRUD, drag, resize, maximize/minimize/restore, column 변경,
  저장/복원, 잠금, 외부 drop, touch, resource stability는 모두 회귀 검증한다.

## Verified Starting State

- 계획 기준은 GitHub `main`의 `bc42e5cdc06e006c53dfec5f53b9b4568f23afb3`이다.
- 패키지와 lockfile은 `comins-grid-layout@0.1.6`, GridStack `13.0.1`을 사용한다.
- 현재 `/examples/layout`은 저장/복원, columns, 전체 잠금을 각각 별도 live Grid로
  렌더링하여 실제 dashboard 영역이 작고 동일 기능을 한 화면에서 비교하기 어렵다.
- 현재 `/examples/widget`은 CRUD와 widget별 interaction lock을 하나의 Grid에서
  제공하지만, `/examples/crud`가 별도 메뉴로 중복된다.
- 현재 `/examples/complete`는 외부 drop target과 핵심 기능을 한 화면에 제공하지만,
  고급 기능 설명과 column별 persistence는 없다.
- `fitDashboardWidgetsToColumns()`는 동일 `y`를 가진 widget을 한 행으로 보고 빈
  horizontal column을 균등하게 재분배한다. 이미 한 행이 모든 column을 덮으면
  geometry를 변경하지 않는 unit test가 존재한다.
- 현재 column 예제 fixture는 높이와 빈 공간이 불규칙한 12개 widget으로 구성되어,
  빈 공간 채우기 전에 큰 재배치가 발생하는 것처럼 보인다.
- `DashboardGridHandle`은 `getGridStack()`, `refresh()`, `compact()`,
  `commitLayout()`을 제공한다.
- `externalDropTargets`와 `onWidgetExternalDrop`은 typed, non-destructive callback이며
  consumer가 `removeWidget()` 호출 여부를 결정한다.
- 현재 `DashboardStateSnapshot`은 active `columns`, `widgets`, `previousLayouts`만
  저장한다. column별 geometry cache는 아직 공개 상태에 없다.

## Considered Approaches

### Keep The Existing Docs Shell And Merge Only Components

기존 sidebar와 article 구조를 유지한 채 live examples만 합치는 방법이다. Route와
CSS 변경 위험은 작지만 desktop에서 260px sidebar가 계속 Grid 폭을 차지하고,
문서 header와 code block이 실제 조작 영역보다 앞에 남는다. 큰 dashboard를 우선하는
요구를 충분히 해결하지 못한다.

### One `/playground` Route With Internal Tabs

모든 예제를 한 route에 두고 client-side tabs로 전환하는 방법이다. 화면 공간은 크게
확보할 수 있지만 기능별 deep link와 browser test 격리가 약해지고, 기존 route와 검색
결과를 모두 특별 처리해야 한다.

### Dedicated Example Workspace With Three Routes

선택한 접근이다. Docs와 API는 기존 문서 shell을 유지하고, `/examples/*`만 compact
top navigation과 full-width content를 사용하는 example workspace로 렌더링한다.
`위젯`, `레이아웃`, `고급 예제`는 각각 하나의 state owner와 하나의 Grid를 가져
화면 크기, deep link, test isolation을 모두 확보한다.

## Information Architecture

### Routes

| Route | 역할 |
| --- | --- |
| `/examples/widget` | Widget CRUD와 개별 interaction control |
| `/examples/layout` | Layout CRUD, columns, persistence, arrange/fill |
| `/examples/advanced` | Column persistence, responsive, external drop, GridStack handle |
| `/docs/getting-started` | 설치와 기본 사용 문서, 기존 shell 유지 |
| `/api` | Props, commands, events, handle reference, 기존 shell 유지 |

Compatibility redirects:

- `/` -> `/examples/widget`
- `/examples/crud` -> `/examples/widget`
- `/examples/complete` -> `/examples/advanced`
- `/examples/basic` -> `/docs/getting-started`
- unknown route -> `/examples/widget`

기존 route를 redirect로 남겨 README, browser bookmark, 기존 테스트와 외부 링크가
404가 되지 않도록 한다.

### Example Workspace Layout

각 example route는 다음 vertical order를 사용한다.

1. compact examples navigation
2. page title과 1~2문장의 동작 설명
3. 기능별로 구분된 control groups와 status region
4. 고급 외부 drop target처럼 Grid 밖에 있어야 하는 consumer content
5. 전체 폭 `DashboardGrid`

Desktop에서는 control groups를 wrap 가능한 horizontal deck으로 표시한다. 고급
화면의 300x300 external drop target은 control 설명 옆 top workspace에 배치하고,
Grid는 그 아래에서 전체 폭을 사용한다. 좁은 viewport에서는 모든 영역을 한 column로
쌓고 horizontal overflow를 만들지 않는다.

Docs/API sidebar는 문서 route에서만 유지한다. Example route에서는 sidebar를
제거하여 Grid가 viewport의 가용 폭을 사용하도록 한다.

## Public Column Layout Persistence Contract

### New Types

공개 상태는 active layout과 column cache를 함께 직렬화한다.

```ts
export type DashboardColumnLayoutSnapshot = {
  widgets: DashboardWidgetLayout[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
};

export type DashboardLayoutsByColumn = Partial<
  Record<DashboardColumnCount, DashboardColumnLayoutSnapshot>
>;

export type DashboardStateSnapshot<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn: DashboardLayoutsByColumn;
};
```

`DashboardStateSnapshotInput`의 `layoutsByColumn`은 optional이다. JSON object의
numeric column key는 문자열로 직렬화되지만 JavaScript numeric property access와
동일하게 동작한다. 지원 범위 밖 key는 복원 시 무시한다.

`DashboardLayoutState`도 normalized `layoutsByColumn`을 가진다. active top-level
`widgets`와 `previousLayouts`는 기존 API 호환을 위해 유지하며, active column entry와
항상 동일한 geometry를 나타낸다.

### Serialization And Backward Compatibility

- `serializeState()`은 active state와 모든 known column entries를 반환한다.
- `serializeLayout()`은 기존처럼 active column과 geometry만 반환한다. 반환 타입과
  의미를 확장하지 않는다.
- legacy input에 `layoutsByColumn`이 없으면 active top-level geometry로 현재 column
  entry 하나를 생성한다.
- input에 active column cache와 top-level state가 모두 있으면 top-level active state를
  authoritative source로 사용하고 active cache entry를 다시 만든다.
- unknown widget ID, widget ID와 layout ID가 다른 entry, 지원 범위 밖 column, 유효하지
  않은 restore entry는 무시한다. 좌표와 크기는 해당 column 기준으로 normalize한다.
- 새 output은 항상 `layoutsByColumn`을 포함한다.

### Column Transition

`setColumns(nextColumns)`은 하나의 reducer transition으로 처리한다.

1. 현재 active `widgets` geometry와 `previousLayouts`를 source column entry에 저장한다.
2. target column cache가 있으면 widget ID를 기준으로 cached geometry를 복원한다.
3. target cache가 없으면 기존 column 전환 규칙으로 geometry를 normalize하고 최초
   target entry를 생성한다.
4. target cache에 없는 새 widget은 현재 geometry를 target column에 normalize한 뒤
   첫 available space에 deterministic하게 배치한다.
5. active top-level state와 target cache를 같은 transition에서 갱신한다.

같은 column으로 전환하면 참조와 geometry를 유지하는 no-op이다. responsive
breakpoint와 manual selector가 같은 column count를 사용하면 같은 cache entry를
공유한다.

### State Mutation Rules

- drag/resize commit과 `applyLayoutSnapshot()`은 snapshot의 active column entry를
  갱신한다.
- `updateWidgetLayout()`, maximize, minimize, restore, auto-arrange, fill은 active column
  entry만 갱신한다.
- `addWidget()`은 active column에 배치하고, 기존 cached columns에는 같은 ID의 layout을
  deterministic first-available 위치에 추가한다.
- `removeWidget()`은 모든 column entry와 모든 restore map에서 해당 ID를 제거한다.
- `clearWidgets()`은 widget 목록, restore maps, 모든 cached geometry를 비운다.
- data, title, locked, movable, resizable 같은 non-layout update는 column cache geometry를
  바꾸지 않는다.
- layout patch를 포함한 `updateWidget()`은 active column geometry를 갱신한다.
- `resetLayout()`은 hook 생성 시 보관한 initial state와 initial column cache로 되돌린다.
- full snapshot을 받는 `restoreLayout()`은 active state와 cache를 함께 교체한다.

Maximize/minimize restore geometry는 column별로 독립 저장한다. Maximized 또는
minimized 상태에서 column을 전환해도 target column의 `previousLayouts`를 사용하며,
원래 column으로 돌아왔을 때 그 column의 restore geometry가 보존되어야 한다.

### GridStack Boundary

React state가 column cache의 source of truth다. GridStack internal `cacheLayout()`을
직접 호출하거나 internal engine state를 snapshot contract로 노출하지 않는다.
Adapter는 active column을 `grid.save(false, false, undefined, activeColumn)`으로 읽고
기존 callback ordering으로 React state에 commit한다.

`DashboardGridHandle.getGridStack()`은 계속 complete public engine escape hatch를
제공하지만, column persistence 예제는 raw engine cache가 아니라
`useDashboardGrid()` state contract를 사용한다.

## Playground Page Design

### Widget Page

하나의 6-column Grid와 하나의 `useDashboardGrid()` owner를 사용한다.

Controls:

- Widget 추가 dialog: title, value, width, height
- 선택 widget 수정 dialog: title과 value를 `updateWidget()`으로 변경
- 선택 widget 삭제와 전체 삭제
- 선택 widget
- 이동 잠금
- 리사이즈 잠금
- 전체 잠금

선택 widget이 삭제되면 남은 첫 widget을 선택한다. widget이 없으면 selection과
interaction controls를 disable하고 명확한 status를 표시한다. 잠금 상태는 button
pressed state와 widget의 실제 drag/resize 가능 여부가 일치해야 한다.

### Layout Page

하나의 12-column Grid와 하나의 `useDashboardGrid()` owner를 사용한다. 초기 fixture는
각 행이 전체 12 column을 빈틈없이 덮도록 한다. 서로 다른 width는 유지하여 단순히
동일 크기 카드만 보여주지 않는다.

Controls:

- Widget CRUD: 추가, 선택, title/value 수정, 삭제, 전체 삭제
- column selector `1`–`12`
- active layout 저장/복원 JSON
- 전체 state 및 column caches 저장/복원 JSON
- 자동 정렬
- 빈 공간 채우기
- 초기화

빈 공간 채우기 acceptance flow:

1. 초기 full-row fixture에서 실행한다.
2. before/after active snapshot이 동일하고 status는 `빈 공간이 없어 변경하지 않았습니다.`를
   표시한다.
3. widget을 삭제하거나 이동하여 horizontal gap을 만든다.
4. 다시 실행하면 해당 row의 gap을 채운다.
5. 동일 상태에서 재실행하면 snapshot이 더 이상 바뀌지 않는다.

이 예제는 vertical compaction과 horizontal row fill을 구분해 설명한다.
`autoArrangeWidgets()`은 package ordering rule로 전체 geometry를 재배치하고,
`fitWidgetsToColumns()`은 동일 `y` row의 빈 horizontal columns만 채운다.

### Advanced Page

하나의 Grid를 중심으로 다음 control groups를 제공한다.

#### External Drop

- 기존 300x300 consumer-owned delete target을 유지한다.
- `externalDropTargets`와 `onWidgetExternalDrop`을 사용한다.
- callback이 `targetId === "trash"`일 때만 `removeWidget(widgetId)`를 호출한다.
- typed event status를 화면에 표시한다.

#### Column Layout Persistence

- 12-column geometry를 수정하고 저장한다.
- 6-column으로 전환해 서로 다른 geometry를 만든다.
- `12 -> 6 -> 12` 전환에서 각 column의 widget `x/y/w/h`가 복원되는 것을 보여준다.
- serialize된 `layoutsByColumn` JSON을 inspect하고 restore할 수 있다.

#### Responsive Breakpoints

- public `responsive` prop을 toggle한다.
- desktop/tablet/mobile width에 대응하는 active column count와 cache key를 status로
  표시한다.
- viewport 기반 자동 column 변경도 manual column과 동일한 persistence contract를
  사용한다.

#### GridStack Public Handle

- `compact("compact", true)`와 `compact("list", true)`를 각각 실행한다.
- `getGridStack()`으로 `getColumn()`, `getRow()`, `getFloat()` 같은 read-only engine
  정보를 표시한다.
- float toggle은 supported `engineOptions.float`을 우선 사용하고, controlled state
  commit을 유지한다.
- raw `addWidget()`, `removeWidget()`, `destroy()` 버튼은 제공하지 않는다.

## Official GridStack Example Coverage

GridStack official demos and API were reviewed at:

- https://gridstackjs.com/demo/index.html
- https://gridstackjs.com/demo/responsive_break.html
- https://gridstackjs.com/demo/serialization.html
- https://gridstackjs.com/demo/float.html
- https://gridstackjs.com/demo/static.html
- https://gridstackjs.com/demo/mobile.html
- https://gridstackjs.com/doc/html/classes/GridStack.html

Coverage decision:

| Official capability | Playground decision |
| --- | --- |
| CRUD, drag, resize | Widget/Layout pages에서 유지 |
| Manual columns | Layout page에서 유지 |
| Responsive breakpoints | Advanced page에 live example 추가 |
| Serialization | Layout과 Advanced page에서 active/full-state 구분 |
| Static/disable interaction | Widget lock controls로 유지 |
| Mobile touch | 별도 page 없이 같은 controls와 browser project로 검증 |
| Float | Advanced page toggle 추가 |
| Compact/list | Advanced page에서 public handle로 추가 |
| External drop/removal | Typed Comins callback 예제로 유지 |
| Size to content | API 문서에 유지, 이번 통합의 필수 live example에서는 제외 |
| RTL | API 문서에 유지, 별도 live example은 제외 |
| Nested/inter-grid | 현재 controlled package contract 밖이므로 제외 |
| Raw GridStack React CRUD | Comins controlled CRUD와 충돌하므로 제외 |

Size-to-content와 RTL은 이미 supported option이지만 이번 문제의 핵심인 화면 통합,
column persistence, arrange/fill 이해도에 직접 필요하지 않다. Advanced page controls가
과밀해지는 것을 막기 위해 별도 후속 후보로 남긴다.

## Component And File Boundaries

현재 `example/src/main.tsx`는 routing, docs data, API reference, fixtures, live components,
dialogs를 한 파일에서 담당한다. 이번 작업이 세 개의 stateful workspace를 추가하므로
Playground 부분만 책임별로 분리한다.

Planned boundaries:

- `example/src/main.tsx`: application root와 top-level route composition
- `example/src/docs/`: docs page data, search, article, API reference
- `example/src/playground/PlaygroundShell.tsx`: examples navigation과 full-width shell
- `example/src/playground/WidgetPlayground.tsx`: widget state와 controls
- `example/src/playground/LayoutPlayground.tsx`: layout state와 controls
- `example/src/playground/AdvancedPlayground.tsx`: advanced state와 controls
- `example/src/playground/components/`: reusable toolbar, CRUD dialog, JSON editor, status
- `example/src/playground/fixtures.ts`: deterministic widget fixtures
- `example/src/styles.css`: docs shell과 playground workspace layout

기존 Dialog와 Select UI components는 재사용한다. Runtime package source는 Playground
component를 import하지 않는다. 분리는 관련 영역에 한정하고 runtime package의
unrelated refactor는 하지 않는다.

## Status And Error Handling

- JSON parse 실패는 기존 state를 보존하고 status region에 오류를 표시한다.
- snapshot validation에서 일부 cache entry가 무효이면 무효 entry만 버리고 안전한
  active state를 복원한다. 입력 값을 오류 메시지에 그대로 출력하지 않는다.
- GridStack handle이 아직 초기화되지 않았으면 control은 no-op으로 끝내지 않고
  `GridStack이 아직 준비되지 않았습니다.` status를 표시한다.
- no-op fill과 no-op same-column transition은 성공 상태로 처리하되 geometry가 변경되지
  않았음을 명확히 표시한다.
- external drop이 configured target 밖에서 끝나면 callback과 삭제가 발생하지 않는다.

## Verification Design

### Unit And Contract Tests

- legacy single-layout snapshot이 active cache entry로 migration되는지 검증한다.
- `serializeState()` round-trip에서 multiple column entries와 restore maps를 보존한다.
- `12 -> 6 -> 12`에서 각 widget geometry가 복원되는지 검증한다.
- same-column transition이 state/geometry no-op인지 검증한다.
- add/remove/clear가 모든 cached columns에 일관되게 반영되는지 검증한다.
- active layout mutation이 다른 column cache를 변경하지 않는지 검증한다.
- maximize/minimize/restore를 column 전환 전후에 검증한다.
- malformed column keys, unknown IDs, mismatched layout IDs를 안전하게 무시한다.
- 기존 active-only `serializeLayout()` contract가 바뀌지 않았는지 검증한다.

### Focused Playground Browser Tests

- examples navigation이 세 메뉴만 보여주고 legacy routes가 redirect되는지 확인한다.
- 각 example route가 하나의 `DashboardGrid`만 렌더링하는지 확인한다.
- desktop에서 example route에 docs sidebar가 없고 Grid가 full-width 영역을 사용하는지
  확인한다.
- Widget page CRUD와 move/resize/full lock의 실제 interaction을 확인한다.
- Widget/Layout page에서 선택 widget의 title/value update가 Grid에 반영되는지 확인한다.
- Layout page에서 columns, JSON save/restore, CRUD, auto-arrange를 확인한다.
- full layout의 fill no-op, gap 생성 후 fill, second fill no-op을 geometry로 검증한다.
- Advanced page의 external drop event와 consumer deletion을 확인한다.
- `12 -> 6 -> 12` column-specific geometry 복원을 확인한다.
- responsive breakpoint가 active column status와 cache를 갱신하는지 확인한다.
- compact/list와 float가 controlled state callback을 유지하는지 확인한다.
- browser console error와 unhandled rejection이 없는지 확인한다.

### Regression And Full Gates

- existing desktop Chromium, Firefox, Playwright WebKit pointer scenarios
- mobile Chrome touch drag/resize and external drop
- maximize/minimize/restore and header double-click behavior
- boundary-exit drag/resize recovery
- 100-widget repeated-column resource stability gate
- security, license, typecheck, Vitest, build, exact public API checks

Focused unit and Chromium tests를 먼저 실행한 뒤, code 또는 test contract 변경이 끝나면
`npm run verify:full`을 한 번 실행한다. 변경된 package consumer contract는 consumer
smoke test와 package build로 확인한다.

## Acceptance Criteria

- Examples navigation에는 `위젯`, `레이아웃`, `고급 예제`만 표시된다.
- 각 example route는 상단 설명/controls와 하단 전체 폭 Grid 하나를 렌더링한다.
- 위젯과 레이아웃 화면 모두 widget CRUD를 제공한다.
- CRUD의 update는 선택 widget의 title/value를 변경하고 serialized state에도 보존한다.
- initial full layout에서 fill 실행 전후 snapshot이 동일하다.
- 실제 gap 이후 fill은 deterministic하게 gap을 제거하며 두 번째 실행은 no-op이다.
- 서로 다른 column 수에서 만든 widget geometry가 해당 column으로 돌아올 때 복원된다.
- legacy snapshot은 오류 없이 현재 column cache로 migration된다.
- 외부 drop callback과 삭제는 target drop에서만 발생한다.
- responsive, compact/list, float 예제가 controlled React state와 동기화된다.
- 기존 supported browser와 100-widget gate가 통과한다.
- public API와 snapshot 문서가 구현과 일치한다.

## Risks And Controls

| Risk | Control |
| --- | --- |
| active state와 column cache가 서로 달라짐 | 모든 layout reducer가 active entry를 같은 transition에서 갱신한다. |
| legacy JSON 복원이 깨짐 | optional input과 active-entry seeding을 unit test로 고정한다. |
| add/remove 후 오래된 column에 ghost widget이 남음 | CRUD를 모든 cached column에 전파하고 round-trip test를 추가한다. |
| maximize/minimize restore가 column을 넘나들며 깨짐 | column별 restore map과 전환 회귀 test를 추가한다. |
| Playground 통합 중 기능이 사라짐 | 기존 기능-to-new-route coverage matrix와 redirect tests를 유지한다. |
| raw GridStack mutation이 React state와 충돌함 | raw CRUD/lifecycle은 UI에서 제외하고 safe handle/query만 예제로 제공한다. |
| Advanced controls가 다시 Grid를 작게 만듦 | controls와 external target은 Grid 위에 두고 Grid를 full-width row로 분리한다. |
| 브라우저별 drag/resize 회귀 | focused Chromium 후 Firefox/WebKit/mobile과 full gate를 실행한다. |

## Explicitly Out Of Scope

- nested GridStack 또는 inter-grid drag
- raw GridStack CRUD를 Comins state command로 승격
- keyboard widget move/resize
- branded Safari certification
- size-to-content와 RTL의 별도 Playground page
- dependency upgrade
- npm version 변경과 release/publish
- provider, GitHub environment, npm account 설정 변경

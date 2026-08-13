# Playground 예제 확장 및 GridStack Handle 설계

## 배경

현재 문서형 Playground는 `/examples/widget`, `/examples/layout`,
`/examples/advanced`에서 각각 하나의 live demo를 제공한다. 문서와 예제를 함께
확인할 수 있다는 장점은 유지해야 하지만, Layout과 Advanced에 서로 다른 목적의
기능이 한 화면에 모여 있어 설명과 조작부가 길고 각 기능의 차이를 파악하기 어렵다.

이번 작업은 여러 Grid를 한 페이지에 합치지 않는다. 현재의 "한 경로에 하나의
live Grid" 구조를 유지하면서 예제 메뉴와 route를 늘리고, Widget·Layout·Advanced
각 예제의 목적을 분명하게 만든다. 또한 Comins가 보장하는 안전한 Handle과 공식
GridStack 인스턴스 접근을 구분해 사용자가 필요한 공식 API를 호출할 수 있게 한다.

## 목표

- 한·영 전환 토글을 검색 입력 왼쪽에 배치한다.
- 각 예제 route에는 하나의 live Grid만 렌더한다.
- Widget 예제를 추가·편집·사용자 정의 새로고침·삭제와 잠금 동작 중심으로
  단순화한다.
- Layout을 저장·복원, 동적 컬럼, 잠금·해제의 세 예제로 분리한다.
- Advanced를 엔진 옵션, 공식 API Handle, 전체 상태·컬럼 캐시, 이벤트, 외부
  드롭의 독립 예제로 분리한다.
- 공개 `DashboardGridHandle`에서 공식 GridStack 인스턴스를 읽을 수 있게 하되,
  React 제어 상태와 충돌할 수 있는 원본 API의 경계를 문서화한다.
- 한국어와 영어, 데스크톱과 모바일, 기존 public API의 하위 호환성을 유지한다.

## 비목표

- 여러 Grid 예제를 한 문서 article에 연속해서 배치하지 않는다.
- 기존 최대화·최소화·복원 상태 명령이나 public API를 제거하지 않는다.
- GridStack의 모든 API를 `DashboardGridHandle`의 직접 method로 재노출하지 않는다.
- Nested grid, lazy loading, cross-grid 이동, print 전용 layout, CSS transform,
  custom engine을 이번에 구현하지 않는다.
- 새 dependency, package version, publish, tag, Release, 원격 push 또는 PR을
  포함하지 않는다.
- 실제 Safari 검증을 Playwright WebKit 검증으로 대체했다고 표현하지 않는다.

## 검토한 접근

### 1. route를 늘리고 한 route에 하나의 Grid 유지 — 채택

기능별 route와 설명을 분리한다. 사용자가 현재 구조에서 익힌 탐색 방식을
유지하면서 페이지별 조작부와 세로 길이를 줄일 수 있다. 각 예제의 state와 test도
독립적으로 소유할 수 있다.

### 2. Layout과 Advanced의 모든 예제를 한 페이지에 통합 — 기각

메뉴 수는 줄지만 여러 Grid와 제어 영역이 한 article에 누적돼 세로 스크롤이
길어진다. 사용자가 명시적으로 현재 형태 유지를 선택했으므로 적용하지 않는다.

### 3. 공식 GridStack API를 Comins Handle method로 모두 proxy — 기각

호출은 짧아지지만 GridStack 버전과 public type이 강하게 결합된다. 원본 CRUD와
destroy까지 Comins가 안전하게 지원하는 것처럼 오해될 수 있다. 기존 안전 method는
유지하고 원본 instance를 명시적인 escape hatch로 제공하는 혼합 방식을 채택한다.

## 정보 구조와 route

Sidebar는 다음 계층으로 확장한다.

```text
예제
├─ 위젯                         /examples/widget
├─ 레이아웃
│  ├─ 저장·복원                /examples/layout
│  ├─ 동적 컬럼                /examples/layout/columns
│  └─ 잠금·해제                /examples/layout/lock
└─ 고급 예제
   ├─ 반응형·엔진 옵션          /examples/advanced
   ├─ 공식 API Handle          /examples/advanced/handle
   ├─ 전체 상태·컬럼 캐시       /examples/advanced/state
   ├─ 이벤트                   /examples/advanced/events
   └─ 외부 드롭                /examples/advanced/external-drop
```

- `/examples/layout`과 `/examples/advanced`는 기존 canonical URL을 유지한다.
- `/examples/crud`, `/examples/basic`, `/examples/complete` 등 현재 호환 route의
  redirect 계약을 유지한다.
- Sidebar는 중첩 항목을 들여쓰되 accordion state는 추가하지 않는다.
- 각 page metadata는 하나의 stable live example identifier만 가진다.
- route lifecycle owner는 `DocsShell` 한 곳에 유지하며 locale 변경으로 live
  component를 remount하지 않는다.
- 검색 index는 신규 한국어·영어 제목, 설명, route와 API token을 모두 포함한다.

## 상단 locale과 검색

상단 우측 제어 영역은 다음 순서를 유지한다.

```text
[한 | EN] [문서 검색 Input]
```

- locale은 두 개의 선택지가 있는 segmented toggle로 표시한다.
- 토글은 검색 입력의 바로 왼쪽에 위치한다.
- 좁은 화면에서도 locale과 검색을 하나의 제어 그룹으로 유지하고 검색 입력이
  남은 폭을 사용한다.
- locale 변경은 route, 검색 이외의 live example state, dialog draft와 Grid mount를
  초기화하지 않는다.
- 현재 locale 저장, invalid 저장값 복구 및 `<html lang>` 계약은 유지한다.

## 공통 토글 표현 계약

토글 상태를 설명하는 별도 visible status 문구를 추가하지 않는다. 토글 자체가
현재 상태와 다음 action을 모두 표현한다.

| 현재 상태 | 기본 예시 label | 표현 |
| --- | --- | --- |
| 해제 | `레이아웃 잠금` | 기본 배경색 |
| 활성 | `레이아웃 잠금 해제` | 활성 배경색과 대비되는 글자·아이콘 색상 |

- 이동, resize, 전체 및 layout 잠금에 같은 원칙을 적용한다.
- 버튼 label은 사용자가 클릭했을 때 수행될 action을 나타낸다.
- `aria-pressed`로 현재 boolean state를 제공한다.
- 성공 안내인 `잠금을 해제했습니다` 같은 status 문구는 제거한다.
- 오류, 비동기 loading 및 실제 event log처럼 별도 의미가 있는 정보만 status
  영역을 사용한다.

## Widget 예제

### 상단 제어 영역

하나의 toolbar에 다음 세 그룹을 순서대로 배치한다.

```text
[위젯 추가] [위젯 삭제] [전체 삭제]
|
[이동 잠금] [리사이즈 잠금] [전체 잠금]
|
위젯 3개
```

- 데스크톱과 iPad 폭에서는 한 row에 표시한다.
- 좁은 휴대전화에서는 개별 버튼이 아니라 세 그룹 단위로 줄바꿈한다.
- 선택용 Select는 제거한다. Widget을 클릭하면 선택되고 선택 테두리를 표시한다.
- `위젯 삭제`와 세 잠금 toggle은 선택한 Widget을 대상으로 한다.
- Widget이 없거나 선택 대상이 없으면 관련 action을 비활성화한다.
- 일반 성공 status와 Widget page의 state JSON 출력은 제거한다.

### Widget header action 확장

예제의 Widget header는 `수정`, `새로고침`, `삭제`로 구성한다. 최대화·최소화·복원
버튼은 이 예제에서만 제거하고 기존 library 기능은 유지한다.

이를 위해 `DashboardGridProps<TData>`에 선택적인 custom action renderer를
추가한다.

```ts
renderWidgetActions?: (widget: DashboardWidget<TData>) => ReactNode;
```

render 우선순위는 다음과 같다.

1. `showControls={false}`이면 header action 영역을 렌더하지 않는다.
2. `renderWidgetActions`가 있으면 반환한 action을 렌더한다.
3. 없으면 기존 최대화·최소화·복원·삭제 action을 그대로 렌더한다.

따라서 기존 consumer의 화면과 callback 계약은 변경되지 않는다. custom action
영역은 header double-click 및 drag 시작을 유발하지 않도록 현재 action container의
event 격리를 재사용한다.

### 추가와 편집

- `수정`은 해당 Widget의 dialog를 직접 연다. toolbar 선택 여부에 의존하지 않는다.
- 추가 dialog는 이름, content 값, 색상, 너비와 높이를 제공한다.
- 편집 dialog도 이름, content 값, 색상, 너비와 높이를 제공한다.
- 저장은 기존 `useDashboardGrid`의 `addWidget`, `updateWidget`과 layout update
  command를 사용한다.
- 사용자가 직접 입력한 이름과 값은 locale 변경으로 번역하거나 덮어쓰지 않는다.
- dialog validation, initial focus, Tab trap, Escape close와 opener focus 복원 계약을
  유지한다.

### 사용자 정의 새로고침

새로고침은 `DashboardGridHandle.refresh()`나 GridStack 갱신이 아니라 예제
consumer가 정의한 Widget content action이다.

1. 해당 Widget의 새로고침 버튼을 클릭한다.
2. 약 500ms 동안 Widget body에 Loader를 표시한다.
3. 완료되면 `contentRevision`을 증가시키고 content 표시값을 변경한다.

- 위치, 크기, 선택, 잠금과 색상은 변경하지 않는다.
- 처리 중인 Widget의 새로고침 버튼만 비활성화한다.
- 여러 Widget은 서로 독립적으로 새로고침할 수 있다.
- 삭제, route 이동 또는 unmount 시 해당 timer를 정리하고 stale 완료 callback을
  무시한다.
- Loader는 `role="status"`와 locale별 accessible name을 제공한다.

### fixture와 파스텔 팔레트

초기 fixture는 불규칙한 영업 데이터를 제거하고 `위젯 1`, `위젯 2`, `위젯 3`
형태로 구성한다. 영어에서는 `Widget 1`, `Widget 2`, `Widget 3`으로 표시한다.

```ts
type ExampleWidgetData = {
  value: string;
  colorKey: PastelColorKey;
  contentRevision: number;
  // 기존 locale/presentation metadata는 필요한 호환 범위에서 유지
};
```

- 6~8개의 밝고 충분한 대비를 가진 pastel palette를 example layer에 정의한다.
- 초기 색상은 Widget index로 순환 배정해 reload와 test에서 결정적이다.
- 추가·편집 dialog는 accessible radio 또는 동등한 단일 선택 palette를 제공한다.
- 색상은 Widget body에만 적용하고 header와 action 대비를 침해하지 않는다.
- 색상과 revision은 locale 전환 및 full-state 저장·복원 후 유지한다.
- 이전 example snapshot에 신규 field가 없으면 Widget index 기준 색상과 revision 0으로
  정규화한다. 지원하지 않는 field type은 기존 fail-closed restore 계약을 따른다.

## Layout 공통 fixture

세 Layout route는 12컬럼 기준으로 너비와 높이가 다른 Widget 6개를 공통 시작
fixture로 사용한다.

```text
위젯 1: 3x2   위젯 2: 5x2   위젯 3: 4x3
위젯 4: 6x2   위젯 5: 3x3   위젯 6: 3x2
```

fixture factory는 새 배열과 새 data object를 반환해 route 간 state를 공유하지
않는다. 각 route는 필요한 control과 command만 소유한다.

## Layout 저장·복원

`/examples/layout`은 다음 action만 한 toolbar에 표시한다.

```text
[위젯 추가] [전체 삭제]
|
[레이아웃 저장] [레이아웃 복원]
|
[자동 정렬] [공간 채우기]
|
[초기화]
```

- `레이아웃 저장`은 현재 column과 Widget 위치·크기 snapshot을 memory에 저장한다.
- 저장 후 geometry가 변경되면 `레이아웃 복원`이 저장 시점 배치를 복구한다.
- 유효한 저장값 전에는 복원 action을 비활성화한다.
- 자동 정렬과 공간 채우기는 실제 geometry를 변경한다.
- 초기화는 column, Widget 6개와 배치를 최초 상태로 복구한다.
- active layout JSON과 full-state JSON editor는 이 route에서 제거한다.
- 개별 Widget 삭제는 header action으로 제공하고, 미언급된 선택·편집·상태 control은
  표시하지 않는다.

## Layout 동적 컬럼

`/examples/layout/columns`는 1~12 column Select와 현재 live Grid만 제공한다.

- 초기 column은 12다.
- 사용자가 Select로 column을 직접 변경한다.
- column 축소 시 6개 Widget의 위치와 폭이 범위 안으로 보정되는 모습을 표시한다.
- 12→6→3→12 cycle 후에도 Widget 유실, 겹침 및 column 범위 초과가 없어야 한다.
- column cache의 내부 의미와 편집 기능은 Advanced state route에서 설명한다.
- Widget CRUD, layout 저장 및 state JSON처럼 column 학습에 불필요한 control은
  표시하지 않는다.

## Layout 잠금·해제

`/examples/layout/lock`은 12컬럼, Widget 6개와 하나의 toggle만 제공한다.

```text
[레이아웃 잠금]

잠금 후:
[레이아웃 잠금 해제]
```

- 별도 `상태: 편집 가능` 또는 `상태: 잠금` 문구는 표시하지 않는다.
- 잠금 시 이동, resize, 개별 삭제와 기타 layout mutation action을 비활성화한다.
- resize handle과 이동 가능 cursor도 표시하지 않는다.
- 해제하면 동일 기능이 다시 활성화된다.
- 하나의 `locked` state가 `editable`, `movable`, `resizable`과 custom header action의
  disabled 상태를 함께 결정한다.

## Advanced 반응형·엔진 옵션

`/examples/advanced`는 수동 column 변경과 responsive 변경의 차이를 먼저
설명한다.

- 동적 컬럼: 사용자가 Select로 column을 직접 변경
- 반응형: viewport breakpoint에 따라 column이 자동 변경
- 엔진 옵션: GridStack의 배치, 크기와 표현 방식을 변경

지원 중인 공개 surface를 다음 그룹으로 설명하고 실제 변경 가능한 control을
제공한다.

- 배치: column, `float`, `staticGrid`
- 크기: `cellHeight`, `margin`, `minRow`, `maxRow`
- 표현: `animate`, `rtl`, `sizeToContent`
- 반응형: breakpoint별 column

각 control 바로 옆이나 아래에 효과와 제약을 1~2줄로 표시한다. boolean option은
공통 toggle label·색상·`aria-pressed` 계약을 따른다. 상호 충돌하거나 재초기화가
필요한 option은 설명 없이 자동 조합하지 않고 유효한 조합만 적용한다.

## 공식 API Handle

`/examples/advanced/handle`은 Comins 보장 API와 공식 GridStack escape hatch를
분리해 보여준다.

```tsx
const layoutRef = useRef<DashboardGridHandle>(null);

<DashboardGrid ref={layoutRef} />

// Comins가 보장하는 제어 API
layoutRef.current?.refresh();
layoutRef.current?.compact();
layoutRef.current?.commitLayout();

// 공식 GridStack 인스턴스
layoutRef.current?.grid?.getColumn();
layoutRef.current?.grid?.getRow();
layoutRef.current?.grid?.cellHeight(80);
```

공개 Handle은 하위 호환 방식으로 확장한다.

```ts
export interface DashboardGridHandle {
  readonly grid: GridStack | null;
  getGridStack(): GridStack | null;
  refresh(): void;
  compact(layout?: CompactOptions, doSort?: boolean): DashboardLayoutSnapshot | null;
  commitLayout(): DashboardLayoutSnapshot | null;
}
```

- `getGridStack()`은 기존 consumer 호환을 위해 유지한다.
- 신규 문서에서는 `grid` property를 우선 안내한다.
- `grid`는 mount 전과 teardown 후 `null`이며 현재 adapter instance를 읽는다.
- 구현은 초기 `null`을 고정 저장하지 않고 getter 또는 동등한 live lookup을 사용한다.
- 조회 API와 안전한 engine option 변경만 live action으로 제공한다.
- `destroy()`, `addWidget()`, `removeWidget()`은 React 제어 state를 우회하므로 live
  button으로 제공하지 않는다. 호출 가능 여부와 controlled state divergence 위험은
  문서에서 명시한다.
- GridStack 전체 API를 Comins method로 proxy하거나 별도의 동작 보장을 추가하지
  않는다.

## 전체 상태·컬럼 캐시

`/examples/advanced/state`는 세 상태 개념을 다음처럼 구분한다.

| 구분 | 저장 내용 | 주요 용도 |
| --- | --- | --- |
| 레이아웃 snapshot | 현재 column, Widget 위치와 크기 | 현재 화면 배치 복원 |
| 전체 상태 | Widget data, 배치, 잠금, 이전 배치, column별 cache | 대시보드 세션 복원 |
| column cache | column별 위치와 크기 | 12→6→12에서 이전 12컬럼 배치 복원 |

- layout 저장·복원과 full-state 저장·복원을 독립 action으로 제공한다.
- 12→6→12 전환으로 column cache의 복구 결과를 직접 확인한다.
- desktop에서는 두 editor를 좌우로, 좁은 화면에서는 세로로 배치한다.
- JSON은 기본 접힘 상태로 두어 page 길이를 제한한다.
- invalid JSON 또는 invalid nested geometry/cache/data는 기존 Grid와 editor를
  보존하는 fail-closed 정책을 유지한다.
- 오류 copy는 원본 JSON이나 민감할 수 있는 입력값을 console에 다시 출력하지
  않는다.

## 이벤트

`/examples/advanced/events`는 현재 공개 callback의 발생 시점과 payload를 보여준다.

- `onColumnsChange`
- `onLayoutCommit`
- `onWidgetDragStart` / `onWidgetDragStop`
- `onWidgetResizeStart` / `onWidgetResizeStop`
- `onWidgetResizeFrame`

최근 event를 제한된 개수의 ring buffer로 표시하고 event 이름, Widget ID, column,
좌표와 크기 중 해당되는 값만 렌더한다. resize-frame처럼 빈도가 높은 event는
화면과 성능을 해치지 않도록 기존 scheduler 결과만 기록한다. event log는 기능의
핵심 출력이므로 일반 성공 status 제거 규칙의 대상이 아니다.

`onWidgetExternalDrop`은 외부 draggable 요소가 필요한 이벤트이므로 이 route에서
형식적으로 중복하지 않는다. 외부 드롭 전용 route가 payload log와 controlled
state 반영 결과를 함께 보여준다.

## 외부 드롭

`/examples/advanced/external-drop`은 기존 external drop demo를 독립 route로 옮긴다.

- 외부 요소가 controlled Widget으로 변환되는 과정
- 허용된 drop target selector 범위
- `onWidgetExternalDrop` payload와 consumer state update 책임
- 중복 ID와 invalid selector의 처리 방식

drop 이후 GridStack DOM에만 Widget을 남기지 않고 callback을 통해 React 제어
state에 추가하는 현재 계약을 유지한다. 최근 external-drop event payload도 이
route에서 제한된 log로 표시한다.

## GridStack 공식 기능 조사와 범위

조사 기준은 GridStack의 [공식 demo 목록](https://gridstackjs.com/demo/index.html),
[GridStackOptions 문서](https://gridstackjs.com/doc/html/interfaces/GridStackOptions.html),
[GridStack class API](https://gridstackjs.com/doc/html/classes/GridStack.html)다.

### 이번 예제에서 명확히 노출

- responsive column과 수동 column
- float, cell height, margin, RTL, static grid, animation, size-to-content
- min/max row
- serialization과 column cache
- lifecycle·interaction event
- external drop
- Comins Handle과 공식 GridStack instance 접근

### 공식 `grid` escape hatch로만 접근

공개 option 또는 controlled command로 보장하지 않는 원본 조회·option API는
`layoutRef.current.grid`에서 호출할 수 있다. React state를 직접 변경하는 원본
CRUD는 Comins 보장 범위가 아니다.

### 후속 public API 설계 후보

- nested/sub-grid
- lazy loading
- 두 Grid 사이 Widget 이동
- print 전용 layout
- CSS transform 환경
- custom engine
- 100개 이상 Widget을 조작하는 성능 전용 demo

이 후보들은 raw API 호출만으로 Playground에 추가하지 않는다. controlled state,
serialization, teardown, accessibility와 performance 계약을 별도 설계한 뒤 포함한다.

## 상태와 data flow

- 각 route는 독립 `useDashboardGrid` runtime을 소유한다.
- 공통 fixture factory는 immutable template에서 새 Widget/data object를 만든다.
- locale context는 표시 copy만 바꾸고 Widget ID, 사용자 입력, geometry와 cache key를
  변경하지 않는다.
- custom refresh state는 example component에만 존재하고 library의 `refreshKey`나
  Handle `refresh()`와 결합하지 않는다.
- public custom header action은 presentation slot일 뿐 Widget state mutation을
  자동 수행하지 않는다. consumer가 기존 command/callback을 명시적으로 호출한다.
- raw GridStack call 이후 controlled state 동기화는 자동 보장하지 않는다.

## 오류와 접근성

- toolbar는 기능 그룹별 accessible name을 가진다.
- nested navigation은 현재 위치를 `aria-current="page"`로 표시한다.
- icon-only Widget action은 Widget title과 action을 결합한 accessible name을
  제공한다.
- toggle은 변경되는 label, 시각적 활성 상태와 `aria-pressed`를 함께 제공한다.
- palette는 keyboard로 선택 가능한 단일 선택 control로 구성하고 색상만으로
  선택 상태를 전달하지 않는다.
- Loader는 해당 Widget 내부에서만 announcement한다.
- invalid state, unavailable Handle과 지원하지 않는 option 조합은 기존 state를
  유지하고 사용자가 수정할 수 있는 locale별 오류만 표시한다.

## 테스트 전략

모든 동작 변경은 실패하는 focused test를 먼저 추가한 뒤 최소 구현으로 통과시킨다.

### Unit 및 component

- 신규 route metadata, locale search index와 호환 redirect
- `renderWidgetActions`의 기본·override·hidden 우선순위
- `DashboardGridHandle.grid`의 mount·teardown live lookup과 기존 method 호환
- pastel assignment, refresh revision과 이전 snapshot 정규화
- invalid data/cache/geometry fail-closed 복원
- toggle label과 `aria-pressed`

### Browser focused

- 상단 locale toggle이 검색 바로 왼쪽에 있고 locale 전환이 Grid를 remount하지 않음
- 각 신규 route에 정확히 하나의 Grid만 존재함
- Widget 선택, 추가, 직접 편집, custom refresh Loader·content 변경, 삭제와 lock
- refresh 중 삭제·route 이동 후 stale state update가 없음
- layout 저장 후 geometry 변경과 복원, arrange/fill의 실제 geometry 변경
- 12→6→3→12 column cycle의 Widget 보존과 범위
- layout lock 중 drag·resize·delete 차단 및 unlock 후 재활성화
- engine option별 실제 GridStack state/geometry/DOM 효과
- Handle의 안전 method와 공식 조회·option API 실행
- layout snapshot, full state와 column cache의 서로 다른 복원 결과
- interaction event payload와 bounded log
- external drop이 controlled Widget을 실제 추가하고 해당 event를 기록함
- 한국어·영어 및 desktop·mobile toolbar containment

### 전체 검증

공개 type과 browser-visible GridStack 동작을 변경하므로 focused GREEN 후 다음을
수행한다.

- `npm run verify`
- 의미 있는 code/test 변경이 모두 반영된 상태에서 `npm run verify:full` 한 번
- 한국어·영어 desktop Chrome 수동 화면 확인
- 한국어·영어 mobile Chrome 수동 화면 확인
- Playwright Firefox와 WebKit 결과는 해당 engine 검증으로 보고하고 실제 Safari
  인증과 구분

전체 gate 실패는 제품, test 계약, 실행 환경으로 분류한 뒤 원인을 수정한다. 원인
확인 없이 full gate를 반복하지 않는다.

## 변경 경계와 전달

- `src/` 변경은 `DashboardGridHandle.grid`와 custom Widget header action slot의
  하위 호환 확장으로 제한한다.
- route, copy, fixture, example state, styles와 docs metadata는 `example/`에 둔다.
- 공개 API와 escape-hatch 경계를 README 및 API 문서에 반영한다.
- 새 dependency와 일괄 refactor를 추가하지 않는다.
- 의미 있는 구현 후 `reports/2026-08-14.md`에 변경 파일, RED/GREEN, 전체 gate,
  화면 확인과 잔여 위험을 기록한다.
- local commit 이후 push, PR, publish는 각각 별도 승인을 받는다.

## 완료 기준

- 사용자가 긴 단일 page 없이 Sidebar에서 목적별 예제를 선택할 수 있다.
- 모든 route는 하나의 live Grid와 해당 기능에 필요한 control만 표시한다.
- Widget header가 수정·사용자 정의 새로고침·삭제로 동작하고 새로고침이 layout을
  변경하지 않는다.
- Layout 세 예제의 저장·복원, column cycle, lock 계약이 실제 동작으로 검증된다.
- Advanced 설명만으로 수동 column, responsive option, full state, column cache,
  safe Handle과 raw GridStack API의 차이를 구분할 수 있다.
- 토글은 별도 상태 문구 없이 label, 색상과 `aria-pressed`로 상태를 전달한다.
- 기존 consumer가 신규 prop/property를 사용하지 않을 때 화면과 public API 동작이
  유지된다.
- 필수 package와 browser gate가 통과하고 미실행 또는 잔여 위험이 보고된다.

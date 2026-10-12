# Core와 Vue 3 (0.3.0)

이 문서는 0.3.0 소스 기준이다. npm 공개 여부는 레지스트리에서 별도로 확인한다. 기존 루트 React import는 유지한다. `/react`는 명시적인 React 진입점, `/vue`는 Vue `>=3.5.0 <4.0.0`, `/core`는 프레임워크 독립 상태 함수와 타입을 제공한다. Vanilla·Svelte 렌더러는 제공하지 않는다.

## 소유권과 진입점

| 진입점 | 책임 | 소비자 의존성 |
| --- | --- | --- |
| `comins-grid-layout/core` | 직렬화 상태·레이아웃·명령 타입·전송 정책 | DOM·프레임워크 불필요 |
| `comins-grid-layout` 또는 `/react` | React Hook·DOM 렌더러 | React와 React DOM 18 또는 19 |
| `comins-grid-layout/vue` | Vue Composable·SFC·슬롯 | Vue 3.5 이상, major 3 |
| `comins-grid-layout/styles.css` | 공통 시각 스타일 | 브라우저 |

Core는 reducer, mutation queue, resize scheduler, option mapper, GridStack handle을 공개하지 않는다. Browser lifecycle과 엔진 연결은 내부 공통 계층이다. 이 분리가 공개 Vanilla 렌더러 제공을 의미하지 않는다. GridStack은 패키지 의존성이므로 설치 파일은 존재할 수 있지만 `/core` import는 GridStack·React·Vue를 로드하지 않는다. React/Vue는 선택적 peer이므로 사용하는 프레임워크만 설치한다.

```ts
import { createDashboardLayoutState, serializeDashboardState } from 'comins-grid-layout/core';

const state = createDashboardLayoutState({ widgets: [], columns: 12 });
const snapshot = serializeDashboardState(state);
```

## Vue 설치와 최소 controlled Grid

이 버전이 공개된 후 `comins-grid-layout`과 `vue@^3.5`를 설치한다. 공개 전에는 로컬 빌드 산출물을 사용한다. 이 소스 문서만으로 npm 공개 여부를 판단하지 않는다. 브라우저 진입점에서 두 CSS를 한 번씩 가져온다.

```ts
import 'gridstack/dist/gridstack.min.css';
import 'comins-grid-layout/styles.css';
```

```vue
<script setup lang="ts">
import { DashboardGrid, useDashboardGrid } from 'comins-grid-layout/vue';

const { widgets, columns, commands, refreshVersion } = useDashboardGrid<{ value: number }>({
  initialWidgets: [{
    id: 'revenue', title: 'Revenue', data: { value: 100 },
    layout: { id: 'revenue', x: 0, y: 0, w: 4, h: 3 },
  }],
});
</script>

<template>
  <DashboardGrid :widgets="widgets" :columns="columns" :refresh-key="refreshVersion"
    @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns"
    @maximize-widget="commands.maximizeWidget" @minimize-widget="commands.minimizeWidget"
    @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget">
    <template #default="{ widget }">{{ widget.data?.value }}</template>
  </DashboardGrid>
</template>
```

렌더러는 소비자의 위젯 배열을 직접 바꾸지 않는다. `layoutCommit`과 액션 이벤트를 명령에 연결하지 않으면 제스처·버튼 결과가 controlled 상태에 저장되지 않는다. 반응형 컬럼 변경은 `columnsChange`로 연결한다. 슬롯은 동일한 제네릭 `DashboardWidget<TData>`를 받고, `actions` 슬롯은 기본 버튼을 대체한다. 초기 옵션은 한 번만 읽으며 `initialWidgets`의 후속 변경은 제어 입력이 아니다. 이후에는 명령을 사용한다. `state`, `widgets`, `columns`, `refreshVersion`은 읽기 전용 computed ref이고 명령은 동일한 참조로 최신 상태를 사용한다. 스크립트에서는 `.value`, 템플릿에서는 최상위 ref 자동 해제를 사용한다.

`onLayoutMutation`은 Vue 렌더 flush 뒤 순서대로 실행하며 각 변경의 snapshot을 전달한다. 콜백 안에서 실행한 명령은 후속 flush로 전달한다. scope가 종료되면 대기 중 전달을 중단한다. 콜백 오류는 Vue `app.config.errorHandler`로 처리한다. 독립 scope의 미처리 예외 복구는 보장하지 않는다.

Composable 대신 소비자가 직접 관리하는 `ref`/`reactive` 배열·옵션을 props로 전달할 수도 있다. 이 경우 배열의 `push`/`splice`, 위젯 배치 필드, 엔진·반응형·외부 삭제 영역 설정의 제자리 변경은 렌더 flush 뒤 함께 동기화된다. `useDashboardDragIn`의 preview/drag 설정도 변경 시 재연결된다. 위젯 `data` 내부는 엔진 동기화를 위해 깊게 감시하지 않는다. 이는 Composable 반환 상태를 직접 수정해도 된다는 의미가 아니며, Composable 상태 변경에는 명령을 사용한다.

## React와 Vue 대응

| React | Vue |
| --- | --- |
| `renderWidget(widget)` | `#default="{ widget }"` |
| `renderWidgetActions(widget)` | `#actions="{ widget }"` |
| `onLayoutCommit(snapshot)` | `@layout-commit="commands.applyLayoutSnapshot"` |
| `onWidgetLayoutChange(id, layout)` | 인수 2개를 받는 `@widget-layout-change` |
| `onColumnsChange(columns)` | `@columns-change="commands.setColumns"` |
| `onMaximizeWidget` / `onMinimizeWidget` / `onRestoreWidget` / `onRemoveWidget` | `@maximize-widget` / `@minimize-widget` / `@restore-widget` / `@remove-widget` |
| `onWidgetDropRequest(request)` | `@widget-drop-request` — 허용된 전송 결과를 양쪽 상태에 적용 |
| `onWidgetExternalDrop(event)` | `@widget-external-drop` — 소비자가 삭제 여부 결정 |
| `onWidgetResizeFrame(event)` | `@widget-resize-frame` — 스케줄된 콘텐츠 크기 알림 |

그 외 emit은 `beforeMove`, `move`, `afterMove`, `beforeResize`, `resize`, `afterResize`, `beforeTitleDoubleClick`, `titleDoubleClick`, `afterTitleDoubleClick`이다. 템플릿에서는 `@after-resize`와 같은 kebab-case를 쓴다. 이벤트는 알림이며 취소·권한 veto가 아니다. 공통 props는 기존 의미를 유지한다: `widgets`, `columns`, `editable`, `movable`, `resizable`, `engineOptions`, `responsive`, `externalDropTargets`, `gridId`, `acceptExternalWidgets`, `gridTransferMode`, `refreshKey`, `showControls`, `lazyRenderWidget`, `actionLabels`.

## 수명주기와 고급 기능

- Composable은 setup 또는 활성 effect scope 안에서 생성한다. `useDashboardDragIn`은 팔레트에 연결할 element ref를 반환하며 `createWidget`은 드래그 시작 시 최신 상태를 읽는다.
- 컴포넌트 ref는 `DashboardGridHandle`의 `getGridStack`, `getColumnCount`, `getRowCount`, `getFloat`, `isAreaEmpty`, `willItFit`, `refresh`, `compact`, `commitLayout`을 제공한다. 연결 전 조회는 `null`이다. GridStack 직접 접근은 고급 우회 경로이지 Core API가 아니다.
- KeepAlive 비활성화 시 엔진·drag-in·observer·예약 작업을 정리하고 복귀 시 한 번 연결한다. unmount는 대기 중 비동기 연결도 취소한다. `rtl`·`sizeToContent` 변경은 엔진 재연결, 나머지 옵션은 기존 연결 동기화다.
- 지연 렌더링은 배치 공간을 먼저 만들고 가시 영역에 진입한 슬롯 콘텐츠를 한 번 렌더링한다. 가상화나 화면 밖 콘텐츠 해제가 아니다. 내용 크기가 바뀌어 재측정이 필요하면 `commands.refreshLayout()`을 호출한다.
- 상태·ID·중복 ID 거부·이동/복사·직렬화 정책은 React/Vue가 같은 Core를 사용한다. Nested Grid는 부모와 자식의 상태 소유자를 분리한다.

이번 범위는 브라우저 CSR이다. SSR·hydration 보장, Nuxt 통합, Vanilla/Svelte 렌더러, 위젯별 teleport, GridStack 임의 DOM 소유는 지원 계약이 아니다.

## 실행 예제

checkout에서 `npm run dev`를 실행한다. 공통 Playground의 `/examples/widget/basic/react`, `/examples/widget/basic/vue`에서 React/Vue 탭을 선택한다. 메뉴·언어·관련 API·코드 패널을 공유하며 기존 22개 예제의 초기 위젯·배치·컬럼·셀 높이·주요 옵션을 통일한다. 프레임워크/예제 전환은 상태를 초기화하고 이전 엔진을 정리한다. 언어 변경은 현재 상태를 유지한다. URL 공유·새로고침·뒤로 가기가 가능하고 기존 React 주소도 유지한다.

코드 보기는 현재 실행한 TSX/SFC와 보조 파일을 표시한다. 공개 패키지 import로 바꿔 표시한 다중 파일 Vite 예제이며 한 파일만으로 실행된다고 보장하지 않는다. `/api`에서도 React/Vue 선택에 따라 상세 콜백·emit·slot 표기와 실제 코드·실행 예제가 함께 바뀐다. `onLayoutMutation`은 Vue에서도 Composable 옵션 콜백으로 유지한다. Vue 전용 React 호환 alias를 표시하지 않는다.

기존 `/vue.html?example=widget/basic&locale=ko` 링크는 공통 Vue 화면으로 연결한다. `embed=1`은 API 문서 안의 독립 Vue root를 위한 내부 진입점이다. 미등록 ID는 거부한다. `npm run build:examples`로 HTML 두 개를 빌드하고 `npm run preview:examples`로 production 결과를 확인한다. 기존 README GIF는 React 촬영본이며 Vue 검증 증거가 아니다.

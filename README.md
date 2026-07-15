# comins-grid-layout

`comins-grid-layout`는 React 애플리케이션에서 dashboard widget layout을 구성하기 위한 GridStack 기반 package다. 런타임은 Next.js API에 의존하지 않고 React component와 serializable layout state 중심으로 동작한다.

이 저장소는 기능 구현, 문서화, 검증, 작업 보고, 릴리스 준비의 단일 기준이다.

## 패키지 상태

- 현재 `package.json` 기준 독립 npm package metadata를 가진 standalone package다.
- GitHub 원격 저장소는 [`kim1124/comins-layout`](https://github.com/kim1124/comins-layout)이며, 기본 반영 브랜치는 `main`이다.
- 로컬 개발 기준 경로는 `<repo-root>`이다.
- React와 React DOM은 peer dependency로 유지한다.
- `gridstack`은 runtime dependency이며, consumer는 GridStack CSS와 package CSS를 함께 import해야 한다.
- npm 배포 전에는 files, dependency, browser verification 상태를 별도 검토해야 한다.

## Runtime Boundary

`comins-grid-layout`는 GridStack browser interaction을 사용하므로 SSR 애플리케이션에서는 client boundary 안에서 사용한다. package source는 network request, remote asset load, telemetry, error report를 수행하지 않는다.

## 지원 범위

| Surface | Support |
| --- | --- |
| React | `>=18.0.0 <20.0.0` |
| React DOM | `>=18.0.0 <20.0.0` |
| Chrome and Edge | 현재 stable Chromium 기반 release |
| 자동 browser gate | Playwright에 포함된 Chromium |
| Firefox and Safari | Firefox 및 WebKit project 추가 전까지 지원 계약에서 제외 |
| SSR | client boundary 필수; server rendering은 현재 미지원 |

## 저장소 운영 기준

- 패키지명은 `comins-grid-layout`이고, GitHub 저장소명은 `comins-layout`이다.
- 기능 구현과 이슈 수정은 이 저장소에서만 수행한다. 다른 저장소와의 소스 동기화 또는 동시 릴리스는 명시 요청이 있을 때만 검토한다.
- 작업 전에는 `README.md`, `GUIDE.md`, `docs/README.md`와 경로별 `AGENTS.md`를 확인한다.
- substantial 변경은 `reports/YYYY-MM-DD.md`에 작업 내용과 실제 검증 결과를 기록한다.

## 구현된 기능

- `DashboardGrid` React component
- `useDashboardGrid` state/command hook
- widget create, update, remove, clear
- maximize, minimize, restore
- runtime column count `1..12`
- auto arrange와 fit-to-columns helper
- movable/resizable option
- scheduled widget resize frame callback
- serializable layout/state snapshot
- GridStack adapter boundary
- package stylesheet export

## Public API

| Import | 설명 |
| --- | --- |
| `comins-grid-layout` | `DashboardGrid`, `useDashboardGrid`, layout/state helpers, option mapper, public types |
| `comins-grid-layout/styles.css` | dashboard grid stylesheet |
| `cominsGridLayoutPackage` | package 식별 상수 |

## 설치

```bash
npm install comins-grid-layout react react-dom
```

`gridstack` stylesheet을 package stylesheet보다 먼저 import한다.

```ts
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";
```

## 빠른 시작

```tsx
import { DashboardGrid, useDashboardGrid, type DashboardWidget } from "comins-grid-layout";
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";

type MetricData = {
  description: string;
  value: string;
};

const initialWidgets: DashboardWidget<MetricData>[] = [
  {
    id: "sales",
    title: "Sales",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { value: "$128k", description: "MRR" },
  },
];

export function DashboardPage() {
  const dashboard = useDashboardGrid<MetricData>({
    initialColumns: 6,
    initialWidgets,
  });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      onMaximizeWidget={dashboard.commands.maximizeWidget}
      onMinimizeWidget={dashboard.commands.minimizeWidget}
      onRemoveWidget={dashboard.commands.removeWidget}
      onRestoreWidget={dashboard.commands.restoreWidget}
      onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
      refreshKey={dashboard.refreshVersion}
      renderWidget={(widget) => <strong>{widget.data?.value}</strong>}
      widgets={dashboard.widgets}
    />
  );
}
```

## 주요 command

`useDashboardGrid`는 serializable dashboard state와 command helper를 제공한다.

- `addWidget(widget)`
- `updateWidget(id, patch)`
- `updateWidgetLayout(id, patch)`
- `removeWidget(id)`
- `clearWidgets()`
- `maximizeWidget(id)`
- `minimizeWidget(id)`
- `restoreWidget(id)`
- `autoArrangeWidgets()`
- `fitWidgetsToColumns()`
- `setColumns(columns)`
- `resetLayout(snapshot?)`
- `restoreLayout(snapshot)`
- `refreshLayout()`
- `serializeLayout()`
- `serializeState()`

## Snapshot persistence

- `serializeState()`는 `columns`, 전체 `widgets`, `previousLayouts`를 저장한다. 따라서 최대화 또는 최소화된 widget도 JSON 복원 뒤 `restoreWidget()`으로 원래 geometry를 되돌릴 수 있다.
- `serializeLayout()`는 `columns`와 widget geometry만 저장한다. pending maximize/minimize restore geometry는 포함하지 않으므로, 해당 상태를 보존해야 하면 `serializeState()`를 사용한다.
- 이전 저장본처럼 `previousLayouts`가 없는 snapshot은 빈 restore map으로 읽는다. TypeScript consumer는 optional restore map을 갖는 `DashboardStateSnapshotInput`을 `restoreLayout()`에 전달할 수 있다.

## Component API 요약

| Prop | 설명 |
| --- | --- |
| `widgets` | 렌더링할 widget model |
| `columns` | runtime column count, 기본 `12` |
| `editable` | 전체 edit interaction 활성/비활성 |
| `movable` | widget move 활성/비활성 |
| `resizable` | widget resize 활성/비활성 |
| `refreshKey` | adapter refresh 요청 |
| `showControls` | 기본 widget control 표시 |
| `renderWidget` | consumer-owned widget content 렌더링 |
| `onLayoutCommit` | committed layout snapshot 수신 |
| `onWidgetLayoutChange` | widget별 layout 변경 수신 |
| `onWidgetResizeFrame` | scheduled resize frame event 수신 |

## Styling

```ts
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";
```

Comins token과 package-local CSS variable을 override할 수 있다.

```css
:root {
  --comins-color-accent: #2563eb;
  --comins-radius-md: 0.5rem;
}

.comins-grid-layout {
  --comins-grid-layout-shadow: none;
}
```

## Playground

루트에서 실행:

```bash
npm run dev
```

기본 포트는 `6001`이다. Chromium unsafe port 이슈 때문에 `6000`은 사용하지 않는다.

포트 변경:

```bash
COMINS_GRID_LAYOUT_PORT=6002 npm run dev
```

## 검증

```bash
npm run lint
npm run test:run
npm run build
npm run test:e2e
npm run test:consumer
npm run verify
npm run verify:full
```

## Publishing note

`comins-grid-layout@0.1.0` bootstrap 배포가 완료되었다. 이후 배포는 `kim1124/comins-layout`, `publish.yml`, `npm` environment에 등록된 trusted publisher를 통해 진행한다.

배포 workflow는 `npm stage publish`만 허용하고 token publishing을 사용하지 않는다. 모든 staged version은 maintainer 승인을 거치며, workflow는 수동 실행만 허용하고 non-`main` ref와 version 불일치를 거부한다.

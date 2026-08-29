# 빠른 시작

처음 제어형 대시보드를 구성할 때 사용하는 가이드입니다. `DashboardGrid`는 GridStack 렌더링과 동기화를 담당하고, `useDashboardGrid`는 직렬화 가능한 React 상태를 소유합니다.

## 설치와 import

```bash
npm install comins-grid-layout react react-dom
```

클라이언트 번들에서 GridStack CSS와 패키지 CSS를 각각 한 번 import합니다.

```tsx
import {
  DashboardGrid,
  useDashboardGrid,
  type DashboardWidget,
} from "comins-grid-layout";
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";

type Metric = { label: string; value: string };

const initialWidgets: DashboardWidget<Metric>[] = [
  {
    id: "sales",
    title: "매출",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "월 매출", value: "₩128M" },
  },
];

export function DashboardPage() {
  const dashboard = useDashboardGrid({ initialColumns: 12, initialWidgets });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      refreshKey={dashboard.refreshVersion}
      widgets={dashboard.widgets}
      onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
      renderWidget={(widget) => (
        <div><span>{widget.data?.label}</span><strong>{widget.data?.value}</strong></div>
      )}
    />
  );
}
```

`widgets`가 최종 상태입니다. 그리드 조작이 끝나면 `onLayoutCommit`으로 스냅샷을 받고 `applyLayoutSnapshot`으로 다시 기록합니다. `columns`는 `1`부터 `12`까지 지원합니다. `refreshKey`에는 hook의 `refreshVersion`을 연결합니다.

`DashboardWidget`은 안정적인 `id`, React 소유 `data`, GridStack 좌표를 함께 보관합니다. 필수 layout 필드는 `id`, `x`, `y`, `w`, `h`이며 크기 제약 필드는 선택 사항입니다.

SSR 프레임워크에서는 client boundary 안에서 렌더링합니다. Next.js 전용 API는 사용하지 않습니다.

Playground는 `npm run dev` 실행 후 `/docs/getting-started` 또는 `/examples/widget/basic`에서 확인합니다.

다음 문서: [제어 상태와 CRUD](./02-controlled-state-and-crud.md).

# Quick Start

Use this guide to render a controlled dashboard for the first time. `DashboardGrid` renders and synchronizes GridStack, while `useDashboardGrid` owns serializable React state.

## Install and import

```bash
npm install comins-grid-layout react react-dom
```

Import GridStack CSS and the package CSS once in the client bundle.

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
    title: "Sales",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "Monthly revenue", value: "$128K" },
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
        <div>
          <span>{widget.data?.label}</span>
          <strong>{widget.data?.value}</strong>
        </div>
      )}
    />
  );
}
```

The `widgets` array is authoritative. A completed grid interaction produces a layout snapshot through `onLayoutCommit`; write it back with `applyLayoutSnapshot`. `columns` accepts `1` through `12`. `refreshKey` reconnects state changes that require an explicit engine refresh.

`DashboardWidget` keeps the stable `id`, React-owned `data`, and GridStack geometry together. The required layout fields are `id`, `x`, `y`, `w`, and `h`; optional constraints are `minW`, `minH`, `maxW`, and `maxH`.

For SSR frameworks, render the component inside a client boundary. The package does not use Next.js-only APIs.

Run the repository Playground with `npm run dev` and open `/docs/getting-started` or `/examples/widget/basic`.

Next: [Controlled State and CRUD](./02-controlled-state-and-crud.md).

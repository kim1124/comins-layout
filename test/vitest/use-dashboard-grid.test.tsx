import { renderToStaticMarkup } from "react-dom/server";
import { useDashboardGrid } from "../../src";
import type {
  DashboardStateSnapshot,
  DashboardWidget,
  UseDashboardGridOptions,
  UseDashboardGridResult,
} from "../../src";

function renderHookProbe<TData>(options: UseDashboardGridOptions<TData> = {}): {
  dashboard: UseDashboardGridResult<TData>;
  markup: string;
  serialized: DashboardStateSnapshot<TData>;
} {
  let dashboard: UseDashboardGridResult<TData> | undefined;

  function Probe() {
    dashboard = useDashboardGrid(options);
    return <output>{JSON.stringify(dashboard.commands.serializeState())}</output>;
  }

  const markup = renderToStaticMarkup(<Probe />);
  if (!dashboard) {
    throw new Error("The server-rendered hook probe did not produce a dashboard result.");
  }

  return {
    dashboard,
    markup,
    serialized: dashboard.commands.serializeState(),
  };
}

function serializedOutput(serialized: DashboardStateSnapshot): string {
  return JSON.stringify(serialized)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

describe("useDashboardGrid SSR serialization boundary", () => {
  it("serializes the default state with a 12-column cache entry", () => {
    const { dashboard, markup, serialized } = renderHookProbe();

    expect(serialized).toEqual({
      columns: 12,
      widgets: [],
      previousLayouts: {},
      layoutsByColumn: {
        12: {
          widgets: [],
          previousLayouts: {},
        },
      },
    });
    expect(markup).toBe(`<output>${serializedOutput(serialized)}</output>`);
    expect(dashboard.state.columns).toBe(serialized.columns);
    expect(dashboard.columns).toBe(serialized.columns);
    expect(dashboard.state.widgets).toEqual(serialized.widgets);
    expect(dashboard.state.previousLayouts).toEqual(serialized.previousLayouts);
    expect(dashboard.state.layoutsByColumn).toEqual(serialized.layoutsByColumn);
    expect(dashboard.widgets).toEqual(serialized.widgets);
    expect(serialized.layoutsByColumn[serialized.columns]?.widgets).toEqual(
      serialized.widgets.map((widget) => widget.layout),
    );
  });

  it("serializes explicit initial widgets into their active column cache without mutating the input", () => {
    const initialWidgets: DashboardWidget<{ value: number }>[] = [
      {
        id: "sales",
        title: "Sales",
        data: { value: 42 },
        layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 },
      },
    ];
    const originalWidgets = structuredClone(initialWidgets);

    const { dashboard, markup, serialized } = renderHookProbe({
      initialColumns: 6,
      initialWidgets,
    });

    expect(serialized).toEqual({
      columns: 6,
      widgets: originalWidgets,
      previousLayouts: {},
      layoutsByColumn: {
        6: {
          widgets: [{ id: "sales", x: 1, y: 2, w: 3, h: 2 }],
          previousLayouts: {},
        },
      },
    });
    expect(markup).toBe(`<output>${serializedOutput(serialized)}</output>`);
    expect(dashboard.state.columns).toBe(serialized.columns);
    expect(dashboard.columns).toBe(serialized.columns);
    expect(dashboard.state.widgets).toEqual(serialized.widgets);
    expect(dashboard.state.previousLayouts).toEqual(serialized.previousLayouts);
    expect(dashboard.state.layoutsByColumn).toEqual(serialized.layoutsByColumn);
    expect(dashboard.widgets).toEqual(serialized.widgets);
    expect(serialized.layoutsByColumn[serialized.columns]?.widgets).toEqual(
      serialized.widgets.map((widget) => widget.layout),
    );
    expect(initialWidgets).toEqual(originalWidgets);
  });
});

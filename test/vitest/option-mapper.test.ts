import { mapDashboardGridOptions, mapDashboardWidgetOptions } from "../../src";

describe("mapDashboardGridOptions", () => {
  it("maps dashboard interaction flags to GridStack options", () => {
    expect(mapDashboardGridOptions({ columns: 4, editable: false })).toMatchObject({
      column: 4,
      disableDrag: true,
      disableResize: true,
    });

    expect(mapDashboardGridOptions({ columns: 13, editable: true, movable: false, resizable: true })).toMatchObject({
      column: 12,
      disableDrag: true,
      disableResize: false,
    });
  });

  it("maps namespaced engine options without overriding Comins ownership", () => {
    expect(
      mapDashboardGridOptions({
        columns: 6,
        engineOptions: {
          cellHeight: "auto",
          margin: 4,
          float: true,
          animate: false,
          staticGrid: true,
          rtl: true,
          minRow: 2,
          maxRow: 10,
          sizeToContent: true,
          dragHandle: ".widget-handle",
          resizeHandles: "e,se,s",
          alwaysShowResizeHandle: true,
          nonce: "nonce-placeholder",
        },
      }),
    ).toMatchObject({
      column: 6,
      cellHeight: "auto",
      margin: 4,
      float: true,
      animate: false,
      staticGrid: true,
      rtl: true,
      minRow: 2,
      maxRow: 10,
      sizeToContent: true,
      draggable: { handle: ".widget-handle" },
      resizable: { handles: "e,se,s" },
      alwaysShowResizeHandle: true,
      nonce: "nonce-placeholder",
    });
  });

  it("maps and sorts responsive breakpoints without mutating the consumer input", () => {
    const breakpoints = [
      { maxWidth: 720, columns: 1 as const, layout: "list" as const },
      { maxWidth: 1200, columns: 6 as const, layout: "moveScale" as const },
    ];

    expect(mapDashboardGridOptions({
      columns: 12,
      responsive: {
        columnMax: 12,
        breakpoints,
        breakpointForWindow: true,
        layout: "compact",
      },
    })).toMatchObject({
      column: 12,
      columnOpts: {
        columnMax: 12,
        breakpoints: [
          { w: 1200, c: 6, layout: "moveScale" },
          { w: 720, c: 1, layout: "list" },
        ],
        breakpointForWindow: true,
        layout: "compact",
      },
    });
    expect(breakpoints[0]?.maxWidth).toBe(720);
  });

  it("maps widget-level movement and resize locks without overriding global locks", () => {
    const baseWidget = { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } };

    expect(
      mapDashboardWidgetOptions(
        {
          ...baseWidget,
          movable: false,
          resizable: true,
        },
        { editable: true, movable: true, resizable: true },
      ),
    ).toMatchObject({ locked: undefined, noMove: true, noResize: false });

    expect(
      mapDashboardWidgetOptions(
        {
          ...baseWidget,
          movable: true,
          resizable: true,
        },
        { editable: true, movable: false, resizable: false },
      ),
    ).toMatchObject({ noMove: true, noResize: true });

    expect(
      mapDashboardWidgetOptions(
        {
          ...baseWidget,
          locked: true,
          movable: true,
          resizable: true,
        },
        { editable: true, movable: true, resizable: true },
      ),
    ).toMatchObject({ locked: true, noMove: true, noResize: true });
  });
});

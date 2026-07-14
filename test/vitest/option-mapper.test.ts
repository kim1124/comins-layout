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

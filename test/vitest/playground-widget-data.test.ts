import {
  applyDefaultWidgetEdit,
  type DefaultWidgetEditCommands,
} from "../../example/src/playground/components/WidgetCrudControls";
import { createLayoutPlaygroundFixture } from "../../example/src/playground/fixtures";
import {
  PASTEL_COLORS,
  pastelColor,
  pastelKeyForIndex,
} from "../../example/src/playground/palette";
import { createDashboardLayoutState, updateDashboardWidget, updateDashboardWidgetLayout } from "../../src";
import type { DashboardLayoutState } from "../../src";
import type { ExampleWidgetData } from "../../example/src/playground/types";

describe("playground widget data", () => {
  it("assigns stable pastel colors by widget index", () => {
    expect(pastelKeyForIndex(0)).toBe("mint");
    expect(pastelKeyForIndex(PASTEL_COLORS.length)).toBe("mint");
    expect(createLayoutPlaygroundFixture().map((widget) => widget.data?.colorKey))
      .toEqual(["mint", "sky", "lemon", "peach", "lavender", "rose"]);
  });

  it("returns the selected pastel presentation", () => {
    expect(pastelColor("mint")).toEqual({
      background: "#dcfce7",
      foreground: "#14532d",
      key: "mint",
    });
  });

  it("creates six varied 12-column widgets without shared references", () => {
    const first = createLayoutPlaygroundFixture();
    const second = createLayoutPlaygroundFixture();
    expect(first.map(({ layout }) => [layout.w, layout.h]))
      .toEqual([[3, 2], [5, 2], [4, 3], [6, 2], [3, 3], [3, 2]]);
    expect(first).not.toBe(second);
    expect(first[0]?.data).not.toBe(second[0]?.data);
  });

  it("applies an uncontrolled edit draft to widget geometry and data", () => {
    let state: DashboardLayoutState<ExampleWidgetData> = createDashboardLayoutState({
      columns: 12,
      widgets: createLayoutPlaygroundFixture(),
    });
    const commands: DefaultWidgetEditCommands = {
      updateWidget: (id, patch) => {
        state = updateDashboardWidget(state, id, patch);
      },
      updateWidgetLayout: (id, patch) => {
        state = updateDashboardWidgetLayout(state, id, patch);
      },
    };

    applyDefaultWidgetEdit(commands, state.widgets[0]!, {
      colorKey: "rose",
      height: 4,
      title: "Revenue",
      value: "200M",
      width: 7,
    });

    expect(state.widgets[0]).toMatchObject({
      title: "Revenue",
      layout: { id: "sales", x: 0, y: 0, w: 7, h: 4 },
      data: { colorKey: "rose", contentRevision: 1, value: "200M" },
    });
    expect(state.layoutsByColumn[12]?.widgets[0]).toEqual({ id: "sales", x: 0, y: 0, w: 7, h: 4 });
  });
});

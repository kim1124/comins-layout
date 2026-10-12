import { createDashboardLayoutState, serializeDashboardState } from "../../src/core";
import type { DashboardGridCommands, DashboardWidget, UseDashboardGridOptions } from "../../src/core";

const widgets: DashboardWidget<{ value: number }>[] = [
  { id: "a", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 }, data: { value: 1 } },
];
const options: UseDashboardGridOptions<{ value: number }> = { initialWidgets: widgets };
const state = createDashboardLayoutState({ columns: 6, widgets: options.initialWidgets ?? [] });
const value: number | undefined = serializeDashboardState(state).widgets[0]?.data?.value;
declare const commands: DashboardGridCommands<{ value: number }>;
commands.updateWidget("a", { data: { value: value ?? 0 } });
// @ts-expect-error Framework hooks are deliberately absent from Core.
import { useDashboardGrid } from "../../src/core";
// @ts-expect-error DOM execution types are deliberately absent from Core.
import type { DashboardResizeScheduler } from "../../src/core";
// @ts-expect-error Private mutation queue is not public API.
import type { DashboardGridInternalState } from "../../src/core";

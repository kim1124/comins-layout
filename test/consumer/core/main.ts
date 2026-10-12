import { createDashboardLayoutState, addDashboardWidget, serializeDashboardState } from "comins-grid-layout/core";
const state = addDashboardWidget(createDashboardLayoutState<{ value: number }>({ columns: 6, widgets: [] }), {
  id: "one", layout: { id: "one", x: 0, y: 0, w: 3, h: 2 }, data: { value: 42 },
});
if (serializeDashboardState(state).widgets[0]?.data?.value !== 42) throw new Error("Core state failed");
// @ts-expect-error Pure Core intentionally has no renderer.
type Renderer = typeof import("comins-grid-layout/core").DashboardGrid;
// @ts-expect-error Browser handles are not Core types.
type Handle = import("comins-grid-layout/core").DashboardGridHandle;
export { state };

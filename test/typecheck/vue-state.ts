import { effectScope, type ComputedRef } from "vue";
import { useDashboardGrid } from "../../src/vue/use-dashboard-grid";

effectScope().run(() => {
  const grid = useDashboardGrid<{ value: number }>();
  const columns: ComputedRef<number> = grid.columns;
  grid.commands.addWidget({ id: "a", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 }, data: { value: 1 } });
  // @ts-expect-error commands preserve TData
  grid.commands.updateWidget("a", { data: { value: "wrong" } });
  // @ts-expect-error returned computed values are readonly
  columns.value = 3;
});

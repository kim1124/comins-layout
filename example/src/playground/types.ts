import { useDashboardGrid } from "../../../src";

export type ExampleWidgetData = {
  description: string;
  value: string;
};

export type DashboardRuntime = ReturnType<typeof useDashboardGrid<ExampleWidgetData>>;

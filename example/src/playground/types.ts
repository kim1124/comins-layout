import { useDashboardGrid } from "../../../src";

export type ExampleWidgetData = {
  description: string;
  value: string;
  number?: number;
  kind?: "kpi" | "chart" | "table" | "restricted";
};

export type DashboardRuntime = ReturnType<typeof useDashboardGrid<ExampleWidgetData>>;

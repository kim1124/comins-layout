import { useDashboardGrid } from "../../../src";

export type ExampleFixtureCopyKey = "alerts" | "orders" | "sales" | "traffic";

export type ExampleWidgetData = {
  description: string;
  fixtureCopyKey?: ExampleFixtureCopyKey;
  value: string;
};

export type DashboardRuntime = ReturnType<typeof useDashboardGrid<ExampleWidgetData>>;

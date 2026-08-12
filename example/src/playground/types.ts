import { useDashboardGrid } from "../../../src";

export type ExampleFixtureCopyKey = "alerts" | "orders" | "sales" | "traffic";
export type ExampleGeneratedDescriptionKey = "newWidget" | "editedWidget";

export type ExampleWidgetData = {
  description: string;
  fixtureCopyKey?: ExampleFixtureCopyKey;
  generatedDescriptionKey?: ExampleGeneratedDescriptionKey;
  value: string;
};

export type DashboardRuntime = ReturnType<typeof useDashboardGrid<ExampleWidgetData>>;

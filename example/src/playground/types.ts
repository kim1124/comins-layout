import { useDashboardGrid } from "../../../src";
import type { PastelColorKey } from "./palette";

export type ExampleFixtureCopyKey = "alerts" | "orders" | "sales" | "traffic";
export type ExampleGeneratedDescriptionKey = "newWidget" | "editedWidget";

export type ExampleWidgetData = {
  colorKey: PastelColorKey;
  contentRevision: number;
  description: string;
  fixtureCopyKey?: ExampleFixtureCopyKey;
  fixtureIndex?: number;
  generatedDescriptionKey?: ExampleGeneratedDescriptionKey;
  value: string;
};

export type DashboardRuntime = ReturnType<typeof useDashboardGrid<ExampleWidgetData>>;

import { useRef } from "react";

import { useDashboardGrid } from "../../../src";
import type { DashboardLayoutMutationEvent } from "../../../src";
import { createNumberedPlaygroundFixture, createNumberedWidget } from "./fixtures";
import type { ExampleWidgetData } from "./types";
import { createExampleConditions } from "../shared/example-conditions";

export function useNumberedDashboard(
  onLayoutMutation?: (event: DashboardLayoutMutationEvent<ExampleWidgetData>) => void,
) {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: createExampleConditions("widget/basic").columns,
    initialWidgets: createExampleConditions("widget/basic").widgets,
    onLayoutMutation,
  });
  const nextWidgetNumber = useRef(11);

  const addWidget = () => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    dashboard.commands.addWidget(createNumberedWidget(number));
  };

  const reset = () => {
    dashboard.commands.resetLayout({
      columns: 12,
      widgets: createNumberedPlaygroundFixture(),
    });
  };

  return {
    dashboard,
    addWidget,
    clearWidgets: dashboard.commands.clearWidgets,
    reset,
  };
}

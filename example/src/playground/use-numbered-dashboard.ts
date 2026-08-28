import { useRef } from "react";

import { useDashboardGrid } from "../../../src";
import type { DashboardLayoutMutationEvent } from "../../../src";
import { createNumberedPlaygroundFixture, createNumberedWidget } from "./fixtures";
import type { ExampleWidgetData } from "./types";

export function useNumberedDashboard(
  onLayoutMutation?: (event: DashboardLayoutMutationEvent<ExampleWidgetData>) => void,
) {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createNumberedPlaygroundFixture(),
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

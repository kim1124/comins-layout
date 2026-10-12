import { createElement, type ReactElement } from "react";
import { dashboardActionIcons, type DashboardWidgetAction } from "../ui/icons";

export function WidgetActionIcon({ action }: { action: DashboardWidgetAction }): ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dashboardActionIcons[action].map(([tag, attributes]) => createElement(tag, attributes))}
    </svg>
  );
}

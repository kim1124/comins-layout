import type { DashboardColumnCount } from "./types";

export const DASHBOARD_COLUMN_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function clampDashboardColumnCount(value: number): DashboardColumnCount {
  if (!Number.isFinite(value)) {
    return 12;
  }

  if (value < 1) {
    return 1;
  }

  if (value > 12) {
    return 12;
  }

  return Math.round(value) as DashboardColumnCount;
}

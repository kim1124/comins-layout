export type DashboardWidgetActionLabels = {
  /** @deprecated No default maximize button is rendered. */
  maximize: string;
  /** @deprecated No default minimize button is rendered. */
  minimize: string;
  restore: string;
  remove: string;
};

export const DEFAULT_ACTION_LABELS: DashboardWidgetActionLabels = {
  maximize: "최대화",
  minimize: "최소화",
  restore: "복원",
  remove: "삭제",
};

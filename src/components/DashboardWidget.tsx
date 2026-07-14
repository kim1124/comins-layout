import type { ReactNode } from "react";
import { Maximize2, Minimize2, RotateCcw, Trash2 } from "lucide-react";
import type { DashboardWidget as DashboardWidgetModel } from "../core/types";

export type DashboardWidgetShellProps<TData = unknown> = {
  widget: DashboardWidgetModel<TData>;
  children: ReactNode;
  showControls?: boolean;
  labels?: DashboardWidgetActionLabels;
  onMaximize?: (id: string) => void;
  onMinimize?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRemove?: (id: string) => void;
  onHeaderDoubleClick?: (id: string) => void;
};

export type DashboardWidgetActionLabels = {
  maximize: string;
  minimize: string;
  restore: string;
  remove: string;
};

const DEFAULT_ACTION_LABELS: DashboardWidgetActionLabels = {
  maximize: "최대화",
  minimize: "최소화",
  restore: "복원",
  remove: "삭제",
};

export function DashboardWidgetShell<TData = unknown>({
  widget,
  children,
  showControls = true,
  labels = DEFAULT_ACTION_LABELS,
  onMaximize,
  onMinimize,
  onRestore,
  onRemove,
  onHeaderDoubleClick,
}: DashboardWidgetShellProps<TData>) {
  const title = widget.title ?? widget.id;

  return (
    <div className="comins-grid-layout-widget">
      <header className="comins-grid-layout-widget__header" onDoubleClick={() => onHeaderDoubleClick?.(widget.id)}>
        <strong className="comins-grid-layout-widget__title">{title}</strong>
        {showControls ? (
          <div className="comins-grid-layout-widget__actions" onDoubleClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label={`${title} ${labels.maximize}`} onClick={() => onMaximize?.(widget.id)}>
              <Maximize2 aria-hidden="true" size={16} strokeWidth={2} />
            </button>
            <button type="button" aria-label={`${title} ${labels.minimize}`} onClick={() => onMinimize?.(widget.id)}>
              <Minimize2 aria-hidden="true" size={16} strokeWidth={2} />
            </button>
            <button type="button" aria-label={`${title} ${labels.restore}`} onClick={() => onRestore?.(widget.id)}>
              <RotateCcw aria-hidden="true" size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label={`${title} ${labels.remove}`}
              className="comins-grid-layout-widget__action--danger"
              onClick={() => onRemove?.(widget.id)}
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </header>
      <div className="comins-grid-layout-widget__body">{children}</div>
    </div>
  );
}

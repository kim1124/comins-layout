import { useEffect, useRef, type ReactNode } from "react";
import { WidgetActionIcon } from "./WidgetActionIcon";
import { DEFAULT_ACTION_LABELS } from "../ui/widget-actions";
import type { DashboardWidgetActionLabels } from "../ui/widget-actions";
export type { DashboardWidgetActionLabels } from "../ui/widget-actions";
import type {
  DashboardWidget as DashboardWidgetModel,
  DashboardWidgetInteractionEvent,
} from "../core/types";

export type DashboardWidgetShellProps<TData = unknown> = {
  widget: DashboardWidgetModel<TData>;
  children: ReactNode;
  showControls?: boolean;
  labels?: DashboardWidgetActionLabels;
  /** @deprecated Supply a custom action using resizeWidget. */
  onMaximize?: (id: string) => void;
  /** @deprecated Supply a custom action using resizeWidget. */
  onMinimize?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRemove?: (id: string) => void;
  /**
   * @deprecated This is a title-only legacy alias. Use onTitleDoubleClick.
   * Removal is deferred to a future release.
   */
  onHeaderDoubleClick?: (id: string) => void;
  onBeforeTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  renderActions?: (widget: DashboardWidgetModel<TData>) => ReactNode;
};

export function DashboardWidgetShell<TData = unknown>({
  widget,
  children,
  showControls = true,
  labels = DEFAULT_ACTION_LABELS,
  onRestore,
  onRemove,
  onHeaderDoubleClick,
  onBeforeTitleDoubleClick,
  onTitleDoubleClick,
  onAfterTitleDoubleClick,
  renderActions,
}: DashboardWidgetShellProps<TData>) {
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const actions = actionsRef.current;
    // Keep native taps on controls out of the ancestor drag handle's touch
    // emulation. A React bubbling handler runs after that native listener.
    const preserveControlTouch = (event: TouchEvent) => event.stopPropagation();
    actions?.addEventListener("touchstart", preserveControlTouch, { passive: true });
    return () => actions?.removeEventListener("touchstart", preserveControlTouch);
  }, [showControls]);
  const title = widget.title ?? widget.id;
  const handleTitleDoubleClick = () => {
    const interactionEvent: DashboardWidgetInteractionEvent = {
      id: widget.id,
      layout: { ...widget.layout },
    };
    onBeforeTitleDoubleClick?.(interactionEvent);
    onTitleDoubleClick?.(interactionEvent);
    onHeaderDoubleClick?.(widget.id);
    onAfterTitleDoubleClick?.(interactionEvent);
  };

  return (
    <div className="comins-grid-layout-widget">
      <header className="comins-grid-layout-widget__header">
        <strong className="comins-grid-layout-widget__title" onDoubleClick={handleTitleDoubleClick}>{title}</strong>
        {showControls ? (
          <div ref={actionsRef} className="comins-grid-layout-widget__actions" onDoubleClick={(event) => event.stopPropagation()}>
            {renderActions ? renderActions(widget) : (
              <>
                <button type="button" aria-label={`${title} ${labels.restore}`} onClick={() => onRestore?.(widget.id)}>
                  <WidgetActionIcon action="restore" />
                </button>
                <button
                  type="button"
                  aria-label={`${title} ${labels.remove}`}
                  className="comins-grid-layout-widget__action--danger"
                  onClick={() => onRemove?.(widget.id)}
                >
                  <WidgetActionIcon action="remove" />
                </button>
              </>
            )}
          </div>
        ) : null}
      </header>
      <div className="comins-grid-layout-widget__body">{children}</div>
    </div>
  );
}

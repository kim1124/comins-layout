import type { DashboardResizeScheduler, DashboardWidgetResizeFrameEvent } from "./types";

export function createDashboardResizeScheduler(
  callback: (event: DashboardWidgetResizeFrameEvent) => void,
): DashboardResizeScheduler {
  let frameId: number | undefined;
  const pending = new Map<string, DashboardWidgetResizeFrameEvent>();

  const requestFrame =
    globalThis.requestAnimationFrame ??
    ((handler: FrameRequestCallback) => globalThis.setTimeout(() => handler(performance.now()), 16));
  const cancelFrame = globalThis.cancelAnimationFrame ?? ((id: number) => globalThis.clearTimeout(id));

  function flush() {
    frameId = undefined;
    const events = Array.from(pending.values());
    pending.clear();
    events.forEach(callback);
  }

  return {
    schedule(event) {
      pending.set(event.id, event);
      if (frameId === undefined) {
        frameId = requestFrame(flush);
      }
    },
    cancel() {
      pending.clear();
      if (frameId !== undefined) {
        cancelFrame(frameId);
        frameId = undefined;
      }
    },
  };
}

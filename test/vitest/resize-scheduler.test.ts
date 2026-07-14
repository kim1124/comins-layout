import { createDashboardResizeScheduler } from "../../src";

describe("createDashboardResizeScheduler", () => {
  it("batches resize events into one animation frame and keeps the latest event per widget", () => {
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    const callbacks: FrameRequestCallback[] = [];
    const received: string[] = [];

    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    };
    globalThis.cancelAnimationFrame = vi.fn();

    const scheduler = createDashboardResizeScheduler((event) => {
      received.push(`${event.id}:${event.width}x${event.height}`);
    });

    scheduler.schedule({ id: "sales", width: 100, height: 80 });
    scheduler.schedule({ id: "sales", width: 120, height: 90 });
    scheduler.schedule({ id: "traffic", width: 200, height: 110 });

    expect(callbacks).toHaveLength(1);
    callbacks[0]?.(performance.now());

    expect(received).toEqual(["sales:120x90", "traffic:200x110"]);

    scheduler.cancel();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });
});

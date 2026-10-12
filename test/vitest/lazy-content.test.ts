import { afterEach, describe, expect, it, vi } from "vitest";
import { observeDashboardContent } from "../../src/browser/lazy-content";

afterEach(() => vi.unstubAllGlobals());
describe("framework-neutral content observation", () => {
  it("waits for positioning, observes the scroll root and reveals once", () => {
    let frame: FrameRequestCallback | undefined;
    let callback: IntersectionObserverCallback | undefined;
    const observe = vi.fn(), disconnect = vi.fn(), root = {};
    vi.stubGlobal("requestAnimationFrame", vi.fn((fn) => { frame = fn; return 1; }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const Observer = vi.fn(function (this: object, fn: IntersectionObserverCallback, opts: IntersectionObserverInit) {
      callback = fn;
      expect(opts.root).toBe(root);
      return { observe, disconnect };
    });
    vi.stubGlobal("IntersectionObserver", Observer);
    const element = { closest: () => root } as unknown as HTMLElement;
    let positioned = false;
    const onVisible = vi.fn();
    const dispose = observeDashboardContent(element, { enabled: true, isPositioned: () => positioned, onVisible });
    expect(Observer).not.toHaveBeenCalled();
    positioned = true;
    frame!(0);
    expect(observe).toHaveBeenCalledWith(element);
    callback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    callback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(onVisible).toHaveBeenCalledTimes(1);
    dispose();
    dispose();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("cancels pending frames and ignores callbacks after disposal", () => {
    let callback: IntersectionObserverCallback | undefined;
    const cancel = vi.fn(), onVisible = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
    vi.stubGlobal("cancelAnimationFrame", cancel);
    vi.stubGlobal("IntersectionObserver", function (fn: IntersectionObserverCallback) {
      callback = fn; return { observe: vi.fn(), disconnect: vi.fn() };
    });
    const element = { closest: () => null } as unknown as HTMLElement;
    const pending = observeDashboardContent(element, { enabled: true, isPositioned: () => false, onVisible });
    pending(); pending();
    expect(cancel).toHaveBeenCalledTimes(1);
    const active = observeDashboardContent(element, { enabled: true, isPositioned: () => true, onVisible });
    active();
    callback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(onVisible).not.toHaveBeenCalled();
  });

  it.each([true, false])("reveals without observation when unavailable or disabled (%s)", (enabled) => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const onVisible = vi.fn();
    const dispose = observeDashboardContent({} as HTMLElement, { enabled, isPositioned: () => false, onVisible });
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(() => dispose()).not.toThrow();
  });
});

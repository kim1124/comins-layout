export type DashboardContentObservationOptions = {
  enabled: boolean;
  isPositioned: () => boolean;
  onVisible: () => void;
};

export function observeDashboardContent(
  element: HTMLElement,
  options: DashboardContentObservationOptions,
): () => void {
  let disposed = false;
  let frame: number | undefined;
  let observer: IntersectionObserver | undefined;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== undefined) globalThis.cancelAnimationFrame(frame);
    observer?.disconnect();
  };
  const reveal = () => {
    if (disposed) return;
    dispose();
    options.onVisible();
  };
  const observe = () => {
    frame = undefined;
    if (disposed) return;
    if (!options.isPositioned()) {
      frame = globalThis.requestAnimationFrame(observe);
      return;
    }
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) reveal();
    }, { root: element.closest("[data-dashboard-lazy-scroll]") });
    observer.observe(element);
  };
  if (!options.enabled || typeof IntersectionObserver === "undefined") reveal();
  else observe();
  return dispose;
}

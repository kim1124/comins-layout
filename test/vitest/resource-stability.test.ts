import { describe, expect, it } from "vitest";
import {
  growsMonotonicallyBeyondTolerance,
  selectSteadyStateWindow,
  staysWithinFinalHeapGrowth,
  staysWithinHeapPeak,
  type HeapCounter,
} from "../playwright/resource-stability";

function counters(heaps: number[]): HeapCounter[] {
  return heaps.map((heap) => ({ heap }));
}

describe("resource stability budgets", () => {
  it("accepts a delayed initialization transition when the tail reaches steady state", () => {
    const samples = counters([24_500_368, 27_224_124, 27_251_920, 27_274_160, 27_278_440, 27_307_784]);
    const steadyState = selectSteadyStateWindow(samples, 3);

    expect(staysWithinHeapPeak(samples, 0.12)).toBe(true);
    expect(steadyState.map((counter) => counter.heap)).toEqual([27_274_160, 27_278_440, 27_307_784]);
    expect(staysWithinFinalHeapGrowth(steadyState, 0.02)).toBe(true);
    expect(growsMonotonicallyBeyondTolerance(steadyState.map((counter) => counter.heap), 0.02)).toBe(false);
  });

  it("accepts non-monotonic post-GC jitter when final retained heap stays inside tolerance", () => {
    const steadyState = counters([27_162_872, 25_251_540, 27_367_288]);

    expect(staysWithinFinalHeapGrowth(steadyState, 0.02)).toBe(true);
    expect(growsMonotonicallyBeyondTolerance(steadyState.map((counter) => counter.heap), 0.02)).toBe(false);
  });

  it("rejects sustained steady-state heap growth beyond the final tolerance", () => {
    const steadyState = counters([100, 102, 105]);

    expect(staysWithinFinalHeapGrowth(steadyState, 0.02)).toBe(false);
    expect(growsMonotonicallyBeyondTolerance(steadyState.map((counter) => counter.heap), 0.02)).toBe(true);
  });

  it("rejects a transient heap span above the global peak tolerance", () => {
    expect(staysWithinHeapPeak(counters([100, 113, 101]), 0.12)).toBe(false);
  });
});

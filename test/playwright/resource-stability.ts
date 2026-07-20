export type HeapCounter = {
  heap: number;
};

export function selectSteadyStateWindow<T>(values: readonly T[], size: number): T[] {
  return values.slice(-size);
}

export function staysWithinHeapPeak(counters: readonly HeapCounter[], tolerance: number): boolean {
  const baseline = counters[0];
  if (!baseline) {
    return false;
  }

  const maximum = Math.max(...counters.map((counter) => counter.heap));
  return maximum <= baseline.heap * (1 + tolerance);
}

export function staysWithinFinalHeapGrowth(counters: readonly HeapCounter[], tolerance: number): boolean {
  const baseline = counters[0];
  const final = counters.at(-1);
  if (!baseline || !final) {
    return false;
  }

  return final.heap <= baseline.heap * (1 + tolerance);
}

export function growsMonotonicallyBeyondTolerance(values: readonly number[], tolerance: number): boolean {
  const first = values[0];
  const final = values.at(-1);
  if (first === undefined || final === undefined) {
    return false;
  }

  return (
    final > first * (1 + tolerance) &&
    values.slice(1).every((value, index) => value >= values[index]!)
  );
}

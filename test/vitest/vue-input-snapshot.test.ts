import { computed, effectScope, nextTick, reactive, watch } from "vue";
import { describe, expect, it, vi } from "vitest";
import { snapshotDashboardGridInputs } from "../../src/vue/input-snapshot";
import type { DashboardGridProps } from "../../src/vue/types";

describe("Vue engine input snapshots", () => {
  it("tracks structural fields in one flush and retains previous engine values", async () => {
    const props = reactive<DashboardGridProps>({
      widgets: [{ id: "a", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 } }],
      engineOptions: { float: false, cellHeight: 60 },
      responsive: { breakpoints: [{ maxWidth: 600, columns: 4 }] },
      externalDropTargets: [{ id: "trash", selector: "#old" }],
    });
    const scope = effectScope();
    const onChange = vi.fn();
    const snapshot = scope.run(() => {
      const value = computed(() => snapshotDashboardGridInputs(props));
      watch(value, onChange, { flush: "post" });
      return value;
    })!;
    try {
      const previous = snapshot.value;
      props.widgets.push({ id: "b", layout: { id: "b", x: 4, y: 0, w: 2, h: 2 } });
      props.widgets[0]!.layout.w = 3;
      props.engineOptions!.float = true;
      props.engineOptions!.cellHeight = 90;
      props.responsive!.breakpoints![0]!.columns = 6;
      props.externalDropTargets![0]!.selector = "#new";
      await nextTick();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(previous.widgets).toHaveLength(1);
      expect(previous.widgets[0]!.layout.w).toBe(2);
      expect(previous.engineOptions).toEqual({ float: false, cellHeight: 60 });
      expect(previous.responsive?.breakpoints?.[0]?.columns).toBe(4);
      expect(previous.externalDropTargets?.[0]?.selector).toBe("#old");
      expect(snapshot.value.widgets).toHaveLength(2);
      expect(snapshot.value.engineOptions?.float).toBe(true);
      expect(snapshot.value.responsive?.breakpoints?.[0]?.columns).toBe(6);
    } finally { scope.stop(); }
  });

  it("does not traverse or observe nested TData, regardless of payload size", async () => {
    const nestedRead = vi.fn(() => { throw new Error("TData traversed"); });
    const props = reactive({ widgets: [{ id: "a", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 },
      data: { value: 1, get largePayload() { return nestedRead(); } },
    }] });
    const scope = effectScope();
    const onChange = vi.fn();
    const snapshot = scope.run(() => {
      const value = computed(() => snapshotDashboardGridInputs(props));
      watch(value, onChange, { flush: "post" });
      return value;
    })!;
    try {
      expect(snapshot.value.widgets[0]!.data).toBe(props.widgets[0]!.data);
      props.widgets[0]!.data.value = 2;
      await nextTick();
      expect(onChange).not.toHaveBeenCalled();
      props.widgets[0]!.layout.x = 2;
      await nextTick();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(nestedRead).not.toHaveBeenCalled();
    } finally { scope.stop(); }
  });
});

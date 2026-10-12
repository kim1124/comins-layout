import { describe, expect, it } from "vitest";
import {
  createDashboardGridInternalState,
  dashboardGridInternalReducer as reduce,
} from "../../src/core/transitions";

const widget = { id: "a", layout: { id: "a", x: 0, y: 0, w: 4, h: 2 }, data: { value: 10 } };

describe("shared dashboard transitions", () => {
  it("retains each mutation snapshot and acknowledges only delivered sequences", () => {
    const initial = createDashboardGridInternalState<{ value: number }>({ columns: 12, widgets: [] });
    const added = reduce(initial, { type: "transition", action: { type: "add", widget }, mutation: { kind: "widget:add", widgetIds: ["a"] } });
    const updated = reduce(added, { type: "transition", action: { type: "update", id: "a", patch: { data: { value: 20 } } }, mutation: { kind: "widget:update", widgetIds: ["a"] } });
    expect(initial.dashboard.widgets).toEqual([]);
    expect(updated.mutations.map(({ sequence }) => sequence)).toEqual([1, 2]);
    expect(updated.mutations.map(({ event }) => event.snapshot.widgets[0]?.data)).toEqual([{ value: 10 }, { value: 20 }]);
    const acknowledged = reduce(updated, { type: "ack-mutations", through: 1 });
    expect(acknowledged.mutations.map(({ sequence }) => sequence)).toEqual([2]);
    expect(acknowledged.dashboard).toBe(updated.dashboard);
    expect(acknowledged.nextMutationSequence).toBe(3);
  });

  it("preserves identity for a rejected maximize and does not enqueue a mutation", () => {
    const initial = createDashboardGridInternalState({ columns: 12, widgets: [widget] });
    const result = reduce(initial, { type: "transition", action: { type: "maximize", id: "missing" }, mutation: { kind: "widget:update" } });
    expect(result).toBe(initial);
    expect(result.mutations).toEqual([]);
    expect(reduce(initial, { type: "ack-mutations", through: 0 })).toBe(initial);
  });

  it("applies columns and layout commits then restores the initial serialized model", () => {
    const initial = createDashboardGridInternalState({ columns: 12, widgets: [widget] });
    const columns = reduce(initial, { type: "transition", action: { type: "columns", columns: 6 }, mutation: { kind: "columns:change" } });
    expect(columns.dashboard.columns).toBe(6);
    const committed = reduce(columns, { type: "transition", action: { type: "apply-layout-snapshot", snapshot: { columns: 6, widgets: [{ ...widget.layout, x: 1, w: 2 }] } }, mutation: { kind: "layout:commit" } });
    expect(committed.dashboard.widgets[0]?.layout).toEqual({ id: "a", x: 1, y: 0, w: 2, h: 2 });
    const restored = reduce(committed, { type: "transition", action: { type: "reset", snapshot: { columns: 12, widgets: [widget] } }, mutation: { kind: "layout:restore" } });
    expect(restored.dashboard).toEqual(initial.dashboard);
    expect(restored.mutations.map(({ event }) => event.kind)).toEqual(["columns:change", "layout:commit", "layout:restore"]);
  });

  it("does not allocate observer snapshots for unobserved transitions or refresh", () => {
    const initial = createDashboardGridInternalState({ columns: 12, widgets: [widget] });
    const refreshed = reduce(initial, { type: "transition", action: { type: "refresh" } });
    expect(refreshed.dashboard.refreshVersion).toBe(1);
    expect(refreshed.mutations).toBe(initial.mutations);
    expect(refreshed.nextMutationSequence).toBe(1);
    const cleared = reduce(refreshed, { type: "transition", action: { type: "clear" } });
    expect(cleared.dashboard.widgets).toEqual([]);
    expect(cleared.mutations).toBe(initial.mutations);
  });
});

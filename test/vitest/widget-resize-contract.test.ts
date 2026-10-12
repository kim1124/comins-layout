import { describe, expect, it } from 'vitest';
import * as core from '../../src/core';

const initial = () => core.createDashboardLayoutState({ columns: 12, widgets: [
  { id: 'a', layout: { id: 'a', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2, maxW: 6, maxH: 5 } },
  { id: 'b', layout: { id: 'b', x: 0, y: 4, w: 3, h: 2 } },
] });

describe('explicit widget resize contract', () => {
  it('clamps both dimensions to widget constraints and grid columns', () => {
    expect(core.resizeDashboardWidget(initial(), 'a', { w: 20, h: 20 }).widgets[0]?.layout).toMatchObject({ w: 6, h: 5 });
    expect(core.resizeDashboardWidget(initial(), 'a', { w: 0, h: 0 }).widgets[0]?.layout).toMatchObject({ w: 2, h: 2 });
    expect(core.resizeDashboardWidget(initial(), 'b', { w: 20, h: 1 }).widgets[1]?.layout).toMatchObject({ w: 12, h: 1 });
  });
  it('retains the first pre-resize geometry until restore without changing peers', () => {
    const state = initial();
    const resized = core.resizeDashboardWidget(state, 'a', { w: 5, h: 4 });
    const again = core.resizeDashboardWidget(resized, 'a', { w: 2, h: 3 });
    expect(again.widgets[1]).toEqual(state.widgets[1]);
    expect(core.restoreDashboardWidget(again, 'a').widgets).toEqual(state.widgets.map(widget => widget.id === "a" ? { ...widget, maximized: false, minimized: false } : widget));
    expect(core.createDashboardLayoutState(core.serializeDashboardState(again)).previousLayouts).toEqual(again.previousLayouts);
  });
  it('ignores unknown widgets, nonfinite sizes and unchanged dimensions', () => {
    const state = initial();
    expect(core.resizeDashboardWidget(state, 'missing', { w: 4, h: 4 })).toBe(state);
    expect(core.resizeDashboardWidget(state, 'a', { w: NaN, h: 4 })).toBe(state);
    expect(core.resizeDashboardWidget(state, 'a', { w: 4, h: Infinity })).toBe(state);
    expect(core.resizeDashboardWidget(state, 'a', { w: 3, h: 2 })).toBe(state);
  });
  it('rounds explicit dimensions, bounds position and clears legacy flags without losing restore history', () => {
    const state = initial();
    const legacy = core.minimizeDashboardWidget(state, 'a');
    const resized = core.resizeDashboardWidget(legacy, 'a', { w: 4.7, h: 3.2 });
    expect(resized.widgets[0]).toMatchObject({ maximized: false, minimized: false, layout: { w: 5, h: 3 } });
    expect(resized.previousLayouts.a).toEqual(state.widgets[0]?.layout);
    const narrow = core.setDashboardColumns(resized, 3);
    expect(core.resizeDashboardWidget(narrow, 'a', { w: 10, h: 4 }).widgets[0]?.layout).toMatchObject({ x: 0, w: 3, h: 4 });
    const restoredColumns = core.setDashboardColumns(narrow, 12);
    expect(core.restoreDashboardWidget(restoredColumns, 'a').widgets[0]?.layout).toEqual(state.widgets[0]?.layout);
  });
  it('retains legacy maximize/minimize exports with their original geometry', () => {
    expect(core.maximizeDashboardWidget(initial(), 'a').widgets[0]?.layout).toMatchObject({ x: 0, y: 0, w: 12, h: 3 });
    expect(core.minimizeDashboardWidget(initial(), 'a').widgets[0]?.layout).toMatchObject({ x: 3, y: 0, w: 3, h: 1 });
  });
});

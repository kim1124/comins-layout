import { describe, expect, it } from 'vitest';
import { titleFillSnapshot } from '../../src/core/widget-presentation';

describe('default title fill', () => {
  it('supports notification-only titles and blocks locked targets or displaced locked peers', () => {
    const widgets = [
      { id: 'a', layout: { id: 'a', x: 0, y: 0, w: 2, h: 2, maxW: 4 } },
      { id: 'b', layout: { id: 'b', x: 4, y: 0, w: 2, h: 2 } },
    ];
    expect(titleFillSnapshot(widgets, 12, 'a', {})?.widgets[0]?.w).toBe(4);
    expect(titleFillSnapshot(widgets, 12, 'a', { titleDoubleClickAction: 'none' })).toBeUndefined();
    for (const options of [{ editable: false }, { movable: false }, { resizable: false }, { engineOptions: { staticGrid: true } }]) {
      expect(titleFillSnapshot(widgets, 12, 'a', options)).toBeUndefined();
    }
    const locked = [{ ...widgets[0]!, layout: { ...widgets[0]!.layout, maxW: 10 } }, { ...widgets[1]!, locked: true }];
    expect(titleFillSnapshot(locked, 12, 'a', {})).toBeUndefined();
  });
});

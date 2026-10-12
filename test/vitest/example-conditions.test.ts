import { describe, expect, it } from 'vitest';
import { createExampleConditions } from '../../example/src/shared/example-conditions';
describe('independent framework demo conditions', () => {
  it('resets each renderer from an independent widget/layout/data copy', () => {
    const first = createExampleConditions('widget/basic');
    first.widgets[0]!.layout.w = 12;
    first.widgets[0]!.data!.value = 'modified';
    first.widgets.pop();
    const second = createExampleConditions('widget/basic');
    expect(second.columns).toBe(12);
    expect(second.widgets).toHaveLength(10);
    expect(second.widgets[0]).toMatchObject({ id: 'widget-1', layout: { x: 0, y: 0, w: 3, h: 2 }, data: { value: 'Content 1' } });
  });
});

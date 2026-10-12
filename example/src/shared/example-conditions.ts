import { createNumberedPlaygroundFixture, createNumberedWidget, createWidget } from '../playground/fixtures';
import type { DashboardColumnCount } from '../../../src/core';

export function createExampleConditions(id: string) {
  let columns: DashboardColumnCount = 12;
  let widgets = createNumberedPlaygroundFixture(id.endsWith('public-api') || id.endsWith('external-drop-trash') ? 4 : 10);
  let cellHeight = id.endsWith('lazy-load') ? 180 : 96;
  if (id.endsWith('nested/basic')) {
    cellHeight = 78;
    widgets = [
      { ...createNumberedWidget(1), layout: { id: 'widget-1', x: 0, y: 0, w: 8, h: 6 } },
      { ...createNumberedWidget(2), layout: { id: 'widget-2', x: 8, y: 0, w: 4, h: 2 } },
    ];
  }
  if (id === 'widget/resize') {
    widgets = widgets.map(widget => ({ ...widget, layout: { ...widget.layout, minW: 1, minH: 1, maxH: 6 } }));
  }
  if (id.endsWith('size-to-content')) {
    columns = 6;
    cellHeight = 1;
    widgets = [{ id: 'activity', title: 'Activity', layout: { id: 'activity', x: 0, y: 0, w: 4, h: 192, minH: 1 } }];
  }
  if (id.includes('multi-grid')) {
    columns = 6;
    widgets = [
      createWidget('a-sales', '매출 KPI', 0, 0, 2, 2, { description: '매출 KPI', kind: 'kpi', value: '1.28억' }),
      createWidget('a-chart', '추세 차트', 2, 0, 4, 2, { description: '추세 차트', kind: 'chart', value: '+18.4%' }),
    ];
  }
  return { columns, widgets, cellHeight };
}
export function createTransferTargetConditions() {
  return { columns: 12 as const, widgets: [createWidget('b-table', '주문 표', 0, 0, 4, 2, { description: '주문 표', kind: 'table', value: '1,284건' })] };
}
export function createNestedConditions(level: number, remaining: number) {
  const first = level * 10 + 1, second = first + 1;
  return { columns: 4 as const, widgets: [
    { ...createNumberedWidget(first), data: { description: `Nested level ${level}`, value: `Nested ${level}`, number: first, kind: 'kpi' as const },
      layout: { id: `widget-${first}`, x: 0, y: 0, w: remaining > 1 ? 3 : 2, h: remaining > 1 ? 4 : 2 } },
    { ...createNumberedWidget(second), layout: { id: `widget-${second}`, x: 3, y: 0, w: 1, h: 2 } },
  ] };
}
export function createPaletteExampleWidget(kind: NonNullable<ReturnType<typeof createNumberedWidget>['data']>['kind'], sequence: number) {
  const selected = kind ?? 'kpi';
  const title = { kpi: '신규 KPI', chart: '신규 차트', table: '신규 표', restricted: '제한 위젯' }[selected];
  return createWidget(`palette-${selected}-${sequence}`, title, 0, 0, 6, 2,
    { description: `${title} ${selected}`, kind: selected, value: selected === 'kpi' ? '42' : selected === 'chart' ? '+12.6%' : selected === 'table' ? '320행' : '거부됨' });
}

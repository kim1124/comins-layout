import type { DashboardWidget } from "../../../src";

import type { ExampleWidgetData } from "./types";

export function createWidget(
  id: string,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  data: ExampleWidgetData = {
    description: `${title} dashboard widget`,
    value: title,
  },
): DashboardWidget<ExampleWidgetData> {
  return {
    id,
    title,
    layout: { h, id, w, x, y },
    data: { ...data },
  };
}

export function createWidgetPlaygroundFixture(): DashboardWidget<ExampleWidgetData>[] {
  return [
    createWidget("sales", "매출", 0, 0, 2, 2, { description: "월간 반복 매출", value: "1.28억" }),
    createWidget("traffic", "트래픽", 2, 0, 2, 2, { description: "활성 세션", value: "4.28만" }),
    createWidget("orders", "주문", 4, 0, 2, 2, { description: "완료 주문", value: "1,284" }),
  ];
}

export function createLayoutPlaygroundFixture(): DashboardWidget<ExampleWidgetData>[] {
  return [
    createWidget("sales", "Sales", 0, 0, 4, 2),
    createWidget("traffic", "Traffic", 4, 0, 8, 2),
    createWidget("orders", "Orders", 0, 2, 6, 2),
    createWidget("alerts", "Alerts", 6, 2, 6, 2),
  ];
}

export function createAdvancedPlaygroundFixture(): DashboardWidget<ExampleWidgetData>[] {
  return [
    createWidget("sales", "매출", 0, 0, 4, 2, { description: "월간 반복 매출", value: "1.28억" }),
    createWidget("traffic", "트래픽", 4, 0, 4, 2, { description: "활성 세션", value: "4.28만" }),
    createWidget("orders", "주문", 8, 0, 4, 2, { description: "완료 주문", value: "1,284" }),
    createWidget("alerts", "알림", 0, 2, 6, 2, { description: "미해결 이슈", value: "3" }),
  ];
}

import type { DashboardWidget } from "../../../src";

import { pastelKeyForIndex } from "./palette";
import type { ExampleWidgetData } from "./types";

type ExampleWidgetDataInput = Omit<ExampleWidgetData, "colorKey" | "contentRevision"> &
  Partial<Pick<ExampleWidgetData, "colorKey" | "contentRevision">>;

export function createWidget(
  id: string,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  data: ExampleWidgetDataInput = {
    description: `${title} dashboard widget`,
    value: title,
  },
): DashboardWidget<ExampleWidgetData> {
  const { colorKey = "mint", contentRevision = 0, ...presentation } = data;

  return {
    id,
    title,
    layout: { h, id, w, x, y },
    data: { ...presentation, colorKey, contentRevision },
  };
}

export function createWidgetPlaygroundFixture(): DashboardWidget<ExampleWidgetData>[] {
  return [
    createWidget("widget-1", "위젯 1", 0, 0, 2, 2, { colorKey: pastelKeyForIndex(0), contentRevision: 0, description: "위젯 1 콘텐츠", fixtureIndex: 1, value: "1" }),
    createWidget("widget-2", "위젯 2", 2, 0, 2, 2, { colorKey: pastelKeyForIndex(1), contentRevision: 0, description: "위젯 2 콘텐츠", fixtureIndex: 2, value: "2" }),
    createWidget("widget-3", "위젯 3", 4, 0, 2, 2, { colorKey: pastelKeyForIndex(2), contentRevision: 0, description: "위젯 3 콘텐츠", fixtureIndex: 3, value: "3" }),
  ];
}

export function createLayoutPlaygroundFixture(): DashboardWidget<ExampleWidgetData>[] {
  return [
    createWidget("sales", "Sales", 0, 0, 3, 2, { colorKey: pastelKeyForIndex(0), contentRevision: 0, description: "Sales dashboard widget", fixtureCopyKey: "sales", fixtureIndex: 1, value: "Sales" }),
    createWidget("traffic", "Traffic", 3, 0, 5, 2, { colorKey: pastelKeyForIndex(1), contentRevision: 0, description: "Traffic dashboard widget", fixtureCopyKey: "traffic", fixtureIndex: 2, value: "Traffic" }),
    createWidget("orders", "Orders", 8, 0, 4, 3, { colorKey: pastelKeyForIndex(2), contentRevision: 0, description: "Orders dashboard widget", fixtureCopyKey: "orders", fixtureIndex: 3, value: "Orders" }),
    createWidget("alerts", "Alerts", 0, 3, 6, 2, { colorKey: pastelKeyForIndex(3), contentRevision: 0, description: "Alerts dashboard widget", fixtureCopyKey: "alerts", fixtureIndex: 4, value: "Alerts" }),
    createWidget("inventory", "Inventory", 6, 3, 3, 3, { colorKey: pastelKeyForIndex(4), contentRevision: 0, description: "Inventory dashboard widget", fixtureIndex: 5, value: "Inventory" }),
    createWidget("conversion", "Conversion", 9, 3, 3, 2, { colorKey: pastelKeyForIndex(5), contentRevision: 0, description: "Conversion dashboard widget", fixtureIndex: 6, value: "Conversion" }),
  ];
}

export function createAdvancedPlaygroundFixture(): DashboardWidget<ExampleWidgetData>[] {
  return [
    createWidget("sales", "매출", 0, 0, 4, 2, { colorKey: pastelKeyForIndex(0), contentRevision: 0, description: "월간 반복 매출", fixtureCopyKey: "sales", fixtureIndex: 1, value: "1.28억" }),
    createWidget("traffic", "트래픽", 4, 0, 4, 2, { colorKey: pastelKeyForIndex(1), contentRevision: 0, description: "활성 세션", fixtureCopyKey: "traffic", fixtureIndex: 2, value: "4.28만" }),
    createWidget("orders", "주문", 8, 0, 4, 2, { colorKey: pastelKeyForIndex(2), contentRevision: 0, description: "완료 주문", fixtureCopyKey: "orders", fixtureIndex: 3, value: "1,284" }),
    createWidget("alerts", "알림", 0, 2, 6, 2, { colorKey: pastelKeyForIndex(3), contentRevision: 0, description: "미해결 이슈", fixtureCopyKey: "alerts", fixtureIndex: 4, value: "3" }),
  ];
}

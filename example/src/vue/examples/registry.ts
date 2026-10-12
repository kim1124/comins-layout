import widgetSource from "./WidgetExamples.vue?raw";
import layoutSource from "./LayoutExamples.vue?raw";
import advancedSource from "./AdvancedExamples.vue?raw";
import transferSource from "./TransferExample.vue?raw";
import lazySource from "./LazyExample.vue?raw";
import sizingSource from "./ContentSizingExample.vue?raw";
import responsiveSource from "./ResponsiveExample.vue?raw";
import type { Component } from "vue";

// Static build-time glob; query strings never become module specifiers.
const loaders = import.meta.glob<{ default: Component }>("./*.vue");
const widget = { component: loaders["./WidgetExamples.vue"]!, source: widgetSource };
const layout = { component: loaders["./LayoutExamples.vue"]!, source: layoutSource };
const advanced = { component: loaders["./AdvancedExamples.vue"]!, source: advancedSource };
const transfer = { component: loaders["./TransferExample.vue"]!, source: transferSource };
export const vueExamples = {
  "widget/basic": widget, "widget/manage": widget, "widget/events": widget,
  "layout/basic": layout, "layout/lock": layout, "layout/persistence": layout, "layout/arrange": layout, "layout/events": layout,
  "advanced/cell-height": advanced, "advanced/grid-lines": advanced, "advanced/float": advanced,
  "advanced/mobile-touch": advanced, "advanced/nested/basic": advanced, "advanced/rtl": advanced,
  "advanced/title-drag": advanced, "advanced/transform": advanced, "advanced/public-api": advanced,
  "advanced/external-drop-trash": transfer, "advanced/multi-grid/horizontal": transfer,
  "advanced/lazy-load": { component: loaders["./LazyExample.vue"]!, source: lazySource },
  "advanced/size-to-content": { component: loaders["./ContentSizingExample.vue"]!, source: sizingSource },
  "advanced/responsive": { component: loaders["./ResponsiveExample.vue"]!, source: responsiveSource },
} as const;
export function getVueExample(id: string) {
  return Object.prototype.hasOwnProperty.call(vueExamples, id) ? vueExamples[id as keyof typeof vueExamples] : undefined;
}
export function getVueExampleSource(id: string): string {
  const entry = getVueExample(id);
  if (!entry) throw new Error("Unsupported Vue example ID");
  return entry.source.replaceAll('"../../../../src/vue"', '"comins-grid-layout/vue"');
}

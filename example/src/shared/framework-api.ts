import type { Framework } from "./example-catalog";
import type { ApiFeatureSection } from "../docs/types";

const callbacks: Record<string, string> = {
  onColumnsChange: "columnsChange", onLayoutCommit: "layoutCommit", onWidgetLayoutChange: "widgetLayoutChange",
  onWidgetResizeFrame: "widgetResizeFrame", onWidgetExternalDrop: "widgetExternalDrop", onWidgetDropRequest: "widgetDropRequest",
  onMaximizeWidget: "maximizeWidget", onMinimizeWidget: "minimizeWidget", onRestoreWidget: "restoreWidget", onRemoveWidget: "removeWidget",
  onBeforeMove: "beforeMove", onMove: "move", onAfterMove: "afterMove", onBeforeResize: "beforeResize", onResize: "resize", onAfterResize: "afterResize",
  onBeforeTitleDoubleClick: "beforeTitleDoubleClick", onTitleDoubleClick: "titleDoubleClick", onAfterTitleDoubleClick: "afterTitleDoubleClick",
};
const slots: Record<string, string> = { renderWidget: "default slot", renderWidgetActions: "actions slot" };
function translate(value: string) {
  return value.replace(/\b(?:on[A-Z]\w*|renderWidgetActions|renderWidget|className)\b/g, name => callbacks[name] ?? slots[name] ?? (name === "className" ? "class" : name))
    .replace(/React 상태/g, "제어 상태")
    .replace(/ReactNode/g, "VNode 콘텐츠")
    .replace(/React 화면/g, "Vue 화면")
    .replace(/React state/g, "Vue state");
}
export function apiForFramework(section: ApiFeatureSection, framework: Framework): ApiFeatureSection {
  if (framework === "react") return section;
  return { ...section, summary: translate(section.summary),
    props: section.props.filter(prop => !prop.name.includes('onWidgetDragStart')).map(prop => ({ ...prop, name: translate(prop.name),
      type: prop.name === 'renderWidget' ? '(slotProps: { widget: DashboardWidget<TData> }) => VNode' : (prop.name in callbacks ? `emit: ${translate(prop.type)}` : translate(prop.type)),
      description: translate(prop.description), detail: translate(prop.detail) })),
    events: section.events?.map(event => ({ ...event, name: translate(event.name), description: translate(event.description), when: translate(event.when), payload: translate(event.payload) })),
    methods: section.methods?.map(method => ({ ...method, description: translate(method.description), params: translate(method.params), returns: translate(method.returns) })),
  };
}
/** Keep component emit/slot terminology separate from composable option callbacks. */
export function exampleTextForFramework(value: string, framework: Framework, locale: 'ko' | 'en') {
  if (framework === 'react') return value;
  return translate(value)
    .replace(/\bReact\b/g, 'Vue')
    .replace(/\buseState\b/g, 'ref')
    .replace(/default slot/g, locale === 'ko' ? 'default 슬롯' : 'default slot')
    .replace(/actions slot/g, locale === 'ko' ? 'actions 슬롯' : 'actions slot')
    .replace(/레이아웃 콜백/g, '레이아웃 이벤트')
    .replace(/layout callbacks/g, 'layout events')
    .replace(/콜백/g, '이벤트 핸들러')
    .replace(/\bcallbacks\b/g, 'event handlers')
    .replace(/\bcallback\b/g, 'event handler');
}

const exampleApis: Record<string, string[]> = {
  'widget/basic': ['titleDoubleClickAction', 'onLayoutCommit'],
  'widget/resize': ['resizeWidget', 'restoreWidget', 'minW', 'maxW', 'minH', 'maxH'],
  'widget/manage': ['addWidget', 'clearWidgets', 'resetLayout'],
  'widget/events': ['onMove', 'onResize', 'onTitleDoubleClick'],
  'layout/basic': ['columns', 'setColumns', 'onLayoutCommit'],
  'layout/lock': ['movable', 'resizable', 'engineOptions.staticGrid'],
  'layout/persistence': ['serializeState', 'restoreLayout'],
  'layout/arrange': ['autoArrangeWidgets', 'fitWidgetsToColumns'],
  'layout/events': ['useDashboardGrid', 'onLayoutMutation'],
  'advanced/cell-height': ['engineOptions.cellHeight'],
  'advanced/grid-lines': ['className'],
  'advanced/float': ['engineOptions.float'],
  'advanced/lazy-load': ['lazyRenderWidget', 'renderWidget'],
  'advanced/mobile-touch': ['engineOptions.alwaysShowResizeHandle', 'responsive'],
  'advanced/nested/basic': ['DashboardGrid', 'gridId', 'renderWidget'],
  'advanced/responsive': ['responsive', 'onColumnsChange', 'onLayoutCommit'],
  'advanced/rtl': ['engineOptions.rtl'],
  'advanced/size-to-content': ['engineOptions.sizeToContent', 'engineOptions.cellHeight', 'refreshKey', 'onLayoutCommit'],
  'advanced/title-drag': ['engineOptions.dragHandle'],
  'advanced/transform': ['className'],
  'advanced/external-drop-trash': ['externalDropTargets', 'onWidgetExternalDrop'],
  'advanced/multi-grid/horizontal': ['gridTransferMode', 'onWidgetDropRequest', 'transferDashboardWidget'],
  'advanced/public-api': ['DashboardGridHandle', 'compact', 'refresh'],
};
export function getExampleApiNames(id: string, framework: Framework) {
  const names = exampleApis[id] ?? [];
  return framework === 'vue' ? names.map(translate) : names;
}

import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router";

import { DocsShell } from "./docs/DocsShell";
import { ContentSizingPlayground } from "./playground/ContentSizingPlayground";
import { ResponsivePlayground } from "./playground/ResponsivePlayground";
import { LazyRenderPlayground } from "./playground/LazyRenderPlayground";
import {
  AdvancedFeaturePlayground,
  ExternalDropTrashPlayground,
  NestedBasicPlayground,
  PublicApiPlayground,
} from "./playground/AdvancedExamples";
import type { AdvancedFeature } from "./playground/AdvancedExamples";
import {
  LayoutArrangePlayground,
  LayoutBasicPlayground,
  LayoutEventsPlayground,
  LayoutLockPlayground,
  LayoutPersistencePlayground,
} from "./playground/LayoutExamples";
import { AdvancedPlayground as AdvancedTestHarness } from "./playground/AdvancedPlayground";
import { LayoutPlayground as LayoutTestHarness } from "./playground/LayoutPlayground";
import { PlaygroundShell } from "./playground/PlaygroundShell";
import { TransferPlayground } from "./playground/TransferPlayground";
import {
  WidgetBasicPlayground,
  WidgetResizePlayground,
  WidgetEventsPlayground,
  WidgetManagePlayground,
} from "./playground/WidgetExamples";
import { WidgetPlayground as WidgetTestHarness } from "./playground/WidgetPlayground";
import { compatibilityRoutes, playgroundPaths } from "./playground/routes";
import { ReadmeDemoPage } from "./readme-demo";
import { resolveFrameworkRoute, frameworkExamplePath } from "./shared/framework-navigation";
import { VuePreview } from "./playground/VuePreview";
import "gridstack/dist/gridstack.min.css";
import "../../src/styles.css";
import "./styles.css";
import "./playground/framework-shell.css";

const canonicalPaths = new Set([
  "/api",
  "/docs/getting-started",
  "/docs/core-and-vue",
  ...playgroundPaths,
  "/readme-demo",
  "/__test__/widget",
  "/__test__/layout",
  "/__test__/advanced",
]);

function resolveInitialPath(pathname: string) {
  const frameworkRoute = resolveFrameworkRoute(pathname);
  if (frameworkRoute) return frameworkRoute.explicit ? frameworkExamplePath(frameworkRoute.example.id, frameworkRoute.framework) : frameworkRoute.example.path;
  if (canonicalPaths.has(pathname)) {
    return pathname;
  }

  return compatibilityRoutes[pathname] ?? "/examples/widget/basic";
}

function replaceBrowserPath(pathname: string) {
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${window.location.search}${window.location.hash}`,
  );
}

const initialPath = resolveInitialPath(window.location.pathname);
if (initialPath !== window.location.pathname) {
  replaceBrowserPath(initialPath);
}

function ExampleApp() {
  const location = useLocation();
  const canonicalPath = resolveInitialPath(location.pathname);

  useEffect(() => {
    // A newer browser navigation may precede this concurrent route's effect.
    // Only normalize the location that still owns the current history entry.
    if (location.pathname === canonicalPath || window.location.pathname !== location.pathname) {
      return;
    }

    replaceBrowserPath(canonicalPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [canonicalPath, location.pathname]);

  if (location.pathname !== canonicalPath) {
    return null;
  }

  const frameworkRoute = resolveFrameworkRoute(location.pathname);
  const playground = frameworkRoute?.framework === "vue"
    ? <VuePreview exampleId={frameworkRoute.example.id} />
    : renderPlaygroundRoute(frameworkRoute?.example.path ?? location.pathname);
  if (playground) {
    return <PlaygroundShell routePath={location.pathname}>{playground}</PlaygroundShell>;
  }

  switch (location.pathname) {
    case "/api":
    case "/docs/getting-started":
    case "/docs/core-and-vue":
      return <DocsShell />;
    case "/readme-demo":
      return <ReadmeDemoPage />;
    default:
      return null;
  }
}

const advancedFeatureByPath: Readonly<Record<string, AdvancedFeature>> = {
  "/examples/advanced/cell-height": "cell-height",
  "/examples/advanced/grid-lines": "grid-lines",
  "/examples/advanced/float": "float",
  "/examples/advanced/mobile-touch": "mobile-touch",
  "/examples/advanced/rtl": "rtl",
  "/examples/advanced/title-drag": "title-drag",
  "/examples/advanced/transform": "transform",
};

function renderPlaygroundRoute(pathname: string) {
  switch (pathname) {
    case "/__test__/widget": return <WidgetTestHarness />;
    case "/__test__/layout": return <LayoutTestHarness />;
    case "/__test__/advanced": return <AdvancedTestHarness />;
    case "/examples/widget/resize": return <WidgetResizePlayground />;
    case "/examples/widget/basic": return <WidgetBasicPlayground />;
    case "/examples/widget/manage": return <WidgetManagePlayground />;
    case "/examples/widget/events": return <WidgetEventsPlayground />;
    case "/examples/layout/basic": return <LayoutBasicPlayground />;
    case "/examples/layout/lock": return <LayoutLockPlayground />;
    case "/examples/advanced/size-to-content": return <ContentSizingPlayground />;
    case "/examples/advanced/responsive": return <ResponsivePlayground />;
    case "/examples/advanced/lazy-load": return <LazyRenderPlayground />;
    case "/examples/layout/persistence": return <LayoutPersistencePlayground />;
    case "/examples/layout/arrange": return <LayoutArrangePlayground />;
    case "/examples/layout/events": return <LayoutEventsPlayground />;
    case "/examples/advanced/nested/basic": return <NestedBasicPlayground />;
    case "/examples/advanced/external-drop-trash": return <ExternalDropTrashPlayground />;
    case "/examples/advanced/multi-grid/horizontal": return <TransferPlayground />;
    case "/examples/advanced/public-api": return <PublicApiPlayground />;
    default: {
      const feature = advancedFeatureByPath[pathname];
      return feature ? <AdvancedFeaturePlayground feature={feature} /> : null;
    }
  }
}

declare global {
  interface Window {
    __cominsGridLayoutExampleRoot?: Root;
    __cominsGridLayoutLastUnmount?: { routePath: string } | string;
  }
}

const container = document.getElementById("root") as HTMLElement;
const root = window.__cominsGridLayoutExampleRoot ?? createRoot(container);
window.__cominsGridLayoutExampleRoot = root;

root.render(
  <StrictMode>
    <BrowserRouter>
      <ExampleApp />
    </BrowserRouter>
  </StrictMode>,
);

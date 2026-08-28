import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router";

import { DocsShell } from "./docs/DocsShell";
import {
  AdvancedFeaturePlayground,
  NestedAdvancedPlayground,
  NestedBasicPlayground,
  NestedConstraintsPlayground,
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
import { AdvancedPlayground as InternalAdvancedPlayground } from "./playground/AdvancedPlayground";
import { LayoutPlayground as InternalLayoutPlayground } from "./playground/LayoutPlayground";
import { PlaygroundShell } from "./playground/PlaygroundShell";
import { TransferPlayground } from "./playground/TransferPlayground";
import {
  WidgetBasicPlayground,
  WidgetEventsPlayground,
  WidgetManagePlayground,
} from "./playground/WidgetExamples";
import { WidgetPlayground as InternalWidgetPlayground } from "./playground/WidgetPlayground";
import { compatibilityRoutes, playgroundPaths } from "./playground/routes";
import { ReadmeDemoPage } from "./readme-demo";
import "gridstack/dist/gridstack.min.css";
import "../../src/styles.css";
import "./styles.css";

const canonicalPaths = new Set([
  "/api",
  "/docs/getting-started",
  ...playgroundPaths,
  "/readme-demo",
  "/examples/internal/widget",
  "/examples/internal/layout",
  "/examples/internal/advanced",
]);

function resolveInitialPath(pathname: string) {
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
    if (window.location.pathname === canonicalPath) {
      return;
    }

    replaceBrowserPath(canonicalPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [canonicalPath]);

  if (location.pathname !== canonicalPath) {
    return null;
  }

  const playground = renderPlaygroundRoute(location.pathname);
  if (playground) {
    return <PlaygroundShell routePath={location.pathname}>{playground}</PlaygroundShell>;
  }

  switch (location.pathname) {
    case "/api":
    case "/docs/getting-started":
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
  "/examples/advanced/lazy-load": "lazy-load",
  "/examples/advanced/mobile-touch": "mobile-touch",
  "/examples/advanced/responsive/column": "responsive-column",
  "/examples/advanced/responsive/breakpoints": "responsive-breakpoints",
  "/examples/advanced/responsive/none": "responsive-none",
  "/examples/advanced/rtl": "rtl",
  "/examples/advanced/size-to-content": "size-to-content",
  "/examples/advanced/static": "static",
  "/examples/advanced/title-drag": "title-drag",
  "/examples/advanced/transform": "transform",
};

function renderPlaygroundRoute(pathname: string) {
  switch (pathname) {
    case "/examples/internal/widget": return <InternalWidgetPlayground />;
    case "/examples/internal/layout": return <InternalLayoutPlayground />;
    case "/examples/internal/advanced": return <InternalAdvancedPlayground />;
    case "/examples/widget/basic": return <WidgetBasicPlayground />;
    case "/examples/widget/manage": return <WidgetManagePlayground />;
    case "/examples/widget/events": return <WidgetEventsPlayground />;
    case "/examples/layout/basic": return <LayoutBasicPlayground />;
    case "/examples/layout/lock": return <LayoutLockPlayground />;
    case "/examples/layout/persistence": return <LayoutPersistencePlayground />;
    case "/examples/layout/arrange": return <LayoutArrangePlayground />;
    case "/examples/layout/events": return <LayoutEventsPlayground />;
    case "/examples/advanced/nested/basic": return <NestedBasicPlayground />;
    case "/examples/advanced/nested/advanced": return <NestedAdvancedPlayground />;
    case "/examples/advanced/nested/constraints": return <NestedConstraintsPlayground />;
    case "/examples/advanced/multi-grid/horizontal": return (
      <TransferPlayground title={{ ko: "다중 Grid - 가로", en: "Multiple Grids - Horizontal" }} />
    );
    case "/examples/advanced/multi-grid/vertical": return (
      <TransferPlayground
        orientation="vertical"
        title={{ ko: "다중 Grid - 세로", en: "Multiple Grids - Vertical" }}
      />
    );
    case "/examples/advanced/public-api": return <PublicApiPlayground />;
    case "/examples/transfer": return <TransferPlayground />;
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

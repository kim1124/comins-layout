import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router";

import { DocsShell } from "./docs/DocsShell";
import { PlaygroundLocaleProvider } from "./i18n/playground-locale";
import { ReadmeDemoPage } from "./readme-demo";
import "gridstack/dist/gridstack.min.css";
import "../../src/styles.css";
import "./styles.css";

const compatibilityRoutes: Record<string, string> = {
  "/": "/examples/widget",
  "/examples/basic": "/docs/getting-started",
  "/examples/complete": "/examples/advanced",
  "/examples/crud": "/examples/widget",
};

const canonicalPaths = new Set([
  "/api",
  "/docs/getting-started",
  "/examples/advanced",
  "/examples/layout",
  "/examples/layout/columns",
  "/examples/layout/lock",
  "/examples/widget",
  "/readme-demo",
]);

function resolveInitialPath(pathname: string) {
  if (canonicalPaths.has(pathname)) {
    return pathname;
  }

  return compatibilityRoutes[pathname] ?? "/examples/widget";
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

  switch (location.pathname) {
    case "/api":
    case "/docs/getting-started":
    case "/examples/advanced":
    case "/examples/layout":
    case "/examples/layout/columns":
    case "/examples/layout/lock":
    case "/examples/widget":
      return <DocsShell />;
    case "/readme-demo":
      return <ReadmeDemoPage />;
    default:
      return null;
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
    <PlaygroundLocaleProvider>
      <BrowserRouter>
        <ExampleApp />
      </BrowserRouter>
    </PlaygroundLocaleProvider>
  </StrictMode>,
);

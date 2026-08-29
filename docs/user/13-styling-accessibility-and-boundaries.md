# Styling, Accessibility, and Boundaries

Import both stylesheets once. Package rules are scoped under `.comins-grid-layout` and do not apply a global reset.

```tsx
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";

export function BrandedDashboard() {
  return (
    <div className="brand-dashboard">
      <DashboardGrid
        className="brand-dashboard__grid"
        widgets={dashboard.widgets}
        actionLabels={{ maximize: "Expand", minimize: "Collapse", restore: "Restore", remove: "Delete" }}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => widget.title}
      />
    </div>
  );
}
```

Override package variables on a local container. Common variables include `--comins-grid-layout-accent`, `--comins-grid-layout-border`, `--comins-grid-layout-surface`, `--comins-grid-layout-text`, `--comins-grid-layout-radius`, `--comins-grid-layout-shadow`, and `--comins-grid-layout-header-min-height`.

Built-in action buttons are keyboard-operable and use the widget title plus `actionLabels` for accessible names. When `renderWidgetActions` replaces them, supply button semantics, keyboard behavior, focus indicators, and labels. Widget move/resize is pointer/touch only; the package does not provide keyboard movement or resizing.

## Supported and unsupported boundaries

- React and React DOM `>=18 <20` are peer dependencies. Type declarations are included.
- Desktop Chrome is automated; representative Firefox and mobile Chromium touch scenarios are covered. Branded Edge and Safari are not directly certified and require consumer validation.
- SSR frameworks require a client boundary. There are no Next.js-only APIs.
- Explicit nested `DashboardGrid` composition is supported. Native dynamic GridStack sub-grid ownership is not.
- External HTML targets are same-document light DOM. Cross-frame and shadow-root targeting are not supported.
- Lazy rendering defers React content only; it is not virtualization and has no package skeleton API.
- The package makes no runtime requests and provides no storage, telemetry, authentication, data fetching, or server integration.
- `widgets` and serialized `data` are application-owned; validate permissions and sensitive content before rendering or persisting them.

Use `showControls`, `renderWidget`, and `renderWidgetActions` to adapt the shell without bypassing controlled state.

# Lazy Rendering

Use `lazyRenderWidget` to defer expensive React widget content until it first intersects the scroll boundary. GridStack item geometry and the package widget shell remain mounted, so this is content deferral rather than full widget virtualization.

```tsx
<div data-dashboard-lazy-scroll style={{ maxHeight: 480, overflow: "auto" }}>
  <DashboardGrid
    lazyRenderWidget
    widgets={dashboard.widgets}
    onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
    renderWidget={(widget) => <ExpensiveChart metric={widget.data} />}
  />
</div>
```

When grid-level lazy rendering is enabled, widgets are lazy by default. Set a widget's `lazyLoad: false` to render it eagerly. Setting `lazyLoad: true` on a widget does not enable the feature unless `lazyRenderWidget` is also enabled.

Add `data-dashboard-lazy-scroll` to the nearest scroll container to make it the `IntersectionObserver` root. Without that ancestor, the viewport is the root. When `IntersectionObserver` is unavailable, content renders eagerly. Once content becomes visible it stays mounted.

The native `engineOptions.lazyLoad` mapping remains only for `0.2.1` compatibility and is planned for removal in `0.3.0`; it does not defer React-owned content. Use the component prop and widget flag for new code.

The package does not supply skeletons, loading placeholders, unmount-on-exit behavior, or data fetching. Implement those inside `renderWidget` when required.

Playground: `/examples/advanced/lazy-load`.

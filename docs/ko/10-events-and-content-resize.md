# 이벤트와 content resize

Layout event는 좌표 동기화, lifecycle event는 조작 관찰, resize frame event는 pixel 기반 content 갱신에 사용합니다.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  onWidgetLayoutChange={(id, layout) => updateSpatialIndex(id, layout)}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  onWidgetResizeFrame={({ id, width, height }) => chartRegistry.get(id)?.resize(width, height)}
  onBeforeMove={(event) => setActiveInteraction(event.id)}
  onMove={(event) => showLiveCoordinates(event.layout)}
  onAfterMove={() => setActiveInteraction(null)}
  onBeforeResize={(event) => setActiveInteraction(event.id)}
  onResize={(event) => showLiveSize(event.layout)}
  onAfterResize={() => setActiveInteraction(null)}
  renderWidget={(widget) => <Chart id={widget.id} />}
/>
```

변경된 snapshot을 commit하면 각 layout의 `onWidgetLayoutChange`가 먼저 호출되고 전체 snapshot의 `onLayoutCommit`이 한 번 호출됩니다. 동일 중복 commit은 억제됩니다.

`onWidgetResizeFrame`은 animation frame에 맞춰 실제 pixel `width`, `height`를 전달합니다. Cell geometry를 주는 `onResize`와 다른 용도이며 chart, table, canvas resize에 적합합니다.

Hook의 `onLayoutMutation`은 React commit 후 command transition을 관찰하며 mutation kind, 영향 ID, columns, 전체 상태 snapshot을 제공합니다. Component interaction event를 대체하지는 않습니다.

Playground: `/examples/layout/events`, `/examples/widget/events`.

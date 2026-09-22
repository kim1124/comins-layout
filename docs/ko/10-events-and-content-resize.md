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

이동은 `onBeforeMove` → `onMove` → `onAfterMove`, 크기 변경은 `onBeforeResize` → `onResize` → `onAfterResize` 순서로 관찰합니다. 진행 중 이벤트는 animation frame 단위로 합쳐집니다. Before callback으로 조작을 취소할 수는 없습니다. After는 필요한 layout callback을 호출한 뒤 실행되며 React의 화면 갱신이나 소비자 비동기 작업 완료를 기다린다는 의미가 아닙니다.

제목 더블클릭은 `onBeforeTitleDoubleClick` → `onTitleDoubleClick` → `onAfterTitleDoubleClick` 순서입니다. 세 이벤트는 동일한 조작 전 layout을 전달합니다. 최대화 등 실제 동작은 소비자가 callback에 연결합니다.

Hook 옵션인 `onLayoutMutation`은 React commit 후 command에 의한 상태 변경을 관찰하며 mutation kind, 영향 ID, columns, 전체 상태 snapshot을 제공합니다. `DashboardGrid` prop이나 포인터 조작 이벤트가 아닙니다. 좌표가 그대로여도 위젯 잠금·이동 허용 같은 속성 변경은 `widget:update`로 기록됩니다. kind는 `widget:add`, `widget:update`, `widget:remove`, `widgets:clear`, `layout:commit`, `layout:reset`, `layout:restore`, `layout:arrange`, `layout:fill`, `columns:change`입니다.

Playground: `/examples/layout/events`, `/examples/widget/events`.

제어 상태 적용 후 엔진이 배치·컬럼 경계·콘텐츠 높이를 보정해도 같은 commit callback으로 변경된 layout을 전달하며 중복은 억제합니다. `refreshKey` 또는 `refresh()`는 크기 맞춤이 설정된 콘텐츠를 다시 측정합니다. 드래그·리사이즈 중에는 보정된 layout commit을 조작 종료까지 지연합니다.

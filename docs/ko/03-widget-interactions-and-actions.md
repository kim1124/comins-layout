# 위젯 조작과 액션

그리드의 `editable`, `movable`, `resizable` 기본값은 `true`입니다. `editable={false}`는 이동과 크기 변경을 모두 막습니다. 각 위젯의 `locked`, `movable`, `resizable`로 개별 제약을 추가할 수 있습니다.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  showControls
  actionLabels={{ maximize: "최대화", minimize: "최소화", restore: "복원", remove: "삭제" }}
  renderWidget={(widget) => widget.title}
  renderWidgetActions={(widget) => (
    <button type="button" onClick={() => openDetails(widget.id)}>상세</button>
  )}
  onMaximizeWidget={dashboard.commands.maximizeWidget}
  onMinimizeWidget={dashboard.commands.minimizeWidget}
  onRestoreWidget={dashboard.commands.restoreWidget}
  onRemoveWidget={dashboard.commands.removeWidget}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  onBeforeMove={(event) => audit("move:start", event)}
  onMove={(event) => audit("move:active", event)}
  onAfterMove={(event) => audit("move:end", event)}
  onBeforeResize={(event) => audit("resize:start", event)}
  onResize={(event) => audit("resize:active", event)}
  onAfterResize={(event) => audit("resize:end", event)}
  onTitleDoubleClick={(event) => dashboard.commands.maximizeWidget(event.id)}
/>
```

`showControls={false}`는 기본 액션 버튼을 숨깁니다. `renderWidgetActions`를 지정하면 기본 액션 그룹 전체를 대체하므로 버튼 label, 키보드 동작, focus 표시는 소비자가 책임집니다.

이동 lifecycle은 `onBeforeMove` → `onMove` → commit → `onAfterMove`, resize는 `onBeforeResize` → `onResize` → commit → `onAfterResize`입니다. active event는 animation frame 단위로 합쳐집니다. 제목 더블클릭은 `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, `onAfterTitleDoubleClick` 순서이며 자동 상태 변경은 없습니다.

`0.2.1`에는 `onWidgetDragStart`, `onWidgetDragStop`, `onWidgetResizeStart`, `onWidgetResizeStop`, `onWidgetHeaderDoubleClick`이 호환 alias로 남아 있지만 deprecated이며 `0.3.0` 제거 예정입니다. 신규 코드는 canonical callback만 사용합니다.

Playground: `/examples/layout/basic`, `/examples/layout/lock`, `/examples/widget/events`.

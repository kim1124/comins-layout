# 위젯 조작과 액션

그리드의 `editable`, `movable`, `resizable` 기본값은 `true`입니다. `editable={false}`는 이동과 크기 변경을 모두 막습니다. 각 위젯의 `locked`, `movable`, `resizable`로 개별 제약을 추가할 수 있습니다.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  showControls
  actionLabels={{ restore: "복원", remove: "삭제" }}
  renderWidget={(widget) => widget.title}
  renderWidgetActions={(widget) => (
    <button type="button" onClick={() => openDetails(widget.id)}>상세</button>
  )}
  onRestoreWidget={dashboard.commands.restoreWidget}
  onRemoveWidget={dashboard.commands.removeWidget}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  onBeforeMove={(event) => audit("move:start", event)}
  onMove={(event) => audit("move:active", event)}
  onAfterMove={(event) => audit("move:end", event)}
  onBeforeResize={(event) => audit("resize:start", event)}
  onResize={(event) => audit("resize:active", event)}
  onAfterResize={(event) => audit("resize:end", event)}
  titleDoubleClickAction="none"
  onTitleDoubleClick={(event) => dashboard.commands.resizeWidget(event.id, { w: 6, h: 3 })}
/>
```

`showControls={false}`는 기본 액션 버튼을 숨깁니다. `renderWidgetActions`를 지정하면 기본 액션 그룹 전체를 대체하므로 버튼 label, 키보드 동작, focus 표시는 소비자가 책임집니다.

이동 lifecycle은 `onBeforeMove` → `onMove` → commit → `onAfterMove`, resize는 `onBeforeResize` → `onResize` → commit → `onAfterResize`입니다. active event는 animation frame 단위로 합쳐집니다. 제목 더블클릭은 `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, `onAfterTitleDoubleClick` 순서입니다. 기본 빈 공간 채우기 결과는 onLayoutCommit으로 전달됩니다.

`0.2.x` 전반에는 `onWidgetDragStart`, `onWidgetDragStop`, `onWidgetResizeStart`, `onWidgetResizeStop`, `onWidgetHeaderDoubleClick`이 호환 alias로 남아 있지만 deprecated입니다. `0.3.0`에서도 기존 동작을 유지하며 제거는 후속 버전으로 이연합니다. 신규 코드는 canonical callback만 사용합니다.

Playground: `/examples/layout/basic`, `/examples/layout/lock`, `/examples/widget/events`.

## 명시적 크기 조절·복원과 제목 더블 클릭

- `resizeWidget(id, { w, h })`: 유한한 W/H를 정수로 반올림하고 minW/maxW/minH/maxH와 현재 컬럼 범위를 적용합니다. 존재하지 않는 ID·유한하지 않은 값은 무시합니다. 가능한 한 위치를 유지하며 충돌 시 엔진이 다른 위젯을 이동할 수 있습니다. 콘텐츠 자동 높이가 켜져 있으면 재측정 결과가 H를 다시 변경할 수 있습니다.
- `maximizeWidget`, `minimizeWidget`은 deprecated 호환 API입니다. 기존 최대화는 x=0/y=0/전체 컬럼/최소 H3, 최소화는 W 유지/H1입니다. 전체 화면·최소 허용 크기 동작으로 변경하지 않습니다. 기본 버튼은 제거되었으며 신규 구현은 `resizeWidget`을 사용합니다.
- `restoreWidget(id)`: 최초 API 크기 변경 또는 legacy 상태 전환 전 저장한 해당 위젯의 위치·크기를 복원하고 표시 플래그를 해제합니다. 연속 크기 변경에서도 최초 저장값을 유지합니다. 직전 작업 취소나 전체 배치 초기화가 아닙니다. 저장값이 없으면 좌표를 유지합니다.
- 제목 더블 클릭의 기본값은 `titleDoubleClickAction="fill"`입니다. 같은 시작 행의 빈 컬럼을 선택 위젯에 할당하며 최대 너비 제약을 따릅니다. `onLayoutCommit`을 상태에 연결해야 결과가 유지됩니다. `titleDoubleClickAction="none"`은 기본 확장을 끄고 이벤트만 전달하므로 앱 고유 동작을 연결할 때 사용합니다. `DashboardWidgetShell` 단독 사용은 이벤트만 제공합니다.
- 기본 확장은 그리드·위젯 이동/리사이즈 잠금 및 `staticGrid`, 최대화·최소화 중에는 실행하지 않습니다. 직접 호출하는 상태 명령과 앱 버튼은 별도로 제어해야 합니다.

Vue도 동일한 `titleDoubleClickAction` prop을 사용합니다. 템플릿에서는 `:title-double-click-action="'none'"`, 결과는 `@layout-commit="commands.applyLayoutSnapshot"`으로 연결합니다.

예제: `/examples/widget/resize/react`, `/examples/widget/resize/vue`. Core에서는 `resizeDashboardWidget(state, id, { w, h })`를 사용합니다. `onMaximizeWidget`과 `onMinimizeWidget`은 deprecated 타입으로 유지하지만 기본 버튼에서 호출하지 않습니다.

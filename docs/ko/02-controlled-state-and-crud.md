# 제어 상태와 CRUD

대시보드를 직렬화 가능한 React 상태로 유지하려면 `useDashboardGrid`를 사용합니다. `initialColumns`와 `initialWidgets`는 최초 한 번만 초기화에 쓰며, 이후 변경은 command 또는 복원 스냅샷으로 적용합니다.

```tsx
export function EditableDashboard() {
  const dashboard = useDashboardGrid({
    initialColumns: 12,
    initialWidgets: [],
    onLayoutMutation: (event) => console.log(event.kind, event.snapshot),
  });

  const addMetric = () => {
    const id = crypto.randomUUID();
    dashboard.commands.addWidget({
      id,
      title: "지표",
      layout: { id, x: 0, y: 0, w: 3, h: 2 },
    });
  };

  return (
    <>
      <button type="button" onClick={addMetric}>지표 추가</button>
      <DashboardGrid
        columns={dashboard.columns}
        widgets={dashboard.widgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}
```

`widget.id`와 `widget.layout.id`에는 같은 ID를 사용합니다. 중복 ID 또는 유효하지 않은 삽입 좌표는 거부됩니다.

- `addWidget`, `insertWidgetAt`: 기본 좌표 또는 drop 좌표에 위젯을 추가합니다.
- `updateWidget`, `updateWidgetLayout`: 전체 모델 또는 좌표만 갱신합니다.
- `removeWidget`, `clearWidgets`: 한 위젯 또는 전체 위젯을 제거합니다.
- `maximizeWidget`, `minimizeWidget`, `restoreWidget`: 복원 좌표를 유지하면서 표시 상태를 변경합니다.
- `applyLayoutSnapshot`: GridStack이 확정한 좌표를 React 상태에 반영합니다.
- `refreshLayout`: `refreshVersion`을 올려 component의 refresh를 요청합니다.

root export의 `insertDashboardWidgetAtLayout`, `serializeDashboardState`, `transferDashboardWidget`은 입력을 직접 변경하지 않는 순수 helper입니다. 원시 GridStack add/remove는 React 상태를 갱신하지 않으므로 사용하지 않습니다.

Playground: `/examples/widget/manage`.

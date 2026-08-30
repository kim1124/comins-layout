# 고급 GridStack 접근

제어 component가 선언적으로 제공하지 않는 query와 engine 작업에는 `DashboardGridHandle` ref를 사용합니다. Client adapter 준비 전 또는 unmount 후에는 query 결과가 `null`일 수 있습니다.

```tsx
const gridRef = useRef<DashboardGridHandle>(null);

function compactAndCommit() {
  gridRef.current?.compact("compact", true);
}

<DashboardGrid
  ref={gridRef}
  widgets={dashboard.widgets}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => widget.title}
/>
```

- `getColumnCount`, `getRowCount`, `getFloat`: 현재 engine 상태를 조회합니다.
- `isAreaEmpty`, `willItFit`: `x`, `y`, `w`, `h` geometry를 검사합니다.
- `refresh`: adapter를 즉시 동기화합니다. 일반적으로는 hook의 `refreshLayout`과 component `refreshKey`를 사용합니다.
- `compact`: GridStack compact를 실행하고 제어 commit을 발생시킨 뒤 layout snapshot을 반환합니다.
- `commitLayout`: 현재 snapshot을 emit/deduplicate하고 반환합니다.
- `getGridStack`: 마지막 escape hatch로 전체 GridStack instance를 빌려옵니다.

`compact`는 위 예제의 `onLayoutCommit` 경로를 이미 사용합니다. GridStack change를 발생시키지 않는 다른 원시 geometry 변경 후에는 `commitLayout`을 호출하면 같은 callback으로 React 상태가 갱신됩니다. Borrowed instance에서 raw widget CRUD, `destroy()`, package listener 제거를 실행하면 안 됩니다. Engine과 DOM lifecycle은 `DashboardGrid`가 소유합니다.

Playground: `/examples/advanced/public-api`, API reference: `/api`.

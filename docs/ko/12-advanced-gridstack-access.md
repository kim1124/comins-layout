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

- `getColumnCount`, `getRowCount`, `getFloat`: 현재 engine 상태를 조회합니다. `getRowCount`는 `minRow`를 포함한 현재 행 수이며 최대 수용량이 아닙니다.
- `isAreaEmpty`: 지정한 `x`, `y`, `w`, `h` 영역에 기존 위젯이 없는지 확인합니다.
- `willItFit`: 위젯 추가 시 엔진이 재배치하더라도 `maxRow` 높이 제한 안에 들어가는지 확인합니다. 빈 영역 검사와 다르며 `maxRow` 제한이 없으면 항상 `true`입니다.
- `refresh`: 콘텐츠와 핸들을 다시 측정하고 활성 조작이 끝난 뒤 보정 좌표를 commit합니다. 반환값은 없습니다. 일반적으로는 hook의 `refreshLayout`과 component `refreshKey`를 사용합니다.
- `compact`: GridStack compact를 실행하고 제어 commit을 발생시킨 뒤 layout snapshot을 반환합니다.
- `commitLayout`: 현재 snapshot을 emit/deduplicate하고 반환합니다.
- `getGridStack`: 마지막 escape hatch로 전체 GridStack instance를 빌려옵니다.

`compact`는 위 예제의 `onLayoutCommit` 경로를 이미 사용합니다. React 상태 반영은 위 코드처럼 소비자가 callback을 연결해야 이루어집니다. GridStack change를 발생시키지 않는 다른 원시 geometry 변경 후에는 `commitLayout`을 호출하면 같은 callback으로 snapshot을 전달합니다. Borrowed instance에서 raw widget CRUD, `destroy()`, package listener 제거를 실행하면 안 됩니다. Engine과 DOM lifecycle은 `DashboardGrid`가 소유합니다. `batchUpdate()`를 사용하면 `batchUpdate(false)` 후 commit합니다. 제어 상태 적용은 소비자 batch 종료까지 기다린 뒤 기존 위젯 DOM을 유지하며 최신 snapshot을 적용합니다.

Playground: `/examples/advanced/public-api`, API reference: `/api`.

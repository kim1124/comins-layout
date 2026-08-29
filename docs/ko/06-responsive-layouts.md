# 반응형 레이아웃

컨테이너 또는 window 폭으로 활성 컬럼을 계산하려면 `responsive`를 사용합니다. `columns`는 React 상태로 유지하고 `onColumnsChange`를 `setColumns`에 연결해야 렌더링, 직렬화, 엔진 상태가 일치합니다.

```tsx
<DashboardGrid
  columns={dashboard.columns}
  widgets={dashboard.widgets}
  responsive={{
    breakpoints: [
      { maxWidth: 640, columns: 1, layout: "list" },
      { maxWidth: 960, columns: 6, layout: "moveScale" },
      { maxWidth: 1280, columns: 12, layout: "moveScale" },
    ],
    breakpointForWindow: false,
  }}
  onColumnsChange={dashboard.commands.setColumns}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => widget.title}
/>
```

`responsive`에는 양수 `columnWidth` 또는 하나 이상의 breakpoint가 필요합니다. `columnMax`와 breakpoint `columns`는 `1..12`, `maxWidth`는 중복되지 않는 양수여야 합니다. layout 전략은 `list`, `compact`, `moveScale`, `move`, `scale`, `none`입니다.

`breakpointForWindow: true`일 때만 window 폭을 기준으로 합니다. 기본은 grid container 기준입니다. 방문한 컬럼마다 별도 좌표를 보관하므로 `12 → 6 → 12` 전환 시 기존 12컬럼 좌표가 복원됩니다. 이 cache까지 저장하려면 `serializeState`를 사용합니다.

유효하지 않은 설정은 `DashboardGridConfigurationError`를 발생시킵니다.

Playground: `/examples/advanced/responsive/column`, `/examples/advanced/responsive/breakpoints`.

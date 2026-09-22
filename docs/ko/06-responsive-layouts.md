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

`columnWidth`는 컬럼 개수를 계산하는 기준 폭이며 고정 셀 너비가 아닙니다. 기준 폭으로 나눈 값을 반올림하고 `columnMax` 범위로 제한하므로 실제 셀 너비는 달라질 수 있습니다. `breakpoints`를 함께 지정하면 breakpoint 규칙이 우선합니다. 예제의 폭과 컬럼 수는 비교용 설정이며 패키지 기본값이 아닙니다.

`none`은 반응형 기능을 끄는 값이 아니라 컬럼 변경 시 위치와 크기를 비례 변환하지 않는 전략입니다. 가능한 한 그리드 단위의 `x`와 `w`를 유지하지만 픽셀 크기를 고정하지는 않습니다. 활성 컬럼 경계를 벗어나거나 위젯이 겹치는 경우에는 좌표와 너비가 보정될 수 있습니다. 이미 방문한 컬럼은 해당 컬럼에 저장된 배치를 복원합니다.

Playground: `/examples/advanced/responsive`.

한 화면에서 **컬럼 결정 방식**(목표 너비 또는 breakpoint)과 **배치 정책**(moveScale 또는 none)을 독립적으로 선택합니다. 컨테이너 너비를 바꾸며 실제 너비, 현재 컬럼 수, 위젯별 x/y/w/h를 확인합니다. 화면이 좁으면 실제 너비는 입력값보다 작을 수 있습니다. 방식·정책 변경 또는 다시 실험은 Grid와 배치 캐시를 초기화하며, 너비만 바꾸면 기존 컬럼 캐시를 유지합니다. 기존 세 반응형 주소는 이 통합 페이지로 연결됩니다.

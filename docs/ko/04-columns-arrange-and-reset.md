# 컬럼, 정렬, 초기화

컬럼 수는 `1`부터 `12`까지 지원합니다. `setColumns`는 범위를 벗어난 숫자를 보정하고, 이전에 사용한 컬럼 수라면 해당 컬럼의 저장 좌표를 복원합니다.

```tsx
<>
  <button type="button" onClick={() => dashboard.commands.setColumns(6)}>6컬럼</button>
  <button type="button" onClick={dashboard.commands.autoArrangeWidgets}>자동 정렬</button>
  <button type="button" onClick={dashboard.commands.fitWidgetsToColumns}>전체 맞춤</button>
  <button type="button" onClick={() => dashboard.commands.resetLayout()}>초기화</button>
  <DashboardGrid
    className="analytics-grid"
    columns={dashboard.columns}
    widgets={dashboard.widgets}
    onColumnsChange={dashboard.commands.setColumns}
    onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
    renderWidget={(widget) => widget.title}
  />
</>
```

- `autoArrangeWidgets`: 위젯 배열 순서대로 왼쪽부터 배치하고 공간이 부족하면 다음 행으로 넘깁니다. 모든 빈틈을 최적으로 채우는 알고리즘은 아닙니다.
- `fitWidgetsToColumns`: 시작 `y`가 같은 위젯을 한 그룹으로 보고, 가로 빈 공간이 있으면 너비를 균등하게 재분배합니다. 컬럼 경계와 각 위젯의 크기 제약을 적용합니다.
- `fitWidgetToColumns`: 지정 위젯이 속한 행의 가로 빈 공간을 해당 위젯의 너비에 더합니다. 전체 맞춤과 달리 다른 위젯에 균등 배분하지 않습니다.
- `resetLayout()`: hook 최초 상태로 돌아갑니다. snapshot을 전달하면 그 값으로 초기화합니다.
- 반응형 설정에서는 `onColumnsChange`를 `setColumns`에 연결해야 엔진과 React 상태가 일치합니다.

컬럼별 좌표 캐시는 독립적입니다. 상세 저장 구조는 [영속화](./05-persistence.md)를 참고합니다.

Playground: `/examples/layout/arrange`.

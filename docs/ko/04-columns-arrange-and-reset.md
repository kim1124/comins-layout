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

- `autoArrangeWidgets`: 위젯을 결정적인 행 우선 순서로 compact합니다.
- `fitWidgetsToColumns`: 활성 위젯 전체를 현재 컬럼 폭 안으로 조정합니다.
- `fitWidgetToColumns`: 지정 ID 하나만 같은 방식으로 조정합니다.
- `resetLayout()`: hook 최초 상태로 돌아갑니다. snapshot을 전달하면 그 값으로 초기화합니다.
- 반응형 설정에서는 `onColumnsChange`를 `setColumns`에 연결해야 엔진과 React 상태가 일치합니다.

컬럼별 좌표 캐시는 독립적입니다. 상세 저장 구조는 [영속화](./05-persistence.md)를 참고합니다.

Playground: `/examples/layout/arrange`.

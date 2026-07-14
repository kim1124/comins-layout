# Open Questions

## Engine Decision

- GridStack을 최종 엔진으로 확정할지, React 전용 `react-grid-layout` 비교 PoC를 먼저 수행할지 결정이 필요하다.

## Controlled State Model

- `DashboardGrid`를 완전 controlled 컴포넌트로 제공할지, 내부 state를 갖는 uncontrolled 모드도 제공할지 결정이 필요하다.

## Maximize Semantics

- 최대화 시 다른 위젯을 숨길지, 현재 컬럼 전체 폭으로 확장하고 아래로 밀어낼지 결정이 필요하다.

## Minimize Semantics

- 최소화 시 height를 `1`로 줄일지, 헤더만 남기는 별도 상태를 둘지 결정이 필요하다.

## Auto Arrange Semantics

- 자동 정렬을 GridStack compact 동작으로 볼지, Comins 전용 정렬 규칙을 둘지 결정이 필요하다.

## Accessibility

- 키보드 기반 이동과 크기 조절을 초기 범위에 포함할지 결정이 필요하다.

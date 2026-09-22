# 영속화

장기 저장에는 `serializeState`를 사용합니다. 활성 위젯, 최대화/최소화 복원 좌표, 방문한 컬럼별 좌표를 모두 포함합니다. 현재 컬럼과 좌표만 필요하면 `serializeLayout`을 사용합니다.

```tsx
const STORAGE_KEY = "dashboard:v1";

function saveDashboard() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard.commands.serializeState()));
}

function restoreDashboard() {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value) dashboard.commands.restoreLayout(JSON.parse(value));
}

function resetDashboard() {
  dashboard.commands.resetLayout();
}
```

`serializeLayout`은 `{ columns, widgets }` 형식의 geometry snapshot입니다. `serializeState`는 top-level `widgets`, `previousLayouts`, `layoutsByColumn`을 포함하는 전체 상태입니다.

`restoreLayout` 입력에서는 이전 버전 호환을 위해 `previousLayouts`와 `layoutsByColumn`을 생략할 수 있습니다. 활성 cache와 top-level 상태가 다르면 top-level `widgets`와 `previousLayouts`가 우선합니다. `resetLayout(snapshot)`은 같은 교체 경로를 사용합니다.

React 외부 reducer에서는 순수 helper `serializeDashboardState`를 사용할 수 있습니다. 저장소 선택, schema migration, 암호화, 서버 동기화는 소비자 책임입니다. 신뢰할 수 없는 JSON은 application validation 후 복원해야 합니다.

Playground: `/examples/layout/persistence`. 이 예제의 저장 버튼은 페이지 내부 메모리에만 snapshot을 보관합니다. 페이지를 벗어나거나 새로고침하면 사라지며, 위 코드처럼 저장소에 기록하는 기능은 애플리케이션에서 구현해야 합니다.

저장 전에 `onLayoutCommit={dashboard.commands.applyLayoutSnapshot}` 연결을 유지합니다. 어댑터가 배치와 콘텐츠 크기 보정 결과를 React에 반영하므로 삭제·정렬·Float 변경 후 저장 상태와 실제 화면이 일치합니다. 소비자가 엔진 batch를 열었으면 해당 batch 종료 후 제어 상태를 동기화합니다.

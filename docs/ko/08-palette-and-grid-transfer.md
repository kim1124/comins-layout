# 팔레트와 그리드 전송

전송은 request/commit 구조입니다. DOM drop이 typed request를 만들면 패키지는 임시 engine 이동을 rollback하고, 소비자가 React 상태를 갱신하여 승인 여부를 결정합니다.

```tsx
import {
  DashboardGrid,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  useDashboardDragIn,
  useDashboardGrid,
} from "comins-grid-layout";

let sequence = 0;

export function TransferTarget() {
  const target = useDashboardGrid({ initialColumns: 12 });
  const paletteRef = useDashboardDragIn({
    sourceId: "metric-palette",
    previewLayout: { w: 2, h: 2 },
    createWidget: () => {
      const id = `metric-${++sequence}`;
      return { id, title: "지표", layout: { id, x: 0, y: 0, w: 2, h: 2 } };
    },
  });

  return (
    <>
      <button ref={paletteRef} type="button">지표 드래그</button>
      <DashboardGrid
        gridId="target-grid"
        acceptExternalWidgets
        widgets={target.widgets}
        onLayoutCommit={target.commands.applyLayoutSnapshot}
        onWidgetDropRequest={(request) => {
          const result = insertDashboardWidgetAtLayout(
            target.state,
            request.widget,
            request.targetLayout,
            request.targetSnapshot,
          );
          if (result.accepted) target.commands.restoreLayout(serializeDashboardState(result.state));
        }}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}
```

`useDashboardDragIn`의 `sourceId`는 팔레트 출처, `previewLayout`은 drag geometry입니다. `createWidget`은 drag마다 새로운 안정 ID를 반환해야 합니다. `dragOptions`로 source 조작을 설정하고 `disabled`로 연결을 해제합니다.

Grid 간 전송에서는 source/target마다 고유 `gridId`를 지정합니다. source의 `gridTransferMode`는 `move` 또는 `copy`, target의 `acceptExternalWidgets`는 boolean 또는 predicate입니다. target은 `onWidgetDropRequest`를 처리합니다.

source와 target Grid의 컬럼 너비가 달라도 adapter는 포인터로 잡은 지점의 비율을 보존해 target 셀 좌표로 환산합니다. 따라서 기존 위젯 바로 옆에 놓은 위젯이 한 컬럼 앞에서 충돌해 아래 행으로 내려가지 않습니다.

Grid source request는 `transferDashboardWidget`에 source/target 상태와 request 좌표, snapshot, widget ID, mode를 전달합니다. 승인 결과의 양쪽 상태를 `serializeDashboardState` 후 각 hook에 `restoreLayout`합니다.

거부 사유는 `missing-widget`, `duplicate-id`, `not-transferable`, `invalid-layout`입니다. 동일 상태 전송, locked/이동 불가/최소화/최대화 위젯, 잘못된 mode는 거부되며 양쪽 상태는 변경되지 않아야 합니다.

Playground: `/examples/advanced/multi-grid/horizontal`. 페이지의 배치 방향 컨트롤로 전송 계약은 유지한 채 가로/세로 Grid 배치를 비교합니다.

외부 DOM 드롭 대상에서 consumer 제어 상태로 삭제하는 예제는 `/examples/advanced/external-drop-trash`에서 별도로 확인합니다.

# 외부 HTML 드롭 대상

위젯을 소비자 소유 HTML 위에 놓는 동작을 감지하려면 `externalDropTargets`를 사용합니다. 패키지는 `onWidgetExternalDrop`으로 release를 알릴 뿐 제어 상태를 직접 삭제하거나 수정하지 않습니다.

```tsx
<>
  <DashboardGrid
    widgets={dashboard.widgets}
    externalDropTargets={[{ id: "trash", selector: "#dashboard-trash" }]}
    onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
    onWidgetExternalDrop={(event) => {
      if (event.targetId === "trash") dashboard.commands.removeWidget(event.widgetId);
    }}
    renderWidget={(widget) => widget.title}
  />
  <aside id="dashboard-trash" aria-label="위젯 삭제">여기에 놓아 삭제</aside>
</>
```

event에는 `widgetId`, `targetId`, 활성 `columns`, 확정 `layout`이 포함됩니다. callback은 move layout commit 이후 실행되므로 `onLayoutCommit`도 연결합니다.

target ID는 비어 있지 않고 서로 달라야 합니다. selector는 dashboard owner document에서 해석 가능한 유효한 selector여야 합니다. 동일 document의 light DOM만 지원하며 iframe과 shadow root 대상은 지원하지 않습니다. 대상 밖에 놓으면 event가 발생하지 않습니다.

잘못된 설정은 `DashboardGridConfigurationError`를 발생시킵니다. Grid 간 transfer는 [팔레트와 그리드 전송](./08-palette-and-grid-transfer.md)을 사용합니다.

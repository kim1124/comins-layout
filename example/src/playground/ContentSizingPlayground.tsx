import { useState } from "react";
import { DashboardGrid, useDashboardGrid } from "../../../src";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
import { ExampleToolbar } from "./components/ExampleToolbar";
import { usePlaygroundLocale } from "./locale";

export function ContentSizingPlayground() {
  const { text } = usePlaygroundLocale();
  const [enabled, setEnabled] = useState(true);
  const [count, setCount] = useState(2);
  const dashboard = useDashboardGrid({
    initialColumns: 6,
    initialWidgets: [{ id: "activity", title: "Activity", layout: { id: "activity", x: 0, y: 0, w: 4, h: 2, minH: 1 } }],
  });
  const height = dashboard.widgets[0]?.layout.h;
  return (
    <section className="playground-workspace" data-advanced-feature="size-to-content">
      <PlaygroundHeader kicker={text("고급 예제", "Advanced Examples")} title="Size To Content"
        description={text("내용을 추가·삭제하며 콘텐츠에 맞춰 카드 높이가 늘고 줄어드는 모습을 확인합니다.", "Add and remove content to see the card grow and shrink to fit.")} />
      <PlaygroundFeatureGuide items={[
        text("위젯의 행 수 h를 조정합니다. cellHeight는 유지하며 헤더 높이와 minH/maxH 제약을 포함합니다.", "Adjusts widget height h in rows, preserving cellHeight and respecting the header height and minH/maxH limits."),
        text("이 예제는 켜진 상태로 시작하지만 패키지에서 자동 활성화되지는 않습니다. 고정 높이 카드에는 끈 상태를 사용합니다.", "This example starts enabled; the package does not enable it by default. Leave it off for fixed-height cards."),
        text("내용 추가·삭제 후 refreshKey로 재측정하고 onLayoutCommit으로 React 상태를 갱신합니다. 행 단위로 계산하므로 약간의 빈 공간은 남을 수 있습니다.", "Content changes trigger remeasurement through refreshKey and update React state through onLayoutCommit. Row rounding can leave some empty space."),
        text("끄면 내용이 늘어도 현재 높이를 유지하며 내부에서 스크롤합니다. 수동 리사이즈는 별도 설정이며, 켠 상태에서는 재측정 시 콘텐츠 높이가 다시 적용됩니다.", "When off, added content scrolls within the current height. Manual resizing is a separate setting; when enabled, remeasurement reapplies the content height."),
      ]} code={`const [count, setCount] = useState(2);

<DashboardGrid
  widgets={dashboard.widgets}
  engineOptions={{ sizeToContent: enabled }}
  refreshKey={count}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={() => <ActivityList count={count} />}
/>`} />
      <PlaygroundStage kind="controls">
        <ExampleToolbar id="content-sizing">
          <button type="button" {...toggleStateProps(enabled)} onClick={() => setEnabled(!enabled)}>
            {text(`Size To Content ${enabled ? "켜짐" : "꺼짐"}`, `Size To Content ${enabled ? "on" : "off"}`)}
          </button>
          <button type="button" disabled={count >= 12} onClick={() => setCount(value => value + 1)}>{text("내용 추가", "Add content")}</button>
          <button type="button" disabled={count <= 1} onClick={() => setCount(value => value - 1)}>{text("내용 삭제", "Remove content")}</button>
          <button type="button" onClick={() => setCount(2)}>{text("내용 초기화", "Reset content")}</button>
          <output role="status">{text(`항목 ${count}개 · 현재 h=${height}행`, `${count} items · Current h=${height} rows`)}</output>
        </ExampleToolbar>
      </PlaygroundStage>
      <PlaygroundStage kind="grid">
        <section className="playground-grid-region" aria-label="Size To Content Grid">
          <DashboardGrid columns={dashboard.columns} widgets={dashboard.widgets} showControls={false}
            engineOptions={{ sizeToContent: enabled, cellHeight: 96, animate: false, alwaysShowResizeHandle: true }}
            refreshKey={count} onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
            renderWidget={() => <ul className="content-sizing-list">{Array.from({ length: count }, (_, index) =>
              <li key={index}>{text(`활동 내역 ${index + 1} — 콘텐츠 높이를 비교합니다.`, `Activity ${index + 1} — compare content height.`)}</li>)}</ul>} />
        </section>
      </PlaygroundStage>
    </section>
  );
}

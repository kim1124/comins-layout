import { createRoot } from "react-dom/client";
import { DashboardGrid, useDashboardGrid } from "comins-grid-layout";
import { DashboardGrid as ExplicitGrid } from "comins-grid-layout/react";
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";
if (DashboardGrid !== ExplicitGrid) throw new Error("React alias changed");
function App() {
  const { widgets, columns, commands } = useDashboardGrid<{ value: number }>({ initialWidgets: [{ id: "one", title: "One", layout: { id: "one", x: 0, y: 0, w: 6, h: 3 }, data: { value: 42 } }] });
  return <>
    <button onClick={() => commands.resizeWidget('one', { w: 8, h: 4 })}>Resize One</button>
    <button onClick={() => commands.maximizeWidget('one')}>One 최대화</button>
    <button onClick={() => commands.minimizeWidget('one')}>One 최소화</button>
    <DashboardGrid widgets={widgets} columns={columns} onLayoutCommit={commands.applyLayoutSnapshot} onRestoreWidget={commands.restoreWidget} onRemoveWidget={commands.removeWidget}
      renderWidget={widget => <p data-value>{widget.data?.value.toFixed(0)}</p>} />
  </>;
}
createRoot(document.getElementById("app")!).render(<App />);

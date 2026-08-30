import type { DashboardWidget } from "../../../../src";

import { usePlaygroundLocale } from "../locale";
import type { ExampleWidgetData } from "../types";

export function WidgetSettingsTable({
  movable = true,
  resizable = true,
  widget,
}: {
  movable?: boolean;
  resizable?: boolean;
  widget: DashboardWidget<ExampleWidgetData>;
}) {
  const { text } = usePlaygroundLocale();
  const title = widget.title ?? widget.id;
  const canMove = movable && widget.locked !== true && widget.movable !== false;
  const canResize = resizable && widget.locked !== true && widget.resizable !== false;
  const number = widget.data?.number ?? widget.id;

  return (
    <table
      aria-label={text(`${title} 위젯 설정`, `${title} widget settings`)}
      className="playground-widget-settings"
    >
      <caption>{widget.data?.description ?? title}</caption>
      <tbody>
        <tr><th scope="row">N</th><td>{number}</td></tr>
        <tr><th scope="row">W</th><td>{widget.layout.w}</td></tr>
        <tr><th scope="row">H</th><td>{widget.layout.h}</td></tr>
        <tr><th scope="row">{text("이동", "Movable")}</th><td>{text(canMove ? "가능" : "불가", canMove ? "Yes" : "No")}</td></tr>
        <tr><th scope="row">{text("리사이즈", "Resizable")}</th><td>{text(canResize ? "가능" : "불가", canResize ? "Yes" : "No")}</td></tr>
      </tbody>
    </table>
  );
}

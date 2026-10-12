import { createDashboardGridConnection } from "../../src/browser/grid-connection";
import type { DashboardGridAdapterOptions } from "../../src/gridstack/adapter";
import "gridstack/dist/gridstack.min.css";
import "../../src/styles.css";
const grid = document.querySelector<HTMLElement>(".grid-stack")!;
const connection = createDashboardGridConnection();
let options: DashboardGridAdapterOptions = { columns: 12, widgets: [{ id: "probe", layout: { id: "probe", x: 0, y: 0, w: 2, h: 2 } }] };
document.querySelector("#connect")!.addEventListener("click", () => connection.connect(grid, options));
document.querySelector("#disconnect")!.addEventListener("click", () => connection.disconnect());
document.querySelector("#six")!.addEventListener("click", () => { options = { ...options, columns: 6 }; connection.sync(options); });
const timer = setInterval(() => {
  document.querySelector('[data-test="active"]')!.textContent = connection.getAdapter() ? "1" : "0";
  document.querySelector('[data-test="columns"]')!.textContent = String(connection.getAdapter()?.grid.getColumn() ?? 0);
}, 30);
window.addEventListener("pagehide", () => { clearInterval(timer); connection.disconnect(); }, { once: true });
connection.connect(grid, options);

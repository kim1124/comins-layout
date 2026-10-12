import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardWidgetShell } from "../../src";
import { dashboardActionIcons } from "../../src/ui/icons";

describe("shared widget action assets", () => {
  it("keeps action order, labels and SVG geometry attributes", () => {
    expect(Object.keys(dashboardActionIcons)).toEqual(["maximize", "minimize", "restore", "remove"]);
    const markup = renderToStaticMarkup(<DashboardWidgetShell widget={{ id: "a", title: "매출", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 } }}>내용</DashboardWidgetShell>);
    expect([...markup.matchAll(/aria-label="([^"]+)"/g)].map(match => match[1])).toEqual(["매출 최대화", "매출 최소화", "매출 복원", "매출 삭제"]);
    expect(markup.match(/width="16"/g)).toHaveLength(4);
    expect(markup.match(/height="16"/g)).toHaveLength(4);
    expect(markup.match(/stroke-width="2"/g)).toHaveLength(4);
    expect(markup.match(/aria-hidden="true"/g)).toHaveLength(4);
  });
});

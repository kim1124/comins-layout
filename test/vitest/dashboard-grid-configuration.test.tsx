import { renderToStaticMarkup } from "react-dom/server";
import { DashboardGrid, DashboardGridConfigurationError } from "../../src";

describe("DashboardGrid configuration", () => {
  it("preserves the existing unnamed grid configuration", () => {
    expect(() => renderToStaticMarkup(
      <DashboardGrid
        widgets={[]}
        renderWidget={() => null}
      />,
    )).not.toThrow();
  });

  it("rejects duplicate external drop target definitions during render", () => {
    expect(() => renderToStaticMarkup(
      <DashboardGrid
        widgets={[]}
        externalDropTargets={[
          { id: "trash", selector: "#trash-a" },
          { id: "trash", selector: "#trash-b" },
        ]}
        renderWidget={() => null}
      />,
    )).toThrow(DashboardGridConfigurationError);
  });

  it("fails during render with a non-disclosing public error", () => {
    expect(() => renderToStaticMarkup(
      <DashboardGrid
        widgets={[]}
        engineOptions={{ minRow: 8, maxRow: 2 }}
        renderWidget={() => null}
      />,
    )).toThrow(DashboardGridConfigurationError);

    try {
      renderToStaticMarkup(
        <DashboardGrid
          widgets={[]}
          responsive={{ columnWidth: -240 }}
          renderWidget={() => null}
        />,
      );
    } catch (error) {
      expect((error as Error).message).toBe("Invalid comins-grid-layout configuration.");
      expect((error as Error).message).not.toContain("240");
    }
  });

  it("requires a valid gridId when external widget acceptance is enabled", () => {
    expect(() => renderToStaticMarkup(
      <DashboardGrid
        widgets={[]}
        acceptExternalWidgets
        renderWidget={() => null}
      />,
    )).toThrow(DashboardGridConfigurationError);

    expect(() => renderToStaticMarkup(
      <DashboardGrid
        widgets={[]}
        gridId="target-grid"
        acceptExternalWidgets
        renderWidget={() => null}
      />,
    )).not.toThrow();
  });

  it("replaces default widget controls through the typed action render slot", () => {
    const markup = renderToStaticMarkup(
      <DashboardGrid
        widgets={[{ id: "widget-1", title: "Title 1", layout: { id: "widget-1", x: 0, y: 0, w: 3, h: 2 } }]}
        renderWidget={() => <span>Content 1</span>}
        renderWidgetActions={(widget) => <button type="button">{widget.title} custom action</button>}
      />,
    );

    expect(markup).toContain("Title 1 custom action");
    expect(markup).not.toContain("Title 1 최대화");
    expect(markup).not.toContain("Title 1 최소화");
  });
});

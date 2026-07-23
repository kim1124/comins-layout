import { renderToStaticMarkup } from "react-dom/server";
import { DashboardGrid, DashboardGridConfigurationError } from "../../src";

describe("DashboardGrid configuration", () => {
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
});

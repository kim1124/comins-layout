import {
  DashboardGridConfigurationError,
  type DashboardGridConfiguration,
  validateDashboardGridConfiguration,
} from "../../src";

describe("dashboard grid configuration", () => {
  it("accepts supported engine and responsive options", () => {
    expect(() => validateDashboardGridConfiguration({
      engineOptions: {
        cellHeight: "auto",
        margin: "8px",
        minRow: 1,
        maxRow: 12,
        dragHandle: ".widget-handle",
      },
      responsive: {
        columnMax: 12,
        breakpoints: [
          { maxWidth: 720, columns: 1, layout: "list" },
          { maxWidth: 1200, columns: 6, layout: "moveScale" },
        ],
      },
    })).not.toThrow();
  });

  it.each([
    { engineOptions: { cellHeight: -1 } },
    { engineOptions: { cellHeight: "-1px" } },
    { engineOptions: { margin: Number.NaN } },
    { engineOptions: { margin: "8px -2px" } },
    { engineOptions: { minRow: -1 } },
    { engineOptions: { maxRow: Number.POSITIVE_INFINITY } },
    { engineOptions: { minRow: 4, maxRow: 2 } },
    { responsive: {} },
    { responsive: { columnWidth: 0 } },
    { responsive: { columnWidth: 240, columnMax: 13 } },
    { responsive: { breakpoints: [{ maxWidth: 800, columns: 0 }] } },
    { responsive: { breakpoints: [{ maxWidth: 800, columns: 4 }, { maxWidth: 800, columns: 6 }] } },
  ])("rejects an invalid public configuration without echoing values", (configuration) => {
    const invalidConfiguration = configuration as unknown as DashboardGridConfiguration;
    expect(() => validateDashboardGridConfiguration(invalidConfiguration)).toThrow(DashboardGridConfigurationError);

    try {
      validateDashboardGridConfiguration(invalidConfiguration);
    } catch (error) {
      expect((error as Error).message).toBe("Invalid comins-grid-layout configuration.");
    }
  });
});

import {
  DashboardGridConfigurationError,
  type DashboardGridConfiguration,
  validateDashboardGridConfiguration,
} from "../../src";

describe("dashboard grid configuration", () => {
  it("accepts ordinary external drop target definitions", () => {
    expect(() => validateDashboardGridConfiguration({
      externalDropTargets: [
        { id: "trash", selector: "#widget-trash" },
        { id: "archive", selector: "[data-dashboard-drop-target='archive']" },
      ],
    })).not.toThrow();
  });

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

  it("accepts a named external-widget target and an explicit grid source mode", () => {
    expect(() => validateDashboardGridConfiguration({
      gridId: "analytics-grid",
      acceptExternalWidgets: true,
      gridTransferMode: "copy",
    })).not.toThrow();
    expect(() => validateDashboardGridConfiguration({
      gridId: "operations-grid",
      acceptExternalWidgets: (candidate) => candidate.source.kind === "palette",
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
    { externalDropTargets: [{ id: "", selector: "#trash" }] },
    { externalDropTargets: [{ id: "trash", selector: " " }] },
    {
      externalDropTargets: [
        { id: "trash", selector: "#trash-a" },
        { id: "trash", selector: "#trash-b" },
      ],
    },
    { gridId: " " },
    { acceptExternalWidgets: true },
    { acceptExternalWidgets: () => true },
    { gridTransferMode: "copy" },
    { gridId: "analytics-grid", gridTransferMode: "invalid" },
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

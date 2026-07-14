import { clampDashboardColumnCount, DASHBOARD_COLUMN_COUNTS } from "../../src";

describe("dashboard column helpers", () => {
  it("exposes supported dashboard column counts", () => {
    expect(DASHBOARD_COLUMN_COUNTS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("clamps runtime column values to the supported 1..12 range", () => {
    expect(clampDashboardColumnCount(-1)).toBe(1);
    expect(clampDashboardColumnCount(0)).toBe(1);
    expect(clampDashboardColumnCount(6)).toBe(6);
    expect(clampDashboardColumnCount(12)).toBe(12);
    expect(clampDashboardColumnCount(13)).toBe(12);
    expect(clampDashboardColumnCount(Number.NaN)).toBe(12);
  });
});

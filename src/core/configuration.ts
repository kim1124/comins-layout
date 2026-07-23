import type {
  DashboardColumnCount,
  DashboardColumnLayout,
  DashboardGridEngineOptions,
  DashboardResponsiveOptions,
} from "./types";

const CONFIGURATION_ERROR_MESSAGE = "Invalid comins-grid-layout configuration.";
const COLUMN_LAYOUTS = new Set<DashboardColumnLayout>(["list", "compact", "moveScale", "move", "scale", "none"]);
const CELL_HEIGHT_KEYWORDS = new Set(["auto", "initial"]);
const NO_DIMENSION_KEYWORDS = new Set<string>();

export class DashboardGridConfigurationError extends Error {
  constructor() {
    super(CONFIGURATION_ERROR_MESSAGE);
    this.name = "DashboardGridConfigurationError";
  }
}

export type DashboardGridConfiguration = {
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
};

function fail(): never {
  throw new DashboardGridConfigurationError();
}

function isColumnCount(value: unknown): value is DashboardColumnCount {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 12;
}

function isNonNegativeFinite(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value >= 0);
}

function isDimension(value: number | string | undefined, allowedKeywords: ReadonlySet<string> = NO_DIMENSION_KEYWORDS) {
  if (value === undefined) {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0;
  }

  const parts = value.trim().split(/\s+/);
  return parts.length > 0 && parts.every((part) => {
    if (allowedKeywords.has(part)) {
      return true;
    }
    const match = part.match(/^(-?(?:\d+\.?\d*|\.\d+))(?:px|em|rem|vh|vw|%|cm|mm)?$/);
    return Boolean(match && Number.isFinite(Number(match[1])) && Number(match[1]) >= 0);
  });
}

function isLayout(value: unknown): value is DashboardColumnLayout {
  return value === undefined || COLUMN_LAYOUTS.has(value as DashboardColumnLayout);
}

export function validateDashboardGridConfiguration(configuration: DashboardGridConfiguration): void {
  const engine = configuration.engineOptions;
  if (engine) {
    if (!isDimension(engine.cellHeight, CELL_HEIGHT_KEYWORDS) || !isDimension(engine.margin)) {
      fail();
    }
    if (!isNonNegativeFinite(engine.minRow) || !isNonNegativeFinite(engine.maxRow)) {
      fail();
    }
    if (
      (engine.minRow !== undefined && !Number.isInteger(engine.minRow))
      || (engine.maxRow !== undefined && !Number.isInteger(engine.maxRow))
    ) {
      fail();
    }
    if ((engine.maxRow ?? 0) > 0 && (engine.minRow ?? 0) > (engine.maxRow ?? 0)) {
      fail();
    }
    if (
      (engine.dragHandle !== undefined && engine.dragHandle.trim().length === 0)
      || (engine.resizeHandles !== undefined && engine.resizeHandles.trim().length === 0)
    ) {
      fail();
    }
  }

  const responsive = configuration.responsive;
  if (!responsive) {
    return;
  }
  const breakpoints = responsive.breakpoints ?? [];
  if (responsive.columnWidth === undefined && breakpoints.length === 0) {
    fail();
  }
  if (
    responsive.columnWidth !== undefined
    && (!Number.isFinite(responsive.columnWidth) || responsive.columnWidth <= 0)
  ) {
    fail();
  }
  if (responsive.columnMax !== undefined && !isColumnCount(responsive.columnMax)) {
    fail();
  }
  if (!isLayout(responsive.layout)) {
    fail();
  }

  const widths = new Set<number>();
  for (const breakpoint of breakpoints) {
    if (
      !Number.isFinite(breakpoint.maxWidth)
      || breakpoint.maxWidth <= 0
      || widths.has(breakpoint.maxWidth)
      || !isColumnCount(breakpoint.columns)
      || !isLayout(breakpoint.layout)
    ) {
      fail();
    }
    widths.add(breakpoint.maxWidth);
  }
}

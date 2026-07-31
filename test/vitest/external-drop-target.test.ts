import { describe, expect, it, vi } from "vitest";
import { DashboardGridConfigurationError } from "../../src";
import {
  readDashboardClientPoint,
  resolveDashboardExternalDropTarget,
  validateDashboardExternalDropTargetSelectors,
} from "../../src/gridstack/external-drop-target";

type RenderedTargetOptions = {
  connected?: boolean;
  display?: string;
  visibility?: string;
  rendered?: boolean;
};

const ignoredTargetCases: ReadonlyArray<readonly [string, RenderedTargetOptions]> = [
  ["disconnected", { connected: false }],
  ["display none", { display: "none" }],
  ["visibility hidden", { visibility: "hidden" }],
  ["zero rectangle", { rendered: false }],
];

function createRenderedTarget(options: RenderedTargetOptions = {}) {
  const child = {} as Element;
  const target = {
    isConnected: options.connected ?? true,
    contains: (node: Node) => node === child,
    getClientRects: () => (options.rendered ?? true ? [{ width: 300, height: 300 }] : []),
  } as unknown as HTMLElement;
  return { child, target };
}

function createRenderedTargetHarness() {
  const { child, target } = createRenderedTarget();
  const grid = {
    contains: () => false,
  } as unknown as HTMLElement;
  const document = {
    defaultView: {
      getComputedStyle: () => ({
        display: "block",
        visibility: "visible",
      }),
    },
    elementsFromPoint: () => [child],
    querySelectorAll: () => [target],
  } as unknown as Document;
  return { child, document, grid, target };
}

describe("readDashboardClientPoint", () => {
  it("reads finite client coordinates", () => {
    expect(readDashboardClientPoint({
      clientX: 120,
      clientY: 240,
    } as unknown as Event)).toEqual({ clientX: 120, clientY: 240 });
  });

  it("uses the final changed touch", () => {
    expect(readDashboardClientPoint({
      changedTouches: [
        { clientX: 10, clientY: 20 },
        { clientX: 30, clientY: 40 },
      ],
    } as unknown as Event)).toEqual({ clientX: 30, clientY: 40 });
  });

  it("rejects missing and non-finite coordinates", () => {
    expect(readDashboardClientPoint(new Event("dragstop"))).toBeUndefined();
    expect(readDashboardClientPoint({
      clientX: Number.NaN,
      clientY: 40,
    } as unknown as Event)).toBeUndefined();
  });
});

describe("external drop target resolution", () => {
  it("resolves a descendant of a rendered plain element", () => {
    const { document, grid } = createRenderedTargetHarness();
    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: "#trash" }],
      { clientX: 150, clientY: 150 },
    )).toEqual({ id: "trash", selector: "#trash" });
  });

  it("fails closed for invalid selector syntax", () => {
    const document = {
      querySelectorAll: vi.fn(() => {
        throw new DOMException("invalid", "SyntaxError");
      }),
    } as unknown as Document;
    expect(() => validateDashboardExternalDropTargetSelectors(
      document,
      [{ id: "trash", selector: "[" }],
    )).toThrow(DashboardGridConfigurationError);
  });

  it("converts selector failures discovered during resolution into a configuration error", () => {
    const document = {
      elementsFromPoint: () => [],
      querySelectorAll: vi.fn(() => {
        throw new DOMException("invalid", "SyntaxError");
      }),
    } as unknown as Document;
    const grid = { contains: () => false } as unknown as HTMLElement;

    expect(() => resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: "[" }],
      { clientX: 150, clientY: 150 },
    )).toThrow(DashboardGridConfigurationError);
  });

  it("returns the first configured target when several targets match", () => {
    const { document, grid } = createRenderedTargetHarness();
    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [
        { id: "trash", selector: "#trash" },
        { id: "archive", selector: "#archive" },
      ],
      { clientX: 150, clientY: 150 },
    )).toEqual({ id: "trash", selector: "#trash" });
  });

  it("accepts a hit in any rendered element returned by one selector", () => {
    const missed = createRenderedTarget();
    const matched = createRenderedTarget();
    const grid = { contains: () => false } as unknown as HTMLElement;
    const document = {
      defaultView: { getComputedStyle: () => ({ display: "block", visibility: "visible" }) },
      elementsFromPoint: () => [matched.child],
      querySelectorAll: () => [missed.target, matched.target],
    } as unknown as Document;

    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: ".trash" }],
      { clientX: 150, clientY: 150 },
    )).toEqual({ id: "trash", selector: ".trash" });
  });

  it.each(ignoredTargetCases)("ignores a %s target", (_name, options) => {
    const { child, target } = createRenderedTarget(options);
    const grid = { contains: () => false } as unknown as HTMLElement;
    const document = {
      defaultView: {
        getComputedStyle: () => ({
          display: options.display ?? "block",
          visibility: options.visibility ?? "visible",
        }),
      },
      elementsFromPoint: () => [child],
      querySelectorAll: () => [target],
    } as unknown as Document;

    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: "#trash" }],
      { clientX: 150, clientY: 150 },
    )).toBeUndefined();
  });

  it("ignores targets contained by the grid", () => {
    const { child, target } = createRenderedTarget();
    const grid = { contains: (node: Node) => node === target } as unknown as HTMLElement;
    const document = {
      defaultView: { getComputedStyle: () => ({ display: "block", visibility: "visible" }) },
      elementsFromPoint: () => [child],
      querySelectorAll: () => [target],
    } as unknown as Document;

    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: "#trash" }],
      { clientX: 150, clientY: 150 },
    )).toBeUndefined();
  });

  it("ignores rendered targets that do not contain the hit", () => {
    const { target } = createRenderedTarget();
    const grid = { contains: () => false } as unknown as HTMLElement;
    const document = {
      defaultView: { getComputedStyle: () => ({ display: "block", visibility: "visible" }) },
      elementsFromPoint: () => [{} as Element],
      querySelectorAll: () => [target],
    } as unknown as Document;

    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: "#trash" }],
      { clientX: 150, clientY: 150 },
    )).toBeUndefined();
  });
});

import { createLayoutPlaygroundFixture } from "../../example/src/playground/fixtures";
import {
  PASTEL_COLORS,
  pastelColor,
  pastelKeyForIndex,
} from "../../example/src/playground/palette";

describe("playground widget data", () => {
  it("assigns stable pastel colors by widget index", () => {
    expect(pastelKeyForIndex(0)).toBe("mint");
    expect(pastelKeyForIndex(PASTEL_COLORS.length)).toBe("mint");
    expect(createLayoutPlaygroundFixture().map((widget) => widget.data?.colorKey))
      .toEqual(["mint", "sky", "lemon", "peach", "lavender", "rose"]);
  });

  it("returns the selected pastel presentation", () => {
    expect(pastelColor("mint")).toEqual({
      background: "#dcfce7",
      foreground: "#14532d",
      key: "mint",
    });
  });

  it("creates six varied 12-column widgets without shared references", () => {
    const first = createLayoutPlaygroundFixture();
    const second = createLayoutPlaygroundFixture();
    expect(first.map(({ layout }) => [layout.w, layout.h]))
      .toEqual([[3, 2], [5, 2], [4, 3], [6, 2], [3, 3], [3, 2]]);
    expect(first).not.toBe(second);
    expect(first[0]?.data).not.toBe(second[0]?.data);
  });
});

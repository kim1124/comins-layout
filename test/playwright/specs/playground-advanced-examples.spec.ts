import { expect, test } from "@playwright/test";

import { dragWidget, readWidgetGeometry, resizeWidget } from "../helpers/dashboard-interactions";

test.describe("Advanced engine options", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.goto("/examples/advanced");
  });

  test("explains and changes supported engine options", async ({ page }) => {
    const grid = page.locator(".grid-stack");
    const firstWidget = page.locator(".grid-stack-item").first();

    await expect(grid).toHaveCount(1);
    await expect(page.getByText("화면 너비에 따라 컬럼이 자동으로 변경됩니다.")).toBeVisible();
    await expect(page.getByText("GridStack의 배치, 렌더링과 상호작용 옵션을 변경합니다.")).toBeVisible();

    const floatToggle = page.getByRole("button", { name: "Float 사용" });
    await expect(floatToggle).toHaveAttribute("aria-pressed", "false");
    await floatToggle.click();
    await expect(page.getByRole("button", { name: "Float 해제" })).toHaveAttribute("aria-pressed", "true");

    const staticToggle = page.getByRole("button", { name: "정적 모드 사용" });
    await staticToggle.click();
    await expect(page.getByRole("button", { name: "정적 모드 해제" })).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveClass(/grid-stack-static/);
    const staticGeometry = await readWidgetGeometry(firstWidget);
    await dragWidget(page, firstWidget, 160, 120);
    await expect.poll(() => readWidgetGeometry(firstWidget)).toEqual(staticGeometry);
    await page.getByRole("button", { name: "정적 모드 해제" }).click();

    const initialWidgetBox = await firstWidget.boundingBox();
    expect(initialWidgetBox).not.toBeNull();
    await page.getByRole("combobox", { name: "셀 높이" }).selectOption("80");
    await expect.poll(async () => (await firstWidget.boundingBox())?.height).not.toBe(initialWidgetBox?.height);

    const initialInset = await firstWidget.evaluate((element) => {
      const content = element.querySelector<HTMLElement>(".grid-stack-item-content");
      if (!content) throw new Error("Expected widget content");
      return content.getBoundingClientRect().left - element.getBoundingClientRect().left;
    });
    await page.getByRole("combobox", { name: "여백" }).selectOption("12");
    await expect.poll(() => firstWidget.evaluate((element) => {
      const content = element.querySelector<HTMLElement>(".grid-stack-item-content");
      if (!content) throw new Error("Expected widget content");
      return content.getBoundingClientRect().left - element.getBoundingClientRect().left;
    })).toBeGreaterThan(initialInset);

    await page.getByRole("button", { name: "애니메이션 사용" }).click();
    await expect(page.getByRole("button", { name: "애니메이션 해제" })).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveClass(/grid-stack-animate/);

    await page.getByRole("button", { name: "RTL 사용" }).click();
    await expect(page.getByRole("button", { name: "RTL 해제" })).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveClass(/grid-stack-rtl/);

    await page.getByRole("button", { name: "콘텐츠 높이 사용" }).click();
    await expect(page.getByRole("button", { name: "콘텐츠 높이 해제" })).toHaveAttribute("aria-pressed", "true");

    const rowLimit = page.getByRole("combobox", { name: "행 제한" });
    await expect(rowLimit.locator("option")).toHaveText(["제한 없음", "2–8행", "4–12행"]);
    await rowLimit.selectOption("two-eight");
    const readAppliedRowLimits = () => grid.evaluate((element) => {
      const gridStack = (element as HTMLElement & {
        gridstack?: { opts: { maxRow?: number; minRow?: number } };
      }).gridstack;
      return { maxRow: gridStack?.opts.maxRow ?? 0, minRow: gridStack?.opts.minRow ?? 0 };
    });
    await expect.poll(readAppliedRowLimits).toEqual({ maxRow: 8, minRow: 2 });
    await resizeWidget(page, firstWidget, 0, 1000);
    await expect.poll(async () => {
      const { h, y } = await readWidgetGeometry(firstWidget);
      return y + h;
    }).toBeLessThanOrEqual(8);
    await rowLimit.selectOption("four-twelve");
    await expect.poll(readAppliedRowLimits).toEqual({ maxRow: 12, minRow: 4 });
    await rowLimit.selectOption("none");
    await expect.poll(readAppliedRowLimits).toEqual({ maxRow: 0, minRow: 0 });

    await page.getByRole("button", { name: "반응형 컬럼 사용" }).click();
    await expect(page.getByRole("button", { name: "반응형 컬럼 해제" })).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 600, height: 900 });
    await expect(grid).toHaveAttribute("data-columns", "6");

    await expect(page.getByRole("button", { name: /compact|commit|Grid 정보/ })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
    await expect(page.locator("[data-dashboard-drop-target]")).toHaveCount(0);
  });

  test("exposes only the approved select domains without duplicate state text", async ({ page }) => {
    await expect(page.getByRole("combobox", { name: "셀 높이" }).locator("option")).toHaveText(["60", "80", "100"]);
    await expect(page.getByRole("combobox", { name: "여백" }).locator("option")).toHaveText(["4", "8", "12"]);
    await expect(page.getByRole("combobox", { name: "행 제한" })).toHaveValue("none");
    await expect(page.getByText(/상태:|사용 상태|활성 상태/)).toHaveCount(0);
  });

  test("associates every engine control with distinct localized effect guidance", async ({ page }) => {
    const koreanControls = [
      { name: "Float 사용", phrase: "빈 행", role: "button" },
      { name: "애니메이션 사용", phrase: "이동과 재배치", role: "button" },
      { name: "정적 모드 사용", phrase: "이동과 크기 조절", role: "button" },
      { name: "RTL 사용", phrase: "오른쪽", role: "button" },
      { name: "콘텐츠 높이 사용", phrase: "고유 높이", role: "button" },
      { name: "셀 높이", phrase: "한 행의 높이", role: "combobox" },
      { name: "여백", phrase: "위젯 사이", role: "combobox" },
      { name: "행 제한", phrase: "최소·최대", role: "combobox" },
    ] as const;
    const englishControls = [
      { name: "Enable float", phrase: "empty rows", role: "button" },
      { name: "Enable animation", phrase: "movement and rearrangement", role: "button" },
      { name: "Enable static mode", phrase: "moving and resizing", role: "button" },
      { name: "Enable RTL", phrase: "right edge", role: "button" },
      { name: "Enable content height", phrase: "intrinsic height", role: "button" },
      { name: "Cell height", phrase: "height of one row", role: "combobox" },
      { name: "Margin", phrase: "between widgets", role: "combobox" },
      { name: "Row limit", phrase: "minimum and maximum", role: "combobox" },
    ] as const;

    const expectDescriptions = async (controls: ReadonlyArray<{ name: string; phrase: string; role: "button" | "combobox" }>) => {
      const descriptionIds = new Set<string>();
      for (const control of controls) {
        const locator = page.getByRole(control.role, { name: control.name });
        const descriptionId = await locator.getAttribute("aria-describedby");
        expect(descriptionId, `${control.name} description id`).toBeTruthy();
        descriptionIds.add(descriptionId ?? "");
        await expect(page.locator(`#${descriptionId}`)).toContainText(control.phrase);
      }
      expect(descriptionIds.size).toBe(controls.length);
    };

    await expectDescriptions(koreanControls);
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
    await expectDescriptions(englishControls);
  });

  test("changes real vertical placement when Float is enabled", async ({ page }) => {
    const alerts = page.getByTestId("dashboard-widget-alerts");
    const packedY = Number(await alerts.getAttribute("gs-y"));

    await page.getByRole("button", { name: "Float 사용" }).click();
    await expect.poll(async () => Number(await alerts.getAttribute("gs-y"))).toBeGreaterThan(packedY);

    await page.getByRole("button", { name: "Float 해제" }).click();
    await expect.poll(async () => Number(await alerts.getAttribute("gs-y"))).toBe(packedY);
  });

  test("resizes a tall widget to its intrinsic content height", async ({ page }) => {
    const target = page.getByTestId("dashboard-widget-alerts");
    const before = await target.boundingBox();
    expect(before).not.toBeNull();

    await page.getByRole("button", { name: "콘텐츠 높이 사용" }).click();

    await expect.poll(async () => (await target.boundingBox())?.height).toBeGreaterThan((before?.height ?? 0) + 40);
  });
});

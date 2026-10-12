import { expect, test } from '@playwright/test';

for (const framework of ['react', 'vue']) {
  test(`${framework} widget arrows retain resize/move lock behavior @firefox-parity`, async ({ page }) => {
    await page.goto(`/examples/widget/basic/${framework}`);
    const widget = page.locator('[data-widget-id="widget-1"]');
    const resize = widget.getByRole('button', { name: 'Title 1 리사이즈 잠금', exact: true });
    const move = widget.getByRole('button', { name: 'Title 1 이동 잠금', exact: true });
    // Rendered geometry is the visual contract: two diagonal vs horizontal arrowheads.
    await expect(resize.locator('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    expect(await resize.locator('path').evaluateAll(paths => paths.map(path => path.getAttribute('d')))).toEqual(['M5 19 19 5', 'M5 13v6h6', 'M13 5h6v6']);
    expect(await move.locator('path').evaluateAll(paths => paths.map(path => path.getAttribute('d')))).toEqual(['M4 12h16', 'M8 8l-4 4 4 4', 'M16 8l4 4-4 4']);
    await resize.click();
    await expect(widget.getByRole('row', { name: '리사이즈 불가', exact: true })).toBeVisible();
    await widget.getByRole('button', { name: 'Title 1 리사이즈 잠금 해제', exact: true }).click();
    await expect(widget.getByRole('row', { name: '리사이즈 가능', exact: true })).toBeVisible();
    await move.click();
    await expect(widget.getByRole('row', { name: '이동 불가', exact: true })).toBeVisible();
    await widget.getByRole('button', { name: 'Title 1 이동 잠금 해제', exact: true }).click();
    await expect(widget.getByRole('row', { name: '이동 가능', exact: true })).toBeVisible();
  });

  test(`${framework} select leaves room for its arrow and retains selection and keyboard command access @firefox-parity`, async ({ page }) => {
    await page.goto(`/examples/widget/basic/${framework}`);
    const select = page.getByRole('combobox', { name: '대상 위젯', exact: true });
    const styles = await select.evaluate(element => {
      const style = getComputedStyle(element);
      return { padding: parseFloat(style.paddingRight), image: style.backgroundImage, position: style.backgroundPosition };
    });
    expect(styles.padding).toBeGreaterThanOrEqual(32);
    expect(styles.image).toContain('data:image/svg+xml');
    expect(styles.position).toContain('12px');
    await select.selectOption('widget-2');
    await expect(select).toHaveValue('widget-2');
    await select.focus();
    await select.press('Tab');
    const maximize = page.getByRole('button', { name: '선택 위젯 최대화', exact: true });
    await expect(maximize).toBeFocused();
    await maximize.press('Enter');
    await expect(page.locator('[data-widget-id="widget-2"]')).toHaveAttribute('data-maximized', 'true');
    await expect(page.locator('[data-widget-id="widget-1"]')).toHaveAttribute('data-maximized', 'false');
  });

  test(`${framework} Playground CRUD, runtime columns and arrange/fill commands work on public routes`, async ({ page }) => {
    await page.goto(`/examples/widget/manage/${framework}`);
    const widgets = page.locator('[data-widget-id]');
    await expect(widgets).toHaveCount(10);
    await page.getByRole('button', { name: '추가', exact: true }).click();
    await expect(widgets).toHaveCount(11);
    await page.getByRole('button', { name: '전체 삭제', exact: true }).click();
    await expect(widgets).toHaveCount(0);
    await page.getByRole('button', { name: '초기화', exact: true }).click();
    await expect(widgets).toHaveCount(10);

    await page.goto(`/examples/layout/basic/${framework}`);
    const grid = page.locator('.grid-stack').first();
    for (const columns of [1, 2, 6, 12]) {
      await page.getByRole('combobox', { name: '컬럼', exact: true }).selectOption(String(columns));
      await expect(grid).toHaveAttribute('data-columns', String(columns));
      await expect(widgets).toHaveCount(10);
      expect(await widgets.evaluateAll(elements => elements.every(element => Number(element.getAttribute('gs-x') ?? 0) + Number(element.getAttribute('gs-w') ?? 1) <= Number(element.closest('.grid-stack')!.getAttribute('data-columns'))))).toBe(true);
    }

    await page.goto(`/examples/layout/arrange/${framework}`);
    await page.getByRole('button', { name: '자동 정렬', exact: true }).click();
    await expect(widgets).toHaveCount(10);
    await page.getByRole('button', { name: '빈 공간 채우기', exact: true }).click();
    await expect(page.locator('[data-widget-id="widget-10"]')).toHaveAttribute('gs-w', '6');
    await expect(page.locator('[data-widget-id="widget-10"]')).toHaveAttribute('gs-x', '6');
    await page.getByRole('button', { name: '초기화', exact: true }).click();
    await expect(page.locator('[data-widget-id="widget-10"]')).toHaveAttribute('gs-w', '3');
  });

  test(`${framework} Playground widgets move and resize through actual pointer gestures @firefox-parity`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`/examples/widget/basic/${framework}`);
    await expect.poll(() => page.locator('.grid-stack').first().evaluate(element => Boolean((element as HTMLElement & { gridstack?: unknown }).gridstack))).toBe(true);
    const widget = page.locator('[data-widget-id="widget-1"]');
    const title = widget.locator('.comins-grid-layout-widget__title');
    await title.scrollIntoViewIfNeeded();
    const beforeY = await widget.getAttribute('gs-y');
    const from = (await title.boundingBox())!;
    expect(from.y + from.height / 2 + 192).toBeLessThan(page.viewportSize()!.height);
    await page.mouse.move(from.x + 12, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 24, from.y + from.height / 2, { steps: 3 });
    await expect(widget).toHaveClass(/ui-draggable-dragging/);
    await page.mouse.move(from.x + 12, from.y + from.height / 2 + 192, { steps: 20 });
    await page.mouse.up();
    await expect(widget).not.toHaveAttribute('gs-y', beforeY ?? '0');
    await expect.poll(async () => widget.getAttribute('data-layout-y')).toBe(await widget.getAttribute('gs-y'));
    await widget.scrollIntoViewIfNeeded();
    await widget.hover();
    const handle = widget.locator('.ui-resizable-se');
    await expect(handle).toBeVisible();
    const beforeH = await widget.getAttribute('gs-h');
    const corner = (await handle.boundingBox())!;
    await page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2);
    await page.mouse.down();
    await page.mouse.move(corner.x + corner.width / 2 + 80, corner.y + corner.height / 2 + 96, { steps: 20 });
    await page.mouse.up();
    await expect(widget).not.toHaveAttribute('gs-h', beforeH!);
    await expect.poll(async () => widget.getAttribute('data-layout-h')).toBe(await widget.getAttribute('gs-h'));
  });
}

test('React/Vue mobile controls fit the viewport and remain operable @mobile-touch', async ({ page }) => {
  for (const framework of ['react', 'vue']) {
    await page.goto(`/examples/widget/basic/${framework}`);
    const widget = page.locator('[data-widget-id="widget-1"]');
    await widget.getByRole('button', { name: 'Title 1 이동 잠금', exact: true }).tap();
    await expect(widget.getByRole('row', { name: '이동 불가', exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: '대상 위젯', exact: true }).selectOption('widget-2');
    await page.getByRole('button', { name: '선택 위젯 최대화', exact: true }).tap();
    await expect(page.locator('[data-widget-id="widget-2"]')).toHaveAttribute('data-maximized', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

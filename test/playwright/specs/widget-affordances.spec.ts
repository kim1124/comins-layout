import { expect, test } from '@playwright/test';

for (const framework of ['react', 'vue']) {
  for (const width of [1280, 390]) {
    test(`${framework}: Basic tab spacing at ${width}px @firefox-parity`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/examples/widget/basic/${framework}?locale=ko`);
      await expect(page.getByTestId('dashboard-widget-widget-1')).toBeVisible();
      const tabs = (await page.getByRole('tablist').boundingBox())!;
      const grid = (await page.locator('.playground-example-stage--grid').boundingBox())!;
      expect(grid.y - tabs.y - tabs.height).toBeGreaterThanOrEqual(20);
      expect(grid.y - tabs.y - tabs.height).toBeLessThanOrEqual(24);
    });
  }
  test(`${framework}: title cursor follows widget and grid interaction locks @firefox-parity`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/examples/widget/basic/${framework}?locale=ko`);
    const title = page.getByTestId('dashboard-widget-widget-1').locator('.comins-grid-layout-widget__title');
    await expect(title).toHaveCSS('cursor', 'grab');
    await page.getByRole('button', { name: 'Title 1 이동 잠금', exact: true }).click();
    await expect(title).toHaveCSS('cursor', 'grab'); // Resize remains available.
    await page.getByRole('button', { name: 'Title 1 리사이즈 잠금', exact: true }).click();
    await expect(title).toHaveCSS('cursor', 'default');
    await page.getByRole('button', { name: 'Title 1 이동 잠금 해제', exact: true }).click();
    await expect(title).toHaveCSS('cursor', 'grab');
    await page.goto(`/examples/layout/lock/${framework}?locale=ko`);
    await expect(title).toHaveCSS('cursor', 'grab');
    await page.getByRole('button', { name: '레이아웃 잠금', exact: true }).click();
    await expect(title).toHaveCSS('cursor', 'default');
    await page.getByRole('button', { name: '레이아웃 해제', exact: true }).click();
    await page.getByRole('combobox', { name: '잠금 방식', exact: true }).selectOption('static');
    await page.getByRole('button', { name: '레이아웃 잠금', exact: true }).click();
    await expect(title).toHaveCSS('cursor', 'default');
    await page.getByRole('button', { name: '레이아웃 해제', exact: true }).click();
    await expect(title).toHaveCSS('cursor', 'grab');
    expect(errors).toEqual([]);
  });
}

import { expect, test } from "@playwright/test";
import type { GridStack } from 'gridstack';
import { exampleCatalog } from '../../../example/src/shared/example-catalog';

test('React and Vue share aligned intro, tabs, controls and workspace panels', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const bounds = async () => {
    const selectors = ['.framework-intro', '.framework-tabs', '.playground-example-stage--controls', '.playground-example-stage--grid'];
    return Promise.all(selectors.map(selector => page.locator(selector).first().boundingBox()));
  };
  await page.goto('/examples/widget/resize/react');
  await expect(page.getByRole('tab', { name: 'React', exact: true })).toHaveAttribute('aria-controls', 'framework-panel');
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'framework-tab-react');
  const react = await bounds();
  for (const box of react) expect(box).not.toBeNull();
  const expectRightAlignedControls = async () => {
    const panel = (await page.locator('.playground-example-stage--controls').boundingBox())!;
    const action = (await page.getByRole('status', { name: '적용된 크기', exact: true }).boundingBox())!;
    expect(Math.abs(panel.x + panel.width - 19 - action.x - action.width)).toBeLessThanOrEqual(2);
  };
  await expectRightAlignedControls();
  await page.getByRole('tab', { name: 'Vue 3', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'framework-tab-vue');
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  const vue = await bounds();
  await expectRightAlignedControls();
  for (let i = 0; i < react.length; i++) {
    expect(vue[i]).not.toBeNull();
    expect(Math.abs(vue[i]!.x - react[i]!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(vue[i]!.width - react[i]!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(vue[i]!.y - react[i]!.y)).toBeLessThanOrEqual(2);
  }
});

test('Vue persistence keeps save/load and JSON controls inside the shared control card', async ({ page }) => {
  await page.goto('/examples/layout/persistence/vue');
  const controls = page.locator('.playground-example-stage--controls');
  await expect(controls.getByRole('button', { name: '레이아웃 저장', exact: true })).toBeVisible();
  await expect(controls.getByRole('button', { name: '레이아웃 불러오기', exact: true })).toBeVisible();
  const json = controls.getByLabel('마지막 저장 레이아웃 JSON');
  await controls.getByRole('button', { name: '레이아웃 저장', exact: true }).click();
  await expect(json).toHaveValue(/widget-1/);
  await controls.getByRole('button', { name: '전체 삭제', exact: true }).click();
  await expect(page.locator('[data-widget-id]')).toHaveCount(0);
  await controls.getByRole('button', { name: '레이아웃 불러오기', exact: true }).click();
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
});

test('Vue public API and trash keep widget actions hidden like React, with the trash inside controls', async ({ page }) => {
  for (const id of ['public-api', 'external-drop-trash']) {
    await page.goto(`/examples/advanced/${id}/vue`);
    await expect(page.locator('[data-widget-id]')).toHaveCount(4);
    await expect(page.locator('[data-widget-id]').getByRole('button')).toHaveCount(0);
  }
  const trash = page.locator('.playground-example-stage--controls [data-dashboard-drop-target="trash"]');
  await expect(trash).toBeVisible();
  const title = page.locator('[data-widget-id="widget-1"] .comins-grid-layout-widget__title');
  await title.scrollIntoViewIfNeeded();
  const from = (await title.boundingBox())!;
  await page.mouse.move(from.x + 12, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 24, from.y + from.height / 2, { steps: 3 });
  await trash.scrollIntoViewIfNeeded();
  const to = (await trash.boundingBox())!;
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('[data-widget-id]')).toHaveCount(3);
});

test('all 23 examples start with matching engine geometry and primary settings', async ({ page }) => {
  test.setTimeout(90_000);
  const read = () => page.locator('.grid-stack').evaluateAll(elements => elements.map(el => {
    const grid = (el as HTMLElement & { gridstack?: GridStack }).gridstack;
    return grid && { columns: grid.getColumn(), cellHeight: grid.getCellHeight(), float: grid.getFloat(),
      widgets: grid.engine.nodes.map(node => ({ id: node.id, x: node.x, y: node.y, w: node.w, h: node.h })).sort((a,b) => String(a.id).localeCompare(String(b.id))) };
  }));
  const waitForResponsiveColumns = async (id: string) => {
    if (id !== 'advanced/responsive') return;
    const container = page.locator('.responsive-demo-container');
    await expect(container.locator('..')).toHaveAttribute('aria-busy', 'false');
    await expect.poll(async () => {
      const box = await container.boundingBox();
      const grids = await read();
      return box && grids[0]?.columns === Math.max(1, Math.min(12, Math.round(box.width / 180)));
    }).toBe(true);
  };
  for (const example of exampleCatalog) {
    await page.goto(`${example.path}/react`);
    await expect.poll(read).not.toContain(undefined);
    await expect(page.locator('.grid-stack').first()).toBeVisible();
    await waitForResponsiveColumns(example.id);
    const react = await read();
    await page.goto(`${example.path}/vue`);
    await expect(page.locator('.grid-stack').first()).toBeVisible();
    await waitForResponsiveColumns(example.id);
    await expect.poll(read, { message: example.id }).toEqual(react);
  }
});

test("shared shell switches React/Vue, resets the example, and changes actual code @firefox-parity", async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/examples/widget/basic/react');
  await expect(page.getByRole('tab', { name: 'React', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  await page.getByRole('button', { name: '코드 보기', exact: true }).click();
  await expect(page.getByRole('region', { name: '예제 소스' })).toContainText('comins-grid-layout/react');
  await page.getByRole('tab', { name: 'Vue 3', exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/widget\/basic\/vue$/);
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  await expect(page.getByRole('region', { name: '예제 소스' })).toContainText('comins-grid-layout/vue');
  await expect(page.getByRole('region', { name: '예제 소스' })).toContainText('@layout-commit');
  await page.getByRole('button', { name: 'Title 1 삭제', exact: true }).click();
  await expect(page.locator('[data-widget-id]')).toHaveCount(9);
  await page.getByRole('tab', { name: 'React', exact: true }).click();
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Vue 3', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  expect(errors).toEqual([]);
});

test("Vue selection survives example navigation and language changes", async ({ page }) => {
  await page.goto('/examples/widget/manage/vue');
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.locator('[data-widget-id]')).toHaveCount(11);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('[data-widget-id]')).toHaveCount(11);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('navigation', { name: 'Example menu' }).getByRole('link', { name: 'Auto Arrange / Fill Gaps', exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/layout\/arrange\/vue$/);
  await expect(page.getByRole('tab', { name: 'Vue 3', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
});

test('Vue widget permission table reflects enabled defaults and lock commands', async ({ page }) => {
  await page.goto('/examples/widget/basic/vue');
  const widget = page.locator('[data-widget-id="widget-1"]');
  await expect(widget.getByRole('row', { name: '이동 가능', exact: true })).toBeVisible();
  await expect(widget.getByRole('row', { name: '리사이즈 가능', exact: true })).toBeVisible();
  await widget.getByRole('button', { name: 'Title 1 이동 잠금', exact: true }).click();
  await expect(widget.getByRole('row', { name: '이동 불가', exact: true })).toBeVisible();
});

test('native React/Vue transfer demos both copy and reject duplicates @firefox-parity', async ({ page }) => {
  for (const framework of ['react', 'vue']) {
    await page.goto(`/examples/advanced/multi-grid/horizontal/${framework}`);
    const source = page.locator('[data-grid-id="grid-a"]');
    const target = page.locator('[data-grid-id="grid-b"]');
    await expect(source.locator('[data-widget-id]')).toHaveCount(2);
    await expect(target.locator('[data-widget-id]')).toHaveCount(1);
    await page.getByRole('button', { name: '이동 모드', exact: true }).click();
    const drag = async () => {
      const header = source.locator('[data-widget-id="a-sales"] .comins-grid-layout-widget__title');
      await header.scrollIntoViewIfNeeded();
      const from = (await header.boundingBox())!, to = (await target.boundingBox())!;
      await page.mouse.move(from.x + 12, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + Math.min(60, to.height / 2), { steps: 20 });
      await page.mouse.up();
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    };
    await drag();
    await expect(source.locator('[data-widget-id="a-sales"]')).toHaveCount(1);
    await expect(target.locator('[data-widget-id="a-sales"]')).toHaveCount(1);
    const before = await source.locator('[data-widget-id]').evaluateAll(items => items.map(item => [item.getAttribute('gs-x'), item.getAttribute('gs-y'), item.getAttribute('gs-w'), item.getAttribute('gs-h')]));
    await drag();
    expect(await source.locator('[data-widget-id]').evaluateAll(items => items.map(item => [item.getAttribute('gs-x'), item.getAttribute('gs-y'), item.getAttribute('gs-w'), item.getAttribute('gs-h')]))).toEqual(before);
    await expect(target.locator('[data-widget-id]')).toHaveCount(2);
  }
});

test('keyboard tabs and rapid switches keep one engine and fit a narrow viewport @mobile-touch', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/examples/widget/basic/react');
  await page.getByRole('tab', { name: 'React', exact: true }).press('ArrowRight');
  await expect(page).toHaveURL(/\/vue$/);
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  for (let i = 0; i < 6; i++) {
    await page.getByRole('tab', { name: 'React', exact: true }).click();
    await page.getByRole('tab', { name: 'Vue 3', exact: true }).click();
  }
  await expect(page.locator('.grid-stack')).toHaveCount(1);
  await expect(page.locator('[data-widget-id]')).toHaveCount(10);
  await page.getByRole('button', { name: '코드 보기', exact: true }).click();
  await expect(page.getByRole('region', { name: '예제 소스' })).toContainText('comins-grid-layout/vue');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("Vue API details expose emits and slots rather than React callbacks", async ({ page }) => {
  await page.goto('/api#api-dashboard-rendering');
  await page.getByLabel('예제 프레임워크').selectOption('vue');
  const section = page.locator('#api-dashboard-rendering');
  await expect(section.locator('dt')).toContainText(['widgets']);
  await expect(section.getByText('default slot', { exact: true })).toBeVisible();
  await expect(section.getByText('onLayoutCommit', { exact: true })).toHaveCount(0);
  const persistence = page.locator('#api-layout-save-restore');
  await persistence.getByText('상세 API 보기', { exact: true }).click();
  await expect(persistence.getByText('layoutCommit', { exact: true }).first()).toBeVisible();
  await section.getByRole('button', { name: '위젯 기본 실행', exact: true }).first().click();
  await expect(section.getByRole('link', { name: '플레이그라운드에서 열기' })).toHaveAttribute('href', '/examples/widget/basic/vue?locale=ko');
  await page.getByLabel('예제 프레임워크').selectOption('react');
  await expect(section.locator('dt').getByText('renderWidget', { exact: true })).toBeVisible();
});

for (const framework of ['react', 'vue']) {
  test(`${framework} narrow menu, page scrolling and widget controls stay usable @firefox-parity @mobile-touch`, async ({ page }) => {
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/examples/widget/basic/${framework}`);
      await expect(page.locator('[data-widget-id]')).toHaveCount(10);
      const sidebar = (await page.locator('.docs-sidebar').boundingBox())!;
      expect(sidebar.height).toBeLessThanOrEqual(100);
      const menu = page.getByLabel('예제 선택', { exact: true });
      await expect(menu).toBeVisible();
      await menu.selectOption('/examples/widget/manage');
      await expect(page).toHaveURL(new RegExp(`/examples/widget/manage/${framework}$`));
      await page.getByRole('button', { name: '추가', exact: true }).click();
      await expect(page.locator('[data-widget-id]')).toHaveCount(11);
      await menu.selectOption('/examples/widget/basic');
      await expect(page.locator('[data-widget-id]')).toHaveCount(10);
      const widget = page.locator('[data-widget-id="widget-1"]');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await widget.scrollIntoViewIfNeeded();
      const header = (await widget.locator('.comins-grid-layout-widget__header').boundingBox())!;
      const title = widget.locator('.comins-grid-layout-widget__title');
      expect(await title.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      for (const button of await widget.getByRole('button').all()) {
        const box = (await button.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(header.x);
        expect(box.x + box.width).toBeLessThanOrEqual(header.x + header.width);
        expect(box.y + box.height).toBeLessThanOrEqual(header.y + header.height);
      }
      await widget.getByRole('button', { name: 'Title 1 이동 잠금', exact: true }).click();
      await expect(widget.getByRole('button', { name: 'Title 1 이동 잠금 해제', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}

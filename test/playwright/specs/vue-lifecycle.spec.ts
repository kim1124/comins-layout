import { expect, test } from "@playwright/test";
import type { GridItemHTMLElement, GridStack } from "gridstack";

test("Vue reactive drag-in preview reaches the real engine @firefox-parity", async ({ page }) => {
  await page.goto("/vue.html?example=__test__/reactive-inputs");
  const palette = page.locator('[data-test="reactive-palette"]');
  const previewWidth = () => palette.evaluate(el => (el as GridItemHTMLElement).gridstackNode?.w);
  await expect.poll(previewWidth).toBe(2);
  await page.getByRole('button', { name: 'Change preview', exact: true }).click();
  await expect.poll(previewWidth).toBe(4);
  const source = (await palette.boundingBox())!;
  const target = (await page.locator('.grid-stack').boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + 50, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('[data-widget-id="palette"]')).toHaveAttribute('gs-w', '4');
});

test("Vue syncs consumer-owned reactive arrays and option snapshots @firefox-parity", async ({ page }) => {
  await page.goto("/vue.html?example=__test__/reactive-inputs");
  const grid = page.locator('.grid-stack');
  const read = () => grid.evaluate(el => {
    const engine = (el as HTMLElement & { gridstack: GridStack }).gridstack;
    return engine && {
      ids: engine.engine.nodes.map(node => node.id).sort(),
      width: engine.engine.nodes.find(node => node.id === 'a')?.w,
      float: engine.getFloat(), cellHeight: engine.getCellHeight(), staticGrid: engine.opts.staticGrid,
    };
  });
  await expect.poll(read).toMatchObject({ ids: ['a'], float: false, cellHeight: 60 });
  await page.getByRole('button', { name: 'Push widget', exact: true }).click();
  await expect.poll(read).toMatchObject({ ids: ['a', 'b'] });
  await page.getByRole('button', { name: 'Splice widget', exact: true }).click();
  await expect.poll(read).toMatchObject({ ids: ['a'] });
  await page.getByRole('button', { name: 'Change layout', exact: true }).click();
  await expect.poll(read).toMatchObject({ width: 3 });
  await page.getByRole('button', { name: 'Change engine options', exact: true }).click();
  await expect.poll(read).toMatchObject({ float: true, cellHeight: 90, staticGrid: true });
});

test.beforeEach(async ({ page }) => {
  await page.goto("/vue.html?example=__test__/lifecycle");
});

test("Vue controls emit without mutating props and expose a live handle", async ({ page }) => {
  await expect(page.locator('[data-test="engine-count"]')).toHaveText("1");
  const grid = page.locator('[data-testid="dashboard-grid"]');
  await expect(grid).toHaveClass(/vue-fixture/);
  await expect(grid).toHaveAttribute("aria-label", "Vue test grid");
  await page.getByRole("button", { name: "Alpha 삭제", exact: true }).click();
  await expect(page.locator('[data-test="mutation-count"]')).toHaveText("0");
  await expect(page.locator('[data-test="events"]')).toContainText("remove:a");
  await expect(page.locator('[data-widget-id="a"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Toggle controls", exact: true }).click();
  await expect(grid.locator(".comins-grid-layout-widget__actions")).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle controls", exact: true }).click();
  await page.getByRole("button", { name: "Custom actions", exact: true }).click();
  await expect(grid.getByRole("button", { name: "Custom a", exact: true })).toBeVisible();
  await expect(grid.getByRole("button", { name: "Alpha 삭제", exact: true })).toHaveCount(0);
});

test("Vue keeps keyed content and reconnects after KeepAlive and option changes", async ({ page }) => {
  await expect(page.locator('[data-test="engine-count"]')).toHaveText("1");
  const widget = page.locator('[data-widget-id="a"]');
  await widget.evaluate(el => el.setAttribute("data-retained", "yes"));
  await page.getByRole("button", { name: "Update data", exact: true }).click();
  await expect(widget).toHaveAttribute("data-retained", "yes");
  await expect(widget.locator('[data-test="body"]')).toHaveText("200");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Toggle active", exact: true }).click();
    await expect(page.locator('[data-test="engine-count"]')).toHaveText("0");
    await page.getByRole("button", { name: "Toggle active", exact: true }).click();
    await expect(page.locator('[data-test="engine-count"]')).toHaveText("1");
  }
  await expect(widget.locator('[data-test="body"]')).toHaveText("200");
  await page.getByRole("button", { name: "Toggle RTL", exact: true }).click();
  await expect(page.locator('.grid-stack')).toHaveClass(/grid-stack-rtl/);
  await page.getByRole("button", { name: "Use six columns", exact: true }).click();
  await expect(page.locator('[data-test="column-count"]')).toHaveText("6");
});

test("Vue defers lazy slots until visible and retains them after activation", async ({ page }) => {
  await expect(page.locator('[data-test="engine-count"]')).toHaveText("1");
  const last = page.locator('[data-widget-id="last"]');
  await expect(last.locator('[data-test="body"]')).toHaveCount(0);
  await last.scrollIntoViewIfNeeded();
  await expect(last.locator('[data-test="body"]')).toHaveText("99");
  await page.getByRole("button", { name: "Toggle active", exact: true }).click();
  await page.getByRole("button", { name: "Toggle active", exact: true }).click();
  await expect(last.locator('[data-test="body"]')).toHaveText("99");
});

test("Vue discards a late adapter load after component removal", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/src/gridstack/adapter.ts*", async route => { await gate; await route.continue(); });
  await page.goto("/vue.html?example=__test__/lifecycle");
  await page.getByRole("button", { name: "Toggle mounted", exact: true }).click();
  release();
  await expect(page.locator('[data-test="engine-count"]')).toHaveText("0");
  await page.getByRole("button", { name: "Toggle mounted", exact: true }).click();
  await expect(page.locator('[data-test="engine-count"]')).toHaveText("1");
});

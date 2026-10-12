import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

for (const framework of ['react', 'vue']) {
  test(`${framework}: explicit size controls, bounds and first-size restore @firefox-parity`, async ({ page }) => {
    await page.goto(`/examples/widget/resize/${framework}?locale=ko`);
    const target = page.getByTestId('dashboard-widget-widget-1');
    await expect(target).toHaveAttribute('gs-h', '2');
    await expect(page.getByRole('button', { name: /최대화|최소화/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '크기 복원', exact: true })).toBeDisabled();
    await page.getByRole('spinbutton', { name: 'W', exact: true }).fill('5');
    await page.getByRole('spinbutton', { name: 'H', exact: true }).fill('4');
    await expect(target).toHaveAttribute('gs-w', '5');
    await expect(target).toHaveAttribute('gs-h', '4');
    await expect(page.getByRole('status', { name: '적용된 크기' })).toContainText('W5 / H4');
    await page.getByRole('spinbutton', { name: 'W', exact: true }).fill('12');
    await page.getByRole('spinbutton', { name: 'W', exact: true }).fill('20');
    await expect(page.getByRole('spinbutton', { name: 'W', exact: true })).toHaveValue('12');
    await expect(target).toHaveAttribute('gs-w', '12');
    await page.getByRole('spinbutton', { name: 'H', exact: true }).fill('0');
    await expect(target).toHaveAttribute('data-layout-h', '1');
    await expect.poll(() => target.evaluate(el => el.getBoundingClientRect().height)).toBe(96);
    await page.getByRole('button', { name: '크기 복원', exact: true }).click();
    await expect(target).toHaveAttribute('data-layout-w', '3');
    await expect(target).toHaveAttribute('data-layout-h', '2');
    await expect(page.getByRole('button', { name: '크기 복원', exact: true })).toBeDisabled();
    await page.getByRole('combobox', { name: '대상 위젯', exact: true }).selectOption('widget-2');
    await page.getByRole('spinbutton', { name: 'H', exact: true }).fill('3');
    await expect(page.getByTestId('dashboard-widget-widget-2')).toHaveAttribute('gs-h', '3');
    await expect(target).toHaveAttribute('gs-h', '2');
  });
  test(`${framework}: title double click fills a gap by default and respects locks @firefox-parity`, async ({ page }) => {
    await page.goto(`/examples/widget/basic/${framework}?locale=ko`);
    const target = page.getByTestId('dashboard-widget-widget-1');
    await expect(target).toHaveAttribute('gs-h', '2');
    // Remove the entire column so vertical packing cannot refill the gap.
    for (const n of [2, 6, 10]) await page.getByRole('button', { name: `Title ${n} 삭제`, exact: true }).click();
    await page.getByRole('button', { name: 'Title 1 리사이즈 잠금', exact: true }).click();
    await target.locator('strong').dblclick();
    await expect(target).toHaveAttribute('data-layout-w', '3');
    await page.getByRole('button', { name: 'Title 1 리사이즈 잠금 해제', exact: true }).click();
    await target.locator('strong').dblclick();
    await expect(target).toHaveAttribute('data-layout-w', '6');
    await expect(target).toHaveAttribute('gs-w', '6');
  });
}

for (const framework of ['react', 'vue']) for (const width of [1280, 390]) {
  test(`${framework}: content pixels follow intrinsic height at ${width}px @firefox-parity`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/examples/advanced/size-to-content/${framework}?locale=ko`);
    const widget = page.getByTestId('dashboard-widget-activity');
    await expect(widget).toHaveAttribute('gs-w', '4');
    await page.evaluate(() => document.fonts.ready);
    const samples: { narrow: boolean; count: number; pixels: number; measured: number }[] = [];
    const measure = () => widget.evaluate(el => {
      const area = el.querySelector<HTMLElement>('.grid-stack-item-content')!;
      const shell = area.firstElementChild!;
      const cell = parseFloat(getComputedStyle(el.parentElement!).getPropertyValue('--gs-cell-height'));
      const measured = shell.getBoundingClientRect().height + el.clientHeight - area.clientHeight;
      return { count: el.querySelectorAll('li').length, rows: Number(el.getAttribute('data-layout-h')), engineRows: Number(el.getAttribute('gs-h')),
        expected: Math.ceil(measured / cell), pixels: el.getBoundingClientRect().height, measured, cell, itemHeight: el.querySelector('li')!.getBoundingClientRect().height,
        width: el.getBoundingClientRect().width };
    });
    for (const narrow of [false, true]) {
      if (narrow) {
        await page.getByRole('button', { name: '내용 초기화', exact: true }).click();
        await widget.scrollIntoViewIfNeeded();
        const box = (await widget.boundingBox())!;
        const handle = (await widget.locator('.ui-resizable-se').boundingBox())!;
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
        await page.mouse.down();
        await page.mouse.move(handle.x + handle.width / 2 - box.width / 2, handle.y + handle.height / 2, { steps: 12 });
        await page.mouse.up();
        await expect(widget).toHaveAttribute('gs-w', '2');
      }
      for (const count of [2,3,4,5,6,7,8,7,6,5,4,3,2]) {
        const current = await widget.locator('li').count();
        if (count !== current) await page.getByRole('button', { name: count > current ? '내용 추가' : '내용 삭제', exact: true }).click();
        await expect(widget.locator('li')).toHaveCount(count);
        await expect.poll(async () => { const m = await measure(); return m.rows === m.expected && m.rows === m.engineRows; }).toBe(true);
        samples.push({ narrow, ...await measure() });
      }
    }
    await mkdir('reports/artifacts/content-sizing-audit', { recursive: true });
    await writeFile(`reports/artifacts/content-sizing-audit/${framework}-${width}-${testInfo.project.name}.json`, JSON.stringify(samples, null, 2));
    for (const [index, sample] of samples.entries()) {
      expect(Math.abs(sample.pixels - sample.measured), `unused pixels at item count ${sample.count}`).toBeLessThanOrEqual(1);
      const previous = samples[index - 1];
      if (previous && previous.narrow === sample.narrow) {
        expect(Math.abs((sample.pixels - previous.pixels) - (sample.measured - previous.measured)), `content delta at item count ${sample.count}`).toBeLessThanOrEqual(1);
      }
    }
  });
}

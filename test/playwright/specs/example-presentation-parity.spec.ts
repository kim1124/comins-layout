import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { exampleCatalog } from '../../../example/src/shared/example-catalog';

async function presentation(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
  return page.locator('#framework-panel').evaluate(panel => {
    const visible = (element: Element) => element.getBoundingClientRect().height > 0;
    const text = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const describe = (element: Element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect(), parent = panel.getBoundingClientRect();
      return {
        rect: [box.x - parent.x, box.y - parent.y, box.width, box.height].map(Math.round),
        tag: element.tagName, text: element.matches('select, textarea') ? '' : text(element),
        label: element.getAttribute('aria-label'), disabled: element.hasAttribute('disabled'),
        pressed: element.getAttribute('aria-pressed'),
        value: element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement ? element.value : undefined,
        options: element instanceof HTMLSelectElement ? [...element.options].map(option => [option.value, option.text]) : undefined,
        icons: [...element.querySelectorAll('svg')].map(svg => [...svg.children].map(node => [node.tagName, [...node.attributes].filter(attr => attr.name !== 'class').map(attr => [attr.name, attr.value]).sort()])),
        style: [style.fontSize, style.padding, style.borderRadius, style.backgroundColor, style.color],
      };
    };
    return {
      controls: [...panel.querySelectorAll('.playground-example-stage--controls button, .playground-example-stage--controls select, .playground-example-stage--controls input, .playground-example-stage--controls textarea')].filter(visible).map(describe),
      stages: [...panel.querySelectorAll('.playground-example-stage')].map(stage => {
        const rect = stage.getBoundingClientRect();
        return { headings: [...stage.querySelectorAll(':scope > header')].map(text), width: Math.round(rect.width), height: Math.round(rect.height) };
      }),
      regions: [...panel.querySelectorAll('section[aria-label], [role="group"][aria-label]')].filter(visible).map(element => element.getAttribute('aria-label')),
      outputs: [...panel.querySelectorAll('pre, output, .lazy-demo-status, .transfer-widget-body')].filter(visible).map(text),
      tables: [...panel.querySelectorAll('table')].filter(visible).map(text),
      widgets: [...panel.querySelectorAll('.grid-stack-item')].map(item => ({
        id: item.getAttribute('gs-id'), x: item.getAttribute('gs-x') ?? '0', y: item.getAttribute('gs-y') ?? '0', w: item.getAttribute('gs-w') ?? '1', h: item.getAttribute('gs-h') ?? '1',
        title: item.querySelector('.comins-grid-layout-widget__title')?.textContent,
        actions: [...item.querySelectorAll(':scope > .grid-stack-item-content > .comins-grid-layout-widget > header button')].map(describe),
      })),
    };
  });
}
for (const locale of ['ko', 'en']) for (const width of [1280, 390]) {
  for (const example of exampleCatalog) {
    test(`${example.id} ${locale} ${width}: React and Vue presentation matches`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const snapshots = [];
      for (const framework of ['react', 'vue']) {
        await page.goto(`/examples/${example.id}/${framework}?locale=${locale}`);
        await expect(page.locator('#framework-panel .grid-stack').first()).toBeVisible();
        await expect(page.locator('#framework-panel [aria-busy="true"]')).toHaveCount(0);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        snapshots.push(await presentation(page));
        const guide = page.locator('.framework-guidance');
        await guide.locator('summary').click();
        await expect(guide.locator('li').first()).toBeVisible();
        const guidanceText = await guide.innerText();
        if (locale === 'en') expect(guidanceText).not.toMatch(/[가-힣]/);
        if (framework === 'vue') expect(guidanceText).not.toMatch(/React|renderWidget|onLayoutCommit|useState/);
        await guide.locator('summary').click();
        if (process.env.PARITY_SCREENSHOTS && locale === 'ko') {
          await mkdir('reports/artifacts/ui-parity', { recursive: true });
          await page.screenshot({ path: `reports/artifacts/ui-parity/${example.id.replaceAll('/', '-')}-${framework}-${width}.png`, fullPage: true });
        }
      }
      expect(errors).toEqual([]);
      expect(snapshots[1]).toEqual(snapshots[0]);
    });
  }
}

async function exercise(page: Page, id: string) {
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const first = page.locator('[data-widget-id="widget-1"]').first();
  switch (id) {
    case 'widget/basic':
      await button('Title 2 삭제').click();
      await expect(page.locator('[data-widget-id="widget-2"]')).toHaveCount(0);
      break;
    case 'widget/resize':
      await page.getByRole('combobox', { name: '대상 위젯', exact: true }).selectOption('widget-2');
      await page.getByRole('spinbutton', { name: 'W', exact: true }).fill('5');
      await page.getByRole('spinbutton', { name: 'H', exact: true }).fill('4');
      await expect(page.locator('[data-widget-id="widget-2"]')).toHaveAttribute('data-layout-w', '5');
      await expect(page.locator('[data-widget-id="widget-2"]')).toHaveAttribute('data-layout-h', '4');
      await button('크기 복원').click();
      break;
    case 'widget/manage':
      await button('추가').click(); await button('전체 삭제').click(); await button('초기화').click(); await button('추가').click();
      await expect(page.locator('[data-widget-id="widget-12"]')).toBeVisible(); break;
    case 'widget/events':
      await first.locator('.comins-grid-layout-widget__title').dblclick();
      await expect(page.getByRole('textbox', { name: '위젯 이벤트' })).toHaveValue(/(?:onBeforeTitleDoubleClick|beforeTitleDoubleClick).*widget-1/s); break;
    case 'layout/basic':
      await page.getByRole('combobox', { name: '컬럼', exact: true }).selectOption('6');
      await expect(page.locator('.grid-stack').first()).toHaveAttribute('data-columns', '6'); break;
    case 'layout/lock':
      await page.getByRole('combobox', { name: '잠금 방식' }).selectOption('static'); await button('레이아웃 잠금').click();
      await expect(first.getByRole('row', { name: '이동 불가', exact: true })).toBeVisible(); break;
    case 'layout/persistence':
      await button('레이아웃 저장').click(); await button('추가').click(); await button('레이아웃 불러오기').click();
      await expect(page.locator('[data-widget-id]')).toHaveCount(10); break;
    case 'layout/arrange':
      await button('Title 1 삭제').click(); await button('자동 정렬').click(); await button('빈 공간 채우기').click(); break;
    case 'layout/events':
      await button('추가').click(); await button('레이아웃 잠금').click();
      await expect(page.getByRole('textbox', { name: '레이아웃 이벤트', exact: true })).toHaveValue(/widget:add.*widget-11/s); break;
    case 'advanced/cell-height': await button('120px').click(); break;
    case 'advanced/lazy-load':
      await button('지연 렌더링 켜짐').click();
      await expect(page.getByLabel('콘텐츠 렌더링 수', { exact: true })).toHaveText('10 / 10');
      await button('지연 렌더링 꺼짐').click(); await button('다시 실험').click();
      await expect(page.getByLabel('콘텐츠 렌더링 수', { exact: true })).not.toHaveText('10 / 10'); break;
    case 'advanced/nested/basic': await button('3단계').click(); await expect(page.locator('.grid-stack')).toHaveCount(3); break;
    case 'advanced/responsive':
      await page.getByRole('combobox', { name: '컬럼 결정 방식' }).selectOption('breakpoints');
      await expect(page.locator('.grid-stack').first()).toHaveAttribute('data-columns', '6');
      await page.getByRole('combobox', { name: '배치 정책' }).selectOption('none');
      await expect(page.locator('.grid-stack').first()).toHaveAttribute('data-columns', '6');
      await expect(page.locator('[data-widget-id="widget-3"]')).toHaveAttribute('gs-y', '2');
      await page.getByRole('spinbutton', { name: '컨테이너 너비' }).fill('600');
      await expect(page.locator('.grid-stack').first()).toHaveAttribute('data-columns', '2'); break;
    case 'advanced/size-to-content': await button('내용 추가').click(); await button('내용 추가').click(); await expect(page.locator('.content-sizing-list li')).toHaveCount(4); break;
    case 'advanced/external-drop-trash': {
      const title = first.locator('.comins-grid-layout-widget__title');
      await title.scrollIntoViewIfNeeded();
      const from = (await title.boundingBox())!, to = (await page.getByTestId('playground-external-drop-trash').boundingBox())!;
      await page.mouse.move(from.x + 20, from.y + from.height / 2); await page.mouse.down();
      await page.mouse.move(from.x + 35, from.y + from.height / 2, { steps: 3 });
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 }); await page.mouse.up();
      await expect(first).toHaveCount(0); break;
    }
    case 'advanced/multi-grid/horizontal':
      await button('이동 모드').click();
      await page.locator('[data-transfer-grid="grid-a"]').getByRole('button', { name: 'Grid B로 복사', exact: true }).first().click();
      await expect(page.getByLabel('Grid A 위젯 수', { exact: true })).toHaveText('2개');
      await expect(page.getByLabel('Grid B 위젯 수', { exact: true })).toHaveText('2개');
      await button('세로 배치').click(); break;
    case 'advanced/public-api': await button('상태 조회').click(); await expect(page.getByLabel('공개 메서드 실행 결과')).toContainText('firstAreaEmpty'); break;
    default: await page.locator('.playground-example-stage--controls button').first().click();
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
for (const example of exampleCatalog) {
  test(`${example.id}: React and Vue command results match @firefox-parity`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    const snapshots = [];
    for (const framework of ['react', 'vue']) {
      await page.goto(`/examples/${example.id}/${framework}?locale=ko`);
      await expect(page.locator('#framework-panel .grid-stack').first()).toBeVisible();
      await exercise(page, example.id);
      const snapshot = await presentation(page);
      // Callback prop names and Vue emit names are the intentional framework difference.
      snapshots.push(JSON.parse(JSON.stringify(snapshot).replace(/on(Before|After|Title|Move|Resize)/g, (_, name: string) => name[0]!.toLowerCase() + name.slice(1))));
    }
    expect(snapshots[1]).toEqual(snapshots[0]);
  });
}

// A cold React navigation may render before web fonts arrive, while the later
// Vue navigation uses the font cache. Compare final font metrics on both sides.
test('presentation waits for pending web fonts', async ({ page }) => {
  let releaseFonts!: () => void;
  const fontsReleased = new Promise<void>(resolve => { releaseFonts = resolve; });
  await page.route('**/fonts/**/*.woff2', async route => {
    await fontsReleased;
    await route.continue();
  });
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/examples/advanced/cell-height/react?locale=en');
    await expect(page.locator('#framework-panel .grid-stack')).toBeVisible();
    expect(await page.evaluate(() => document.fonts.status)).toBe('loading');
    // Deliberately hold the font response past the ordinary animation/RAF wait.
    releaseTimer = setTimeout(releaseFonts, 1500);
    await presentation(page);
    expect(await page.evaluate(() => document.fonts.status)).toBe('loaded');
  } finally {
    if (releaseTimer) clearTimeout(releaseTimer);
    releaseFonts();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

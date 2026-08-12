# Playground 문서형 복구 및 한/영 다국어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 0.2.0 library 기능과 상태 계약을 유지하면서 Playground를 문서 통합형 Shell로 복구하고, 한국어와 영어를 live example state 손실 없이 즉시 전환한다.

**Architecture:** `example/src/i18n/`의 Playground 전용 Context가 `ko | en` locale을 소유하고, locale별 docs data와 UI copy만 해석한다. `DocsShell`이 문서·API·Widget/Layout/Advanced route를 모두 렌더하며 current Playground component를 article의 live demo로 재사용한다. locale은 route 또는 component key가 아니므로 전환 시 live state를 보존한다.

**Tech Stack:** React 19, TypeScript 6, React Router 8, Vite 8, Vitest 4, Playwright 1.61, localStorage, existing CSS

## Global Constraints

- 기준 설계는 `docs/superpowers/specs/2026-08-12-playground-docs-localization-restoration-design.md`다.
- `src/` library runtime, public API, public type, package version과 배포 CSS를 변경하지 않는다.
- 새 npm dependency, locale route prefix, 서버 번역을 추가하지 않는다.
- locale은 `"ko" | "en"`, 기본값은 `"ko"`, storage key는 `comins-grid-layout-playground-locale`로 고정한다.
- API·prop·method 이름, route, code sample source, JSON key, `data-testid`, Widget ID와 사용자 입력은 번역하지 않는다.
- locale 변경은 URL, 선택 Widget, geometry, column cache, JSON 입력, Dialog draft, toggle state를 초기화하지 않는다.
- `/readme-demo` 출력은 locale 저장값과 무관하게 유지한다.
- invalid JSON은 raw 입력을 status나 console에 노출하지 않는 기존 fail-closed 계약을 유지한다.
- required browser gate는 `chromium`, `mobile-chrome`, `chromium-resource`; Firefox/WebKit은 로컬 선택 검증이며 실제 Safari 인증이 아니다.
- remote push, PR, merge, publish, tag와 Release는 이 계획의 실행 권한에 포함하지 않는다.

---

## File Structure

### 새 파일

- `example/src/i18n/types.ts`: `PlaygroundLocale`, `LocalizedText`와 copy factory 타입
- `example/src/i18n/playground-locale.tsx`: storage, `<html lang>`, Context와 locale hook
- `example/src/i18n/messages.ts`: Shell 및 공통 control copy catalog
- `example/src/playground/copy.ts`: Widget/Layout/Advanced의 static/dynamic copy와 fixture 표시 resolver
- `test/vitest/playground-locale.test.ts`: pure locale domain 회귀 검사
- `test/playwright/helpers/playground-locale.ts`: E2E storage 초기화 helper
- `test/playwright/specs/playground-localization.spec.ts`: 한/영 전환과 state 보존 E2E
- `reports/2026-08-12.md`: RED/GREEN, 전체 gate와 화면 검토 증거

### 주요 수정 파일

- `example/src/main.tsx`: Provider 설치와 모든 docs/example route의 DocsShell 통합
- `example/src/docs/types.ts`: localized source와 resolved render type 분리
- `example/src/docs/content.tsx`: locale별 docs/API/search data factory
- `example/src/docs/DocsShell.tsx`: locale toggle, localized search/navigation, live demo 렌더
- `example/src/playground/*.tsx`: localized copy와 semantic status state
- `example/src/playground/components/*.tsx`: 공통 Dialog/CRUD/JSON/Dashboard copy
- `example/src/playground/fixtures.ts`: stable fixture identity와 localized presentation metadata
- `example/src/playground/types.ts`: example-only fixture copy metadata
- `example/src/styles.css`: top-nav locale control 및 restored article/live layout
- `test/playwright/specs/docs-playground-routing.spec.ts`: full-width shell 계약을 문서형 통합 계약으로 교체
- `test/playwright/specs/playground.spec.ts`: localized label helper와 기능 회귀 계약 유지
- `test/playwright/specs/dashboard-grid.spec.ts`: copy 목적 assertion의 locale 고정 또는 stable selector 사용
- `test/playwright/specs/example.spec.ts`: 기본 한국어와 영어 표시 smoke
- `test/playwright/specs/visual-typography.spec.ts`: restored DocsShell visual route capture

---

### Task 1: Playground locale domain과 Provider

**Files:**

- Create: `example/src/i18n/types.ts`
- Create: `example/src/i18n/playground-locale.tsx`
- Create: `example/src/i18n/messages.ts`
- Create: `test/vitest/playground-locale.test.ts`
- Modify: `example/src/main.tsx`

**Interfaces:**

- Produces: `PlaygroundLocale = "ko" | "en"`
- Produces: `LocalizedText = Readonly<{ en: string; ko: string }>`
- Produces: `defineLocalizedText(ko: string, en: string): LocalizedText`
- Produces: `resolveLocalizedText(value: LocalizedText, locale: PlaygroundLocale): string`
- Produces: `normalizePlaygroundLocale(value: string | null): PlaygroundLocale`
- Produces: `usePlaygroundLocale(): { locale; setLocale; text }`

- [ ] **Step 1: pure locale domain 실패 테스트 작성**

```ts
import {
  defineLocalizedText,
  normalizePlaygroundLocale,
  resolveLocalizedText,
} from "../../example/src/i18n/playground-locale";

describe("Playground locale", () => {
  it("defaults invalid storage values to Korean", () => {
    expect(normalizePlaygroundLocale(null)).toBe("ko");
    expect(normalizePlaygroundLocale("unsupported")).toBe("ko");
    expect(normalizePlaygroundLocale("en")).toBe("en");
  });

  it("resolves complete copy and rejects incomplete pairs", () => {
    const value = defineLocalizedText("검색", "Search");
    expect(resolveLocalizedText(value, "ko")).toBe("검색");
    expect(resolveLocalizedText(value, "en")).toBe("Search");
    expect(() => defineLocalizedText("", "Search")).toThrow(
      "playground-localization: incomplete localized text",
    );
  });
});
```

- [ ] **Step 2: RED 확인**

Run: `npm run test:run -- test/vitest/playground-locale.test.ts`

Expected: FAIL because `example/src/i18n/playground-locale.tsx` does not exist.

- [ ] **Step 3: locale 타입과 pure helper 구현**

```ts
// example/src/i18n/types.ts
export type PlaygroundLocale = "ko" | "en";

export type LocalizedText = Readonly<{
  en: string;
  ko: string;
}>;
```

```tsx
// example/src/i18n/playground-locale.tsx
export const PLAYGROUND_LOCALE_STORAGE_KEY = "comins-grid-layout-playground-locale";

export function normalizePlaygroundLocale(value: string | null): PlaygroundLocale {
  return value === "en" || value === "ko" ? value : "ko";
}

export function defineLocalizedText(ko: string, en: string): LocalizedText {
  if (!ko.trim() || !en.trim()) {
    throw new Error("playground-localization: incomplete localized text");
  }
  return Object.freeze({ en, ko });
}

export function resolveLocalizedText(value: LocalizedText, locale: PlaygroundLocale): string {
  if (!value.ko.trim() || !value.en.trim()) {
    throw new Error("playground-localization: incomplete localized text");
  }
  return value[locale];
}
```

- [ ] **Step 4: Provider와 hook 구현**

Context의 lazy initializer는 `window.localStorage`를 `try/catch`로 읽는다. effect는
`document.documentElement.lang`과 storage를 동기화한다. provider 외부 hook 호출은
명시적으로 실패한다.

```tsx
const PlaygroundLocaleContext = createContext<PlaygroundLocaleContextValue | null>(null);

export function PlaygroundLocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<PlaygroundLocale>(readStoredLocale);
  const value = useMemo(
    () => ({ locale, setLocale, text: (copy: LocalizedText) => resolveLocalizedText(copy, locale) }),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(PLAYGROUND_LOCALE_STORAGE_KEY, locale);
    } catch {
      // in-memory locale remains usable
    }
  }, [locale]);

  return <PlaygroundLocaleContext.Provider value={value}>{children}</PlaygroundLocaleContext.Provider>;
}
```

`main.tsx`는 `PlaygroundLocaleProvider` 안에 `BrowserRouter`를 둔다. Provider는
locale 변경 시 Router나 route subtree를 교체하지 않는다.

- [ ] **Step 5: 공통 message catalog 추가**

```ts
export const playgroundMessages = {
  closeDialog: defineLocalizedText("팝업 닫기", "Close dialog"),
  docsNavigation: defineLocalizedText("문서 메뉴", "Docs menu"),
  localeToggle: defineLocalizedText("Playground 언어", "Playground language"),
  noSearchResults: defineLocalizedText("검색된 결과가 없습니다.", "No results found."),
  search: defineLocalizedText("전체 문서 검색", "Search all docs"),
} as const;
```

- [ ] **Step 6: GREEN 확인**

Run: `npm run test:run -- test/vitest/playground-locale.test.ts`

Expected: PASS with all locale helper tests.

- [ ] **Step 7: typecheck 확인**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 8: 로컬 커밋**

```bash
git add example/src/i18n example/src/main.tsx test/vitest/playground-locale.test.ts
git commit -m "feat: add playground locale state"
```

---

### Task 2: Localized docs/API data와 검색

**Files:**

- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Create: `test/playwright/helpers/playground-locale.ts`
- Create: `test/playwright/specs/playground-localization.spec.ts`

**Interfaces:**

- Consumes: `LocalizedText`, `PlaygroundLocale`, `resolveLocalizedText`
- Produces: `PlaygroundExampleId = "advanced" | "layout" | "widget"`
- Produces: `DocsSearchKind = "api" | "code" | "document" | "example"`
- Produces: `createDocsContent(locale): { apiFeatures; pages }`
- Produces: `createDocsNavGroups(pages): DocsNavGroup[]`
- Produces: `searchDocs(query, pages, limit?): DocsSearchItem[]`

- [ ] **Step 1: locale storage E2E helper 작성**

```ts
export const PLAYGROUND_LOCALE_STORAGE_KEY = "comins-grid-layout-playground-locale";

export async function initializePlaygroundLocale(page: Page, locale: "en" | "ko") {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: PLAYGROUND_LOCALE_STORAGE_KEY, value: locale },
  );
}
```

- [ ] **Step 2: docs copy 전환 및 검색 RED E2E 작성**

`playground-localization.spec.ts`에 다음 계약을 추가한다.

```ts
test("switches the docs shell and locale search without changing the route", async ({ page }) => {
  await page.goto("/docs/getting-started");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("searchbox", { name: "전체 문서 검색" })).toBeVisible();

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/docs\/getting-started$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("searchbox", { name: "Search all docs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Getting started" })).toBeVisible();
});
```

같은 spec에 `en` reload 복원, invalid storage → `ko`, locale별 검색 결과와
`/readme-demo` 불변 검사를 추가한다. `Storage.prototype.getItem` 또는 `setItem`이
예외를 던지는 page init 조건에서도 화면이 기본 `ko` 또는 현재 in-memory locale로
계속 동작하며 `<html lang>`이 일치하는지 검증한다.

- [ ] **Step 3: RED 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --workers=1`

Expected: FAIL because the locale toggle and English docs data do not exist.

- [ ] **Step 4: localized source와 resolved docs type 분리**

```ts
export type PlaygroundExampleId = "advanced" | "layout" | "widget";

export type LocalizedDocsCodeSample = Omit<DocsCodeSample, "title"> & {
  title: LocalizedText;
};

export type LocalizedDocsExampleCase = {
  codeSamples: LocalizedDocsCodeSample[];
  description: LocalizedText;
  liveExampleId?: PlaygroundExampleId;
  title: LocalizedText;
};

export type LocalizedDocsPage = {
  body?: LocalizedText[];
  category: LocalizedText;
  examples: LocalizedDocsExampleCase[];
  label: LocalizedText;
  path: string;
  summary: LocalizedText;
  title: LocalizedText;
};
```

API type도 `name`, `type`, `params`, `returns`, `id` 같은 code identity는 string으로
유지하고 visible `title`, `summary`, `description`, `detail`, `when`, sample title만
`LocalizedText` source로 정의한다. 기존 `params: "없음"`은 locale-independent code
notation인 `params: "()"`로 바꾼다. `DocsSearchItem.kind`는 Korean literal union 대신
`DocsSearchKind` semantic value를 저장하고 render 시 localized badge label을 적용한다.

- [ ] **Step 5: docs/API complete pairs와 locale factory 구현**

모든 기존 visible Korean copy에 실제 English pair를 작성한다. code string은 그대로
유지한다. `createDocsContent(locale)`는 source를 한 번 resolve하고 render layer에는
string만 반환한다.

```ts
const localizedDocsPages: LocalizedDocsPage[] = [
  {
    body: [defineLocalizedText(
      "설치, stylesheet import, 첫 dashboard 렌더링 흐름을 확인합니다.",
      "Review installation, stylesheet imports, and the first dashboard render.",
    )],
    category: defineLocalizedText("시작하기", "Getting started"),
    label: defineLocalizedText("시작하기", "Getting started"),
    path: "/docs/getting-started",
    summary: defineLocalizedText("패키지 설치와 기본 사용 흐름입니다.", "Package installation and basic usage."),
    title: defineLocalizedText("시작하기", "Getting started"),
    examples: [
      {
        codeSamples: [
          {
            code: installSample,
            language: "bash",
            title: defineLocalizedText("패키지 설치", "Install the package"),
          },
        ],
        description: defineLocalizedText(
          "React peer dependency와 함께 패키지를 설치합니다.",
          "Install the package with its React peer dependencies.",
        ),
        title: defineLocalizedText("설치", "Installation"),
      },
    ],
  },
];
```

`searchDocs(query, pages)`는 전달받은 resolved pages만 index하고 API/route token은
locale과 무관하게 포함한다. module-global `docsPages`, `docsNavGroups` singleton을
제거한다.

- [ ] **Step 6: DocsShell이 locale data를 한 번 생성하도록 연결**

```tsx
const { locale } = usePlaygroundLocale();
const content = useMemo(() => createDocsContent(locale), [locale]);
const navGroups = useMemo(() => createDocsNavGroups(content.pages), [content.pages]);
```

Sidebar, article, API reference와 search에 같은 `content`를 전달한다. search query는
locale 변경 시 초기화한다.

- [ ] **Step 7: GREEN 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --workers=1`

Expected: docs 기본 locale, toggle, reload, invalid/storage-error recovery, search와
`/readme-demo` 불변 tests PASS.

- [ ] **Step 8: focused unit/type gate**

Run: `npm run test:run -- test/vitest/playground-locale.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 9: 로컬 커밋**

```bash
git add example/src/docs example/src/i18n test/playwright/helpers test/playwright/specs/playground-localization.spec.ts
git commit -m "feat: localize playground documentation"
```

---

### Task 3: 문서형 DocsShell과 live demo 복구

**Files:**

- Modify: `example/src/main.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/visual-typography.spec.ts`

**Interfaces:**

- Consumes: `DocsPage.examples[].liveExampleId`
- Produces: `LivePlayground({ id }: { id: PlaygroundExampleId })`
- Preserves: `RouteLifecycleBoundary` key is pathname only

- [ ] **Step 1: 기존 full-width shell test를 문서형 통합 RED 계약으로 교체**

```ts
async function expectIntegratedPlayground(page: Page, path: string, heading: string) {
  await page.goto(path);
  const navigation = page.getByRole("navigation", { name: "문서 메뉴" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: heading })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("searchbox", { name: "전체 문서 검색" })).toBeVisible();
  await expect(page.locator(".docs-code")).not.toHaveCount(0);
  await expect(page.locator(".docs-live .playground-workspace")).toHaveCount(1);
  await expect(page.locator(".grid-stack")).toHaveCount(1);
  await expect(page.locator(".playground-nav")).toHaveCount(0);
}
```

route navigation test는 Sidebar link로 Widget → Layout을 이동하고
`window.__cominsGridLayoutLastUnmount`가 `/examples/widget`을 기록하는지 유지한다.

- [ ] **Step 2: RED 확인**

Run: `npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts --project=chromium --workers=1`

Expected: FAIL because example routes still render `PlaygroundShell` without DocsShell.

- [ ] **Step 3: LivePlayground dispatcher 구현**

```tsx
function LivePlayground({ id }: { id: PlaygroundExampleId }) {
  switch (id) {
    case "advanced":
      return <AdvancedPlayground />;
    case "layout":
      return <LayoutPlayground />;
    case "widget":
      return <WidgetPlayground />;
  }
}
```

`DocsArticle`은 각 example의 설명과 code block 다음에 `liveExampleId`가 있으면
아래 구조를 정확히 한 번 렌더한다.

```tsx
{example.liveExampleId ? (
  <section className="docs-live" data-live-example={example.liveExampleId}>
    <LivePlayground id={example.liveExampleId} />
  </section>
) : null}
```

- [ ] **Step 4: 모든 canonical docs/example route를 DocsShell로 통합**

`main.tsx` switch는 `/api`, `/docs/getting-started`, `/examples/widget`,
`/examples/layout`, `/examples/advanced`에서 모두 `<DocsShell />`을 반환한다.
`PlaygroundShell` import와 production 사용을 제거하되 파일 삭제는 test/검색으로
미사용을 확인한 뒤 Task 7에서 결정한다.

- [ ] **Step 5: restored layout CSS 적용**

`.docs-live` 안에서는 current Playground의 top-level padding 중복을 제거하고 article
content 폭 안에서 Grid가 100%를 사용하게 한다. mobile `max-width: 860px`에서는
top-nav actions, Sidebar, article, control group이 한 column으로 배치되어 수평 overflow가
없어야 한다. `.playground-nav`는 더 이상 렌더되지 않는다.

- [ ] **Step 6: GREEN과 visual route focused 검사**

Run: `npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/visual-typography.spec.ts --project=chromium --workers=1`

Expected: all restored route, lifecycle, docs/API and screenshot tests PASS.

- [ ] **Step 7: 로컬 커밋**

```bash
git add example/src/main.tsx example/src/docs example/src/styles.css test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/visual-typography.spec.ts
git commit -m "feat: restore integrated playground docs"
```

---

### Task 4: 공통 Playground UI, fixture 표시와 state-preserving locale

**Files:**

- Create: `example/src/playground/copy.ts`
- Modify: `example/src/playground/types.ts`
- Modify: `example/src/playground/fixtures.ts`
- Modify: `example/src/playground/components/DashboardPreview.tsx`
- Modify: `example/src/playground/components/WidgetCrudControls.tsx`
- Modify: `example/src/playground/components/LayoutJson.tsx`
- Modify: `example/src/components/ui/dialog.tsx`
- Modify: `test/playwright/specs/playground-localization.spec.ts`

**Interfaces:**

- Produces: `ExampleFixtureCopyKey = "alerts" | "orders" | "sales" | "traffic"`
- Produces: `resolveWidgetPresentation(widget, locale): { description; title }`
- Produces: semantic Dialog validation codes rather than stored localized strings

- [ ] **Step 1: Widget dialog·selection state 보존 RED E2E 추가**

```ts
test("keeps Widget selection, geometry, dialog draft, and user data across locale changes", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("traffic");
  const before = await page.getByTestId("dashboard-widget-traffic").getAttribute("data-layout-x");
  await page.locator("summary", { hasText: "현재 위젯 상태" }).click();
  await page.getByRole("button", { name: "위젯 추가" }).click();
  await page.getByLabel("위젯명").fill("사용자 지표");
  await page.evaluate(() => { window.__cominsGridLayoutLastUnmount = undefined; });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/widget$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.getByRole("combobox", { name: "Select widget" })).toHaveValue("traffic");
  await expect(page.getByRole("dialog", { name: "Add widget" })).toBeVisible();
  await expect(page.getByLabel("Widget name")).toHaveValue("사용자 지표");
  await expect(page.locator("details.example-state-output")).toHaveAttribute("open", "");
  await expect(page.locator("summary", { hasText: "Current widget state" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", before ?? "");
});
```

- [ ] **Step 2: RED 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --workers=1`

Expected: FAIL on English shared controls and fixture presentation.

- [ ] **Step 3: fixture display metadata 추가**

```ts
export type ExampleFixtureCopyKey = "alerts" | "orders" | "sales" | "traffic";

export type ExampleWidgetData = {
  description: string;
  fixtureCopyKey?: ExampleFixtureCopyKey;
  value: string;
};
```

fixture는 stable Widget ID와 data를 유지하며 `fixtureCopyKey`만 추가한다.
`resolveWidgetPresentation`은 marker가 있는 기본 fixture만 locale별 title/description으로
표시하고, marker가 제거된 사용자 편집 Widget은 저장된 title/data를 그대로 반환한다.

- [ ] **Step 4: DashboardPreview와 CRUD selection에 presentation resolver 적용**

`DashboardGrid`에 전달할 widgets는 current dashboard state의 clone으로 만들고 ID와
layout은 동일하게 유지한다. callback은 원래 dashboard command를 계속 호출한다.
Widget edit commit은 `fixtureCopyKey`를 제거하여 이후 locale 전환이 사용자 입력을
덮어쓰지 않게 한다.

- [ ] **Step 5: shared UI visible copy 변환**

Dialog close label, CRUD buttons, Select labels, Dialog title/description/footer,
validation, `LayoutJson` label/ARIA를 `usePlaygroundLocale().text`로 해석한다.
Dialog error state는 문자열 대신 `"titleRequired" | "valueRequired" | null`을 저장해
열린 Dialog에서 locale을 바꾸면 오류 문구도 즉시 전환되게 한다.

- [ ] **Step 6: GREEN 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --workers=1`

Expected: shared copy and Widget state preservation tests PASS.

- [ ] **Step 7: 기존 Widget focused regression 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground.spec.ts --project=chromium --grep "Widget Playground" --workers=1`

Expected: current CRUD, lock, drag and resize behavior PASS under default Korean locale.

- [ ] **Step 8: 로컬 커밋**

```bash
git add example/src/components/ui example/src/playground test/playwright/specs/playground-localization.spec.ts
git commit -m "feat: localize shared playground controls"
```

---

### Task 5: Widget Playground 전체 copy와 semantic status

**Files:**

- Modify: `example/src/playground/WidgetPlayground.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**Interfaces:**

- Consumes: shared localized CRUD/Dialog and fixture resolver
- Produces: `WidgetStatus` semantic union and `formatWidgetStatus(status, locale)`

- [ ] **Step 1: Widget dynamic status와 lock state locale RED 추가**

test는 traffic 선택, move lock, locale 전환 후 다음을 검증한다.

- selected Widget ID는 `traffic`
- move lock의 `aria-pressed="true"` 유지
- status는 English로 재계산
- geometry와 serialized state 동일
- 사용자 편집 title/value는 한국어 입력 그대로 유지

- [ ] **Step 2: RED 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "Widget" --workers=1`

Expected: FAIL because current Widget copy/status is Korean string state.

- [ ] **Step 3: WidgetStatus semantic union 구현**

```ts
type WidgetStatus =
  | { type: "added"; title: string }
  | { type: "edited"; title: string }
  | { type: "empty" }
  | { type: "fullLock"; active: boolean }
  | { type: "moveLock"; active: boolean }
  | { type: "resizeLock"; active: boolean }
  | { type: "selected"; title: string };
```

state에는 semantic payload만 저장하고 render 시 locale별 문장 함수로 해석한다.
동적 문장은 부분 문자열을 조합하지 않고 언어별 완전한 문장 함수로 정의한다.

```ts
selected: {
  ko: (title: string) => `${title} 위젯을 선택했습니다.`,
  en: (title: string) => `Selected the ${title} widget.`,
}
```

- [ ] **Step 4: Widget header, controls, status와 details copy 전환**

`PlaygroundHeader`, section ARIA, lock buttons, status label, details summary와 JSON
ARIA를 complete pair로 바꾼다. stable `data-example-mode="widget"`와 JSON shape는
변경하지 않는다.

- [ ] **Step 5: locale E2E GREEN 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "Widget" --workers=1`

Expected: PASS.

- [ ] **Step 6: Widget 전체 regression 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground.spec.ts test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "Widget Playground|widget|drag|resize" --workers=1`

Expected: affected Widget behavior tests PASS. Copy 자체가 목적이 아닌 assertion은 stable
role, ID, `aria-pressed`, geometry를 사용한다.

- [ ] **Step 7: 로컬 커밋**

```bash
git add example/src/playground/WidgetPlayground.tsx example/src/playground/copy.ts test/playwright/specs
git commit -m "feat: localize widget playground"
```

---

### Task 6: Layout와 Advanced Playground 전체 copy와 상태 보존

**Files:**

- Modify: `example/src/playground/LayoutPlayground.tsx`
- Modify: `example/src/playground/AdvancedPlayground.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**Interfaces:**

- Produces: semantic Layout operation/status types
- Produces: semantic Advanced handle/commit/layout status types
- Preserves: raw engine query and external drop diagnostic payload values

- [ ] **Step 1: Layout state preservation RED E2E 작성**

Layout route에서 6 columns로 변경하고 full-state JSON textarea에 값을 둔 다음 locale을
전환한다. URL, columns, Widget geometry, `layoutsByColumn` cache keys, textarea raw value와
operation state가 유지되고 labels/status만 English가 되는지 검증한다.

- [ ] **Step 2: Advanced state preservation RED E2E 작성**

Advanced route에서 responsive, float, movable, resizable, lock 상태와 saved JSON을 만든
뒤 locale을 전환한다. 각 `aria-pressed`, active columns, cache keys, JSON과 GridStack
query 값이 유지되고 headings/controls/status만 English가 되는지 검증한다.

- [ ] **Step 3: RED 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "Layout|Advanced" --workers=1`

Expected: FAIL on Korean static/dynamic copy while state assertions remain observable.

- [ ] **Step 4: Layout static copy와 status state 변환**

active layout, full state, operation status는 final string 대신 `LocalizedText` 또는
semantic `{ type; changed? }`를 저장한다. `JSON_ERROR_STATUS`는 localized pair로
resolve하되 raw invalid input을 포함하지 않는다. column count와 JSON serialization은
그대로 유지한다.

- [ ] **Step 5: Advanced static copy와 dynamic status 변환**

Grid readiness, handle command, layout save/restore와 commit status는 semantic state로
변환한다. 아래 diagnostic value는 API/debug identity이므로 locale과 무관하게 유지한다.

```txt
column=<n>; row=<n>; float=<boolean>
target=<id>; widget=<id>; columns=<n>; layout=<x>,<y>,<w>,<h>
```

Dashboard action label이 library 기본 한국어에 의존하지 않도록 Playground에서
localized `actionLabels`를 전달한다. 이 변경은 example usage일 뿐 public API를
변경하지 않는다.

- [ ] **Step 6: locale E2E GREEN 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground-localization.spec.ts --project=chromium --workers=1`

Expected: Widget, Layout, Advanced locale and state preservation tests PASS.

- [ ] **Step 7: Layout/Advanced 기능 regression 확인**

Run: `npm run test:e2e -- test/playwright/specs/playground.spec.ts test/playwright/specs/dashboard-grid.spec.ts --project=chromium --workers=1`

Expected: CRUD, save/restore, invalid JSON, arrange/fill/reset, 1..12 columns,
responsive cache, public handle, external drop, drag/resize tests PASS.

- [ ] **Step 8: 로컬 커밋**

```bash
git add example/src/playground test/playwright/specs
git commit -m "feat: localize layout and advanced playgrounds"
```

---

### Task 7: 전체 검증, 화면 검토, 보고서와 최종 리뷰

**Files:**

- Modify: `README.md`
- Create: `reports/2026-08-12.md`
- Delete: `example/src/playground/PlaygroundShell.tsx`
- Modify: `example/src/styles.css` to remove obsolete standalone-shell selectors
- Test: all affected Vitest and Playwright files

**Interfaces:**

- Consumes: completed DocsShell, locale and Playground copy contracts
- Produces: verification report and clean local implementation branch

- [ ] **Step 1: stale contract와 untranslated visible copy 검사 작성/실행**

`test/vitest/readme.test.ts` 또는 focused policy test에 다음을 고정한다.

- Playground 기본 URL과 current three example routes
- 기본 Korean 및 `한 / EN` toggle 설명
- locale storage key는 Playground-only 문서에만 존재
- `src/`와 exported package surface에 locale module이 없음
- runtime import에서 `PlaygroundShell`이 제거됨

Run: `npm run test:run -- test/vitest/readme.test.ts test/vitest/playground-locale.test.ts`

Expected: RED for stale docs if README has not been aligned; GREEN after minimal docs update.

- [ ] **Step 2: 미사용 shell과 code hygiene 정리**

Run: `rg -n "PlaygroundShell|playground-shell|playground-nav|playground-main" example/src test README.md`

Expected before cleanup: only `example/src/playground/PlaygroundShell.tsx` and the standalone
selector blocks in `example/src/styles.css` remain. Delete `PlaygroundShell.tsx`, remove
`.playground-shell` and `.playground-nav` blocks, remove `.playground-main` from the shared width
selector, and remove the responsive `.playground-nav` block. Re-run the same command and expect
zero matches. Keep `RouteLifecycleBoundary` in `DocsShell` unchanged.

- [ ] **Step 3: baseline 전체 gate 실행**

Run: `npm run verify`

Expected: security `25/25`, all Vitest, license, TypeScript and build PASS.

- [ ] **Step 4: required Chromium gate 실행**

Run: `npm run test:e2e -- --project=chromium --project=mobile-chrome --project=chromium-resource`

Expected: all applicable tests PASS; touch-only and resource-project intentional skips only.

- [ ] **Step 5: local Firefox/WebKit 선택 검증 실행**

Run: `npm run test:e2e -- --project=firefox --project=webkit`

Expected: all applicable desktop engine tests PASS; Chromium-only touch/resource scenarios skip.

- [ ] **Step 6: desktop/mobile 한국어·영어 수동 화면 확인**

새 worktree server를 격리 port로 실행한다.

```bash
COMINS_GRID_LAYOUT_PORT=6003 npm run dev
```

다음 route를 desktop과 mobile viewport에서 각각 `ko`, `en`으로 확인한다.

- `/docs/getting-started`
- `/examples/widget`
- `/examples/layout`
- `/examples/advanced`
- `/api`

확인 항목은 Sidebar/content overflow, locale toggle/search 정렬, code block scroll,
control wrapping, Grid width, Dialog, external drop target와 console/page error 0건이다.

- [ ] **Step 7: report 작성**

`reports/2026-08-12.md`에 다음을 기록한다.

- 작업 시각과 승인된 목표
- 변경 파일과 public API 불변
- Task별 TDD RED/GREEN 명령 및 결과
- `npm run verify`, Chromium, Firefox/WebKit 결과
- desktop/mobile 한/영 화면 확인
- 실제 Safari 미검증, dependency advisory와 remote/publish 미수행 경계

- [ ] **Step 8: diff와 상태 검증**

Run: `git diff --check && git status --short --branch`

Expected: whitespace error 없음; report 및 의도한 변경만 존재.

- [ ] **Step 9: 최종 로컬 커밋**

```bash
git add README.md docs example test reports/2026-08-12.md
git commit -m "docs: record restored playground verification"
```

- [ ] **Step 10: 독립 코드리뷰와 수정 loop**

`superpowers:requesting-code-review`로 `origin/main..HEAD` 범위의 Critical/Important
이슈를 검토한다. 유효한 finding은 `superpowers:receiving-code-review`로 재현·수정하고
affected focused test와 전체 gate를 다시 실행한다.

- [ ] **Step 11: 최종 완료 확인**

Run:

```bash
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: clean worktree, Playground 복구·locale·검증 커밋만 존재. Push/PR은 수행하지
않고 사용자에게 별도 승인을 요청한다.

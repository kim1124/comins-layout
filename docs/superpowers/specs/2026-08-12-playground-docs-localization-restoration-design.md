# Playground 문서형 복구 및 한/영 다국어 설계

## 배경

PR #23 이후 Playground는 `/examples/widget`, `/examples/layout`,
`/examples/advanced`의 독립 full-width 화면으로 분리됐다. 조작부와 Grid를
빠르게 확인하기에는 단순하지만, 이전 화면에 있던 좌측 문서 탐색, 전체 검색,
기능 설명, 코드 예제와 live demo의 연결이 사라져 기능을 이해하기 어렵다.

이번 작업은 0.2.0의 library 기능과 상태 계약을 유지하면서 Playground만 이전의
문서 통합형 정보 구조로 복구한다. 동시에 `comins-table` Playground에서 검증한
패턴을 적용해 한국어와 영어를 즉시 전환한다.

## 목표

- 모든 문서, API, 예제 route를 하나의 `DocsShell`에서 탐색한다.
- 각 예제 article에 설명, 코드 예제, 현재 live Playground를 같은 흐름으로
  배치한다.
- 현재 Widget, Layout, Advanced 기능과 route를 유지한다.
- 한국어와 영어를 route 이동이나 예제 remount 없이 즉시 전환한다.
- locale 변경 전후의 선택 Widget, layout, 컬럼별 cache, JSON 입력, Dialog와
  접기 상태를 유지한다.
- 변경 후 실제 기능을 unit, Chromium, Firefox, WebKit 및 수동 화면 검토로
  재검증한다.

## 비목표

- `src/` library runtime, public API, type 또는 배포 CSS를 변경하지 않는다.
- PR #23 전체를 revert하지 않는다.
- 예제를 과거의 CRUD/Layout/Widget/Complete 네 component로 다시 분리하지
  않는다.
- locale prefix route, 서버 번역, 외부 i18n package를 추가하지 않는다.
- API 이름, prop 이름, route, JSON key, `data-testid`, Widget ID 및 사용자가
  직접 편집한 값을 번역하지 않는다.
- 실제 Safari 자동화와 npm publish는 별도 승인 범위다.

## 검토한 접근

### 1. 문서형 Shell만 복구하고 현재 기능 component 유지 — 채택

`DocsShell`이 모든 문서·예제 route를 소유하고, current Widget/Layout/Advanced
component를 article의 live demo로 렌더한다. 정보 구조를 복구하면서 신규 상태
계약을 보존하고 변경 범위를 `example/`과 관련 test로 제한할 수 있다.

### 2. 과거의 네 예제 분류까지 완전 복구 — 기각

현재 `WidgetPlayground`를 CRUD와 Widget interaction으로 다시 분리해야 한다.
사용성 복구에 필요하지 않은 component 재구성과 상태 중복이 발생한다.

### 3. PR #23 전체 revert — 기각

`layoutsByColumn`, snapshot validation, controlled synchronization 및 관련 회귀
수정을 함께 제거할 수 있어 0.2.0 기능 보존 목표와 충돌한다.

## 화면 및 route 구조

`DocsShell`은 상단 navigation, 좌측 Sidebar, 오른쪽 article content를 소유한다.

- 상단: package title, `한 / EN` segmented control, 전체 문서 검색
- Sidebar: 시작하기, Examples, API 그룹
- Article: category, 제목, 설명, 코드 예제, live demo
- Examples: Widget, Layout, Advanced의 현재 세 route와 component 유지

canonical route는 다음과 같다.

- `/docs/getting-started`
- `/examples/widget`
- `/examples/layout`
- `/examples/advanced`
- `/api`
- `/readme-demo`

호환 route는 현재 계약을 유지한다.

- `/`와 `/examples/crud` → `/examples/widget`
- `/examples/basic` → `/docs/getting-started`
- `/examples/complete` → `/examples/advanced`
- unknown route → `/examples/widget`

route path는 locale과 무관하며 locale 전환으로 history를 추가하지 않는다.
`/readme-demo`는 기존 capture 출력 안정을 위해 번역 대상에서 제외한다.

## Live demo 통합

문서 metadata의 예제 정의에 stable live demo identifier를 둔다.

```ts
type PlaygroundExampleId = "advanced" | "layout" | "widget";
```

`DocsArticle`은 설명과 코드 예제를 먼저 렌더하고 해당 identifier가 있으면 동일
article 안에 current Playground component를 한 번만 렌더한다. locale 전환은
article 표시 data만 바꾸고 route와 identifier를 유지한다. route lifecycle key는
pathname만 사용하므로 locale 전환으로 live component를 remount하지 않는다.

Playground component, fixture, snapshot sanitizer와 public handle 연결은 현재
구현을 재사용한다. core 기능 동작을 UI 복구 과정에서 다시 작성하지 않는다.

## locale domain

locale은 `example/src/i18n/`의 Playground 전용 React Context가 소유한다.

```ts
type PlaygroundLocale = "ko" | "en";

type LocalizedText = Readonly<{
  en: string;
  ko: string;
}>;
```

- 기본 locale: `ko`
- 저장 key: `comins-grid-layout-playground-locale`
- 허용 저장값: `ko`, `en`
- 누락 또는 invalid 저장값: `ko`
- storage read/write 실패: 화면을 중단하지 않고 in-memory locale 유지
- locale 변경: `localStorage` 및 `<html lang>` 동기화
- Context 위치: `BrowserRouter` 바깥, application root 안

`defineLocalizedText(ko, en)`은 두 값 중 하나라도 비어 있으면 명시적으로
실패한다. 누락된 번역을 다른 언어로 조용히 fallback하지 않는다.

## 번역 범위

다음 visible copy는 완전한 `{ ko, en }` pair를 가진다.

- 상단, Sidebar, 검색 placeholder·결과·empty 문구
- article category·제목·요약·본문
- code sample title
- Widget/Layout/Advanced heading·설명
- 버튼, label, Dialog, 상태, 오류와 안내 문구
- Playground가 소유하는 기본 fixture의 설명용 표시 문구

다음 값은 안정적인 내부 계약으로 유지한다.

- package, API, prop 및 method 이름
- code sample source
- route와 hash
- JSON key와 serialized state shape
- `data-testid`, DOM state attribute, Widget ID
- 사용자가 Dialog 또는 JSON으로 입력한 값

기본 fixture의 내부 ID와 상태는 고정하고, locale별 표시 문구는 render 시점에
해석한다. 사용자가 편집한 Widget title/data는 locale 전환으로 덮어쓰지 않는다.

## 검색

`createDocsPages(locale)`가 locale별 표시 data를 만들고 Sidebar, article, 검색이
같은 page 배열을 사용한다. 검색은 현재 locale의 metadata와 locale-independent
route/API token을 대상으로 한다. 한국어 copy가 영어 결과에 섞이거나 그 반대가
발생하지 않아야 한다.

## 상태와 lifecycle

locale은 Playground runtime state의 상위 context일 뿐 Grid state의 key가 아니다.

- locale 전환으로 `WidgetPlayground`, `LayoutPlayground`,
  `AdvancedPlayground` component type과 key를 변경하지 않는다.
- Widget 선택, 이동·리사이즈 결과, lock, column, `layoutsByColumn`, JSON editor,
  Dialog open/draft와 disclosure state를 유지한다.
- route 이동은 기존처럼 이전 article과 live example을 unmount한다.
- locale reload는 저장된 locale을 복원하지만 Playground fixture는 정상적인 새
  page load 계약에 따라 초기화된다.

## 오류 처리

- invalid locale 저장값은 `ko`로 정규화하고 저장값도 교정한다.
- storage 접근 오류는 사용자 기능을 중단시키지 않는다.
- incomplete localized text는 개발·test에서 즉시 예외를 발생시킨다.
- 기존 invalid JSON은 locale별 일반 오류만 표시하고 raw 입력을 상태나 console에
  노출하지 않는 fail-closed 계약을 유지한다.

## 테스트 전략

### TDD focused tests

- locale unit: 기본 `ko`, `en` 복원, invalid 값 복구, storage 오류,
  `<html lang>`, incomplete pair 실패
- docs/routing E2E: 모든 route가 DocsShell과 live demo를 한 번만 렌더하고 호환
  redirect를 유지
- localization E2E: Sidebar, 검색, article, controls와 상태 문구의 즉시 전환
- state preservation E2E: locale 전환 전후 route, selected Widget, geometry,
  column cache, JSON, Dialog와 mount identity 유지
- 기능별 E2E: Widget CRUD·move·resize·lock, Layout save/restore·1~12 column·
  arrange/reset, Advanced external drop·responsive cache·handle·invalid JSON

### 전체 검증

- `npm run verify`
- `npm run test:e2e -- --project=chromium --project=mobile-chrome --project=chromium-resource`
- `npm run test:e2e -- --project=firefox --project=webkit`
- 한국어·영어 desktop 화면 확인
- 한국어·영어 mobile 화면 확인

Firefox/WebKit은 로컬 선택 검증이며 실제 Safari 인증으로 표현하지 않는다.

## 변경 경계와 전달

- 새 기능 브랜치와 worktree에서 PR #25 CI 정책 변경과 분리한다.
- 새 dependency, package version, publish, tag, Release를 추가하지 않는다.
- 구현 후 report에는 변경 파일, RED/GREEN, 전체 검증, 화면 확인과 잔여 리스크를
  기록한다.
- 원격 push와 PR 생성은 별도 승인을 받는다.

## 완료 기준

- 사용자가 이전 문서형 구조에서 기능 설명과 실제 demo를 연속해서 확인할 수 있다.
- 한국어와 영어의 visible Playground copy가 완전하게 전환된다.
- locale 전환이 현재 route와 live feature state를 초기화하지 않는다.
- 현재 0.2.0 기능 계약과 public library surface가 유지된다.
- 필수 Chromium gate와 선택 Firefox/WebKit 로컬 검증이 모두 통과한다.

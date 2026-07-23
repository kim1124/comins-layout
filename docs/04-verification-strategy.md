# Verification Strategy

## Baseline Commands

Run from repo root:

```bash
npm run verify
```

## Browser Checks

Run when rendered example, drag and drop, resize, maximize, minimize, or responsive behavior changes:

```bash
npm run verify:full
```

## Vitest Scope

Use Vitest for:

- column count clamping
- layout serialization helpers
- maximize and minimize reducer behavior
- auto-arrange state transformation
- resize scheduler behavior with fake timers or mocked animation frames
- GridStack option mapping without a real browser

## Playwright Scope

Use Playwright for:

- example page rendering
- drag and drop behavior
- resize handle behavior
- maximize and restore interaction
- minimize and restore interaction
- runtime column changes
- movement and resize disabled states
- visible layout overflow checks
- 100-widget JSON restore, two warm-up `1..12` column cycles, bounded adaptive column/interaction sampling, drag/resize recovery
- Chrome DevTools Protocol `JSHeapUsedSize`, DOM Nodes, Event Listeners, Documents counter capture after forced garbage collection

## 100-Widget Resource Stability Gate

1. Complete example의 JSON restore control로 100개 widget을 로드하고, `1..12` column cycle을 두 번 수행해 column runtime을 warm-up한다.
2. 각 counter 측정은 animation frame 및 100ms idle 대기, 강제 garbage collection, 250ms idle 대기, 두 번째 강제 garbage collection 순서로 안정화한다. warm-up 직후 첫 column sample을 기록하고, 각 추가 sample 전에 전체 `1..12` column cycle을 수행한다.
3. Column sample은 최소 8개를 수집한다. 마지막 3개 sample이 2% final-growth 범위에 들어오면 종료하고, 안정화되지 않으면 최대 11개까지 수집한다.
4. Drag/resize 1회로 GridStack interaction runtime을 warm-up하고 counter를 기록한다. 이후 같은 drag/resize interaction을 반복하면서 최소 3개 sample을 수집하고, 마지막 3개 sample이 안정화되지 않으면 최대 6개까지 수집한다.
5. Column과 interaction 각 구간에서 Documents, DOM Nodes, Event Listeners는 첫 baseline과 같아야 한다. 하나라도 변하면 해당 counter와 구간을 표시해 실패한다.
6. 두 구간 모두 전체 sample의 post-GC JS Heap peak은 첫 baseline 대비 12% 이하여야 한다. 마지막 3개 steady-state sample의 final growth는 2% 이하여야 하며, 2%를 초과하는 단조 증가도 허용하지 않는다. 최대 sample까지 수집해도 이 조건을 만족하지 않으면 실패한다.

12% peak budget은 지연된 일회성 runtime 초기화를 제한된 범위에서 허용하기 위한 값이다. 최종 합격은 마지막 3개 sample의 2% steady-state budget으로 판단하므로, 초기화 이후에도 retained heap이 계속 증가하는 경우에는 통과하지 않는다.

Playwright는 일반 Chromium/mobile suite 완료 뒤 단일 worker `chromium-resource` project에서 Chromium CDP counter JSON을 test artifact에 기록한다. 수동 Chrome DevTools 확인 시에도 같은 순서로 JS Heap, DOM Nodes, Event Listeners를 기록해 `reports/YYYY-MM-DD.md`와 비교한다.

CDP counter gate는 자동화된 Chrome DevTools Protocol 검증이다. 직접 Chrome DevTools GUI 확인을 요청받은 경우에는 별도로 실행하고, 실행하지 못했으면 GUI 확인을 통과한 것으로 보고하지 않는다.

## Completion Gate

Do not mark implementation work complete if:

- package `verify` fails
- required browser verification is skipped without a blocker
- browser verification finds visible UI breakage
- 100-widget resource stability gate에서 counter 누적 증가 또는 console/page error가 확인된다.

## Artifact Policy

- Vitest artifacts: `test/vitest`
- Playwright artifacts: `test/playwright`
- Work reports: `reports/YYYY-MM-DD.md`

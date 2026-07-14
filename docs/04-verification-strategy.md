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
- 100-widget JSON restore, three full `1..12` column cycles, drag/resize recovery
- Chrome DevTools Protocol `JSHeapUsedSize`, DOM Nodes, Event Listeners, Documents counter capture after forced garbage collection

## 100-Widget Resource Stability Gate

1. Complete example의 JSON restore control로 100개 widget을 로드하고, `1..12` column cycle 1회로 runtime을 warm-up한다.
2. 각 counter 측정은 animation frame 및 100ms idle 대기, 강제 garbage collection, 250ms idle 대기, 두 번째 강제 garbage collection 순서로 안정화한다. warm-up 이후 column baseline을 기록하고, 측정 대상 `1..12` column cycle을 세 번 수행한다.
3. drag/resize 1회로 GridStack interaction runtime을 초기화한다. resize 완료 뒤 interaction baseline을 기록하고, 동일 interaction을 두 번 더 수행한다.
4. column cycle 구간에서는 Documents, DOM Nodes, Event Listeners가 baseline과 같아야 한다. interaction baseline 이후 반복에서도 같은 세 counter가 증가하면 실패다.
5. 각 구간의 post-GC JS Heap은 단조 증가하면 실패다. 최대값과 최종값을 모두 baseline과 비교한다. column 구간은 V8의 일회성 post-GC peak을 고려해 최대 12%·최종 2%, interaction 구간은 최대·최종 모두 2%를 초과하면 실패다.

Playwright는 일반 Chromium/mobile suite 완료 뒤 단일 worker `chromium-resource` project에서 Chromium CDP counter JSON을 test artifact에 기록한다. 수동 Chrome DevTools 확인 시에도 같은 순서로 JS Heap, DOM Nodes, Event Listeners를 기록해 `reports/YYYY-MM-DD.md`와 비교한다.

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

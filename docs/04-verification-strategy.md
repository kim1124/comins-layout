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

1. Complete example의 JSON restore control로 100개 widget을 로드한다.
2. 강제 garbage collection 뒤 기준 counter를 기록하고, `1..12` column cycle을 세 번 수행한 뒤 다시 기록한다.
3. drag/resize 1회로 GridStack interaction runtime을 초기화한 뒤, 동일 interaction을 두 번 더 수행해 안정화 counter를 기록한다.
4. column cycle 구간에서는 Documents와 Event Listeners가 유지되고, DOM Nodes가 기준보다 누적 증가하지 않아야 한다. post-GC JS Heap은 cycle별 단조 증가를 보이면 실패다.
5. interaction 초기화 직후의 one-time runtime allocation은 별도 baseline으로 취급한다. 이후 반복 interaction에서 Documents, DOM Nodes, Event Listeners가 증가하거나 post-GC JS Heap이 단조 증가하면 실패다.

Playwright는 Chromium CDP로 counter JSON을 test artifact에 기록한다. 수동 Chrome DevTools 확인 시에도 같은 순서로 JS Heap, DOM Nodes, Event Listeners를 기록해 `reports/YYYY-MM-DD.md`와 비교한다.

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

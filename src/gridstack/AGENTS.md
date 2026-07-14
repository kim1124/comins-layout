# comins-grid-layout GridStack Adapter Rules

## Scope

This file applies to `comins/grid-layout/src/gridstack`.

## Role

The adapter layer is the only runtime source boundary that may talk directly to the `gridstack` engine.

## Rules

- MUST: GridStack initialization, option mapping, event binding, refresh, compact, and cleanup inside this layer.
- DO NOT: expose a raw GridStack instance as the primary public package API.
- Prefer package-owned serializable layout types at the boundary.
- DO NOT: recreate GridStack instances for routine layout refreshes.
- MUST: drag and resize hot paths imperative and narrowly scoped.
- Batch or defer React-facing persistence until interaction completion when possible.
- Clean up GridStack instances and event listeners on unmount.

## Verification

- MUST: Vitest for option mapping and adapter-shape guardrails where possible.
- MUST: Playwright for browser-visible drag, resize, column, and layout commit behavior.

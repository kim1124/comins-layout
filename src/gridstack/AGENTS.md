# comins-grid-layout GridStack Adapter Rules

## Scope

This file applies to `src/gridstack`.

## Role

The adapter layer is the only runtime source boundary that may talk directly to the `gridstack` engine.

## Rules

- MUST: GridStack initialization, option mapping, event binding, refresh, compact, and cleanup inside this layer.
- DO NOT: expose a raw GridStack instance as the primary public package API.
- Prefer package-owned serializable layout types at the boundary.
- DO NOT: recreate GridStack instances for routine layout refreshes.
- MUST: drag and resize hot paths imperative and narrowly scoped.
- Batch or defer renderer-facing persistence until interaction completion when possible. React and Vue own their DOM and controlled state; the adapter only registers and updates geometry.
- Clean up GridStack instances and event listeners on unmount.

## Verification

- MUST: Vitest for option mapping and adapter-shape guardrails where possible.
- MUST: Playwright for browser-visible drag, resize, column, and layout commit behavior.

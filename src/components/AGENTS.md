# comins-grid-layout Component Rules

## Scope

This file applies to `src/components`.

## Role

The component layer owns React rendering, public props, render slots, widget shell controls, accessibility labels, and callbacks into consumer-owned state.

## Rules

- DO NOT: import `gridstack` directly from this layer.
- MUST: GridStack behavior behind the package adapter.
- MUST: component props generic React compatible and do not introduce Next.js-only APIs.
- MUST: stable widget IDs as React keys and callback identifiers.
- MUST: widget controls accessible through labels while allowing icon-only visible buttons.
- AVOID: React state updates during drag or resize hot paths unless explicitly throttled or scheduled.
- MUST: consumer widget content in `renderWidget` slots; do not hard-code product-specific widget bodies.

## Verification

- MUST: Playwright for rendered controls, labels, layout visibility, and interaction behavior.
- MUST: typecheck for public prop and generic API changes.

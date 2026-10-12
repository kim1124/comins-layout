# comins-grid-layout Core State Rules

## Scope

This file applies to `src/core`.

## Role

The core layer owns serializable dashboard state, layout reducers, column helpers and shared public types. Scheduling belongs to Browser; the public facade is `src/core.ts` and excludes private transitions/queues.

## Rules

- MUST: Keep this layer framework-independent and deterministic.
- DO NOT: import React, React DOM, Vue, Svelte, GridStack, Next.js, or package example code, including type-only imports.
- DO NOT: depend on browser DOM objects in reducer or layout helper code.
- MUST: Preserve widget IDs across add, update, remove, maximize, minimize, restore, arrange, column, reset, and serialization operations.
- Clamp column count to the supported `1..12` range.
- MUST: exported state snapshots serializable.
- AVOID: full-layout deep clones in render-adjacent paths unless a test demonstrates the need.

## Verification

- MUST: Vitest for reducer/helper/serialization, `npm run check:core`, and artifact JS/declaration graph checks.

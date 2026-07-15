# comins-grid-layout Core State Rules

## Scope

This file applies to `src/core`.

## Role

The core layer owns serializable dashboard state, layout reducers, column helpers, resize scheduling helpers, and shared public types.

## Rules

- MUST: Keep this layer framework-light and deterministic.
- DO NOT: import React, React DOM, GridStack, Next.js, or package example code.
- DO NOT: depend on browser DOM objects in reducer or layout helper code.
- MUST: Preserve widget IDs across add, update, remove, maximize, minimize, restore, arrange, column, reset, and serialization operations.
- Clamp column count to the supported `1..12` range.
- MUST: exported state snapshots serializable.
- AVOID: full-layout deep clones in render-adjacent paths unless a test demonstrates the need.

## Verification

- MUST: Vitest for reducer, helper, serialization, and scheduler behavior.
- RUN: the focused test first, then package baseline verification.

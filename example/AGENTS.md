# comins-grid-layout Example Rules

## Scope

This file applies to `comins/grid-layout/example`.

## Role

The example is the package consumer surface used for manual inspection and Playwright browser verification.

## Rules

- MUST: the example as consumer code, not as package internals.
- Import the package through public exports where practical.
- MUST: example-only styles and demo data out of runtime exports.
- Maintain accessible labels for controls used by Playwright.
- When changing rendered UI, check for visible layout breakage and browser console errors.
- DO NOT: introduce Next.js-only APIs; the example must remain Vite/React compatible.

## Verification

- RUN: Playwright when example layout, controls, interaction, or accessibility labels change.
- RUN: package build after example import or public API usage changes.

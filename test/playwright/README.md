# Playwright

Use Playwright for browser-visible layout behavior and the canonical [Verification Strategy](../../docs/04-verification-strategy.md) for commands, the browser project matrix, resource counters, and thresholds. General scenarios run in `chromium`; only representative engine-sensitive `@firefox-parity` scenarios run in Firefox, only `@mobile-touch` scenarios run in `mobile-chrome`, and the CDP resource check remains isolated in `chromium-resource`.

## Multi-framework additions (Unreleased)

`vue-lifecycle.spec.ts` checks asynchronous connect/unmount, KeepAlive, slots and lazy content. `framework-parity.spec.ts` checks shared columns, Vue controls, touch, transfer and the same 100-widget resource probe as React. `browser-connection.spec.ts` connects the internal neutral Browser layer without a renderer. The probe is not a public Vanilla API.

`docs-learning.spec.ts` verifies all 22 Vue routes, locale/reload, actual lazy mounts and one-at-a-time React/Vue API previews. Run it again against `npm run build:examples` / `npm run preview:examples` using `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_SKIP_WEBSERVER=1`.

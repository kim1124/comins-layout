# Playwright

Use Playwright for browser-visible layout behavior and the canonical [Verification Strategy](../../docs/04-verification-strategy.md) for commands, the browser project matrix, resource counters, and thresholds. General scenarios run in `chromium`; only `@desktop-browser` scenarios run in Firefox, only `@mobile-touch` scenarios run in `mobile-chrome`, and the CDP resource check remains isolated in `chromium-resource`.

# README animations

These five GIFs are first-party screen recordings of the local React examples in source version **0.2.3**, including the current **Unreleased** changes, regenerated on **2026-09-22**. They demonstrate actual package interactions with synthetic example data; no external stock images or user data are included. The version badge reads package metadata and does not certify publication of this checkout.

| Asset | Local capture route | Recorded behavior |
| --- | --- | --- |
| `comins-grid-layout-transfer.gif` | `/readme-demo?feature=transfer` | Palette copy and controlled Grid-to-Grid move |
| `comins-grid-layout-external-drop.gif` | `/readme-demo?feature=external-drop` | Drop on an HTML target and consumer-owned deletion |
| `comins-grid-layout-responsive-persistence.gif` | `/readme-demo?feature=responsive-persistence` | Explicit 12/6-column switching, a 6-column position change, and cache restoration |
| `comins-grid-layout-lazy-rendering.gif` | `/readme-demo?feature=lazy-rendering` | React content mounting on first scroll intersection |
| `comins-grid-layout-content-sizing.gif` | `/readme-demo?feature=content-sizing` | Fixed height, content fit, added details, and shrinkage with committed React heights |

The capture source is [example/src/readme-demo.tsx](../../example/src/readme-demo.tsx), with [example styles](../../example/src/styles.css) and package CSS. Each scene displays the version from `package.json`. Recordings are cropped to the example surface and encoded from captured PNG frames; the widget geometry and content are not retouched.

## What the recordings do not show

These are compact feature fixtures, not full Playground screen recordings:

- Transfer records palette copy and Grid-to-Grid **move**. Use Copy mode in `/examples/advanced/multi-grid/horizontal` to see the stationary source snapshot and moving `+` outline. Same-grid drops still move.
- Persistence uses buttons, not automatic width detection. `/examples/advanced/responsive` separately compares `columnWidth` and breakpoints with `moveScale` and `none`, and displays actual container width and widget geometry.
- Lazy rendering shows an eagerly mounted group and one deferred widget. `/examples/advanced/lazy-load` adds actual mount counts, per-widget status, on/off comparison, and restart. It is not data fetching or full virtualization.
- External drop demonstrates consumer-owned removal. The full Playground uses a full-width deletion area and puts Reset at the right of the live-example heading.
- Content sizing demonstrates fixed height → fit → growth → shrinkage; row rounding can leave free space within the allocated card.

## Latest generated files

All five outputs are **960×720** and loop indefinitely. Recorded values from the 2026-09-22 generation:

| Scene | Frames | Duration | Bytes |
| --- | ---: | ---: | ---: |
| Transfer | 46 | 3.68 s | 135489 |
| External drop | 34 | 2.72 s | 91150 |
| Responsive persistence | 36 | 2.88 s | 57585 |
| Lazy rendering | 32 | 2.56 s | 164266 |
| Content sizing | 54 | 4.32 s | 44998 |

The examples and recordings use the repository's [MIT license](../../LICENSE). Rendering uses the separately installed dependencies documented in [Third-Party Notices](../../THIRD_PARTY_NOTICES.md) and the unchanged local Spoqa Han Sans Neo font, whose [license text](../../example/public/fonts/spoqa/LICENSE.SpoqaHanSans.txt) remains with the font files. No new third-party assets or dependencies were added for these recordings.

## Regeneration

From a source checkout with dependencies installed, run:

```bash
npm run docs:readme-gif
```

[The capture script](../../scripts/capture-readme-demo.mjs) starts a local Vite server, waits for fonts and GridStack initialization, performs each scene in Chromium, and encodes frames with the macOS Swift/ImageIO toolchain. It fails on browser errors or warnings and replaces the GIF set only after all outputs pass validation. `COMINS_README_GIF_PORT` can select another local port.

Each GIF must be at most 960×720, 12 seconds, and 5 MiB, contain multiple frames, and loop indefinitely. The README Vitest contract checks those limits. Verify the scene behavior separately:

```bash
npm run test:e2e -- test/playwright/specs/readme-demo.spec.ts --project=chromium
```

GIFs stay in the repository and are linked from the npm-facing README through raw GitHub URLs. They are not part of the npm package `files` allow-list. Updated remote images become available after the corresponding repository changes are published.

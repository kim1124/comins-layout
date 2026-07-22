# README, GridStack Advanced API, And Residual-Risk Closure Design

## Goal

Make `comins-grid-layout` understandable and usable from its README, add an
advanced but explicitly secondary escape hatch to the underlying GridStack
public API, verify mobile touch drag and resize, and close the remaining
documentation, CI, release-policy, and provider-side risks for the `0.1.4`
release line.

This design authorizes planning and later local implementation only. A remote
push, pull request, provider mutation, npm deprecation, staged publication,
tag, or GitHub Release still requires an explicit maintainer command at the
corresponding gate.

## Confirmed Decisions

- Rewrite the root README in English as a consumer-facing module guide.
- Place npm version, bundled TypeScript types, GitHub Verify, and MIT license
  badges at the top.
- Place a real-product animated GIF immediately below the module summary. The
  GIF demonstrates read, create, drag, resize/update, and delete through an
  English capture-only demo.
- Keep the existing Comins state and CRUD commands as the primary React API.
- Add `DashboardGridHandle` as an advanced API with `getGridStack()`,
  `refresh()`, and `commitLayout()`.
- Include mobile touch drag and resize in the supported and verified scope.
- Do not implement keyboard move or resize. Record it as an explicit unsupported
  product boundary rather than an unresolved defect.
- Until `1.0.0`, support only the latest published version. The intended next
  release is `0.1.4`.
- Continue provider cleanup for legacy npm versions, deprecate unsupported
  versions, and use an approved GitHub noreply identity for public npm
  maintainer metadata.
- Follow Comins Contract v1.2 and the common release and sensitive-data
  standards as policy facts. Do not add a separate `gitHead` requirement; use
  the exact-artifact gate and automatic provenance required by governance.

## Verified Starting State

- The repository and public npm package are currently `0.1.3`.
- `DashboardGrid` is a generic function component without a public ref handle.
- The internal adapter owns a `GridStack` instance, but adapter creation and the
  instance are not publicly reachable.
- `useDashboardGrid()` exposes package-owned state and CRUD commands.
- The adapter already commits GridStack `change`, drag-stop, and resize-stop
  layout snapshots to React-facing callbacks.
- The complete example covers widget CRUD, drag, resize, columns, persistence,
  maximize, minimize, restore, and arrange, but its visible labels are Korean.
- Automated Playwright projects cover desktop Chromium, mobile Chromium, and an
  isolated resource test. Mobile touch drag and resize do not have focused
  coverage.
- `docs/03-component-api-draft.md` omits current API details, and
  `docs/05-open-questions.md` still presents implemented product decisions as
  unresolved.
- `SECURITY.md` does not identify the supported release line or support window.
- The publish workflow's v4 artifact actions emit a deprecated Node runtime
  warning. Current reviewed major releases of the artifact actions run on
  Node 24.
- Comins Contract v1.2 already prohibits personal email exposure and restricts
  public identity to an approved public handle, GitHub noreply identity, or
  service identity. No duplicate common policy is needed.

## Considered Approaches

### README-Only Refresh

This would improve discovery but leave the underlying GridStack API inaccessible,
touch behavior unproven, stale API/open-question documents unresolved, and CI
runtime warnings unchanged. It does not satisfy residual-risk closure.

### Raw GridStack As The Primary API

Returning the raw instance as the component's main contract would maximize
engine freedom but weaken the module-owned adapter boundary and allow GridStack
DOM state to diverge from React `widgets` state. It would also make engine
lifecycle and version details the default consumer responsibility.

### Package API Plus Advanced Escape Hatch

This is the selected approach. Package-owned serializable state remains the
primary contract, while a ref handle provides deliberate access to the complete
GridStack public instance for advanced consumers. Documentation classifies safe
engine operations and state-mutating operations, and provides an explicit
layout commit bridge.

## Public API Design

Export a non-generic handle type:

```ts
export interface DashboardGridHandle {
  getGridStack(): GridStack | null;
  refresh(): void;
  commitLayout(): DashboardLayoutSnapshot | null;
}
```

`DashboardGrid` becomes a ref-forwarding generic component while preserving the
existing prop type and generic widget-data inference. Existing consumers that
do not pass a ref must remain source- and runtime-compatible.

### Handle Semantics

- `getGridStack()` returns the currently mounted instance or `null` before
  asynchronous adapter initialization and after unmount.
- `refresh()` requests the package adapter's existing refresh behavior and is a
  no-op before initialization or after unmount.
- `commitLayout()` reads the current GridStack geometry, invokes the existing
  `onWidgetLayoutChange` and `onLayoutCommit` callbacks with the same semantics
  as an interaction commit, and returns the snapshot. It returns `null` when no
  live adapter exists. The adapter tracks the last emitted geometry and does not
  emit the same layout twice when GridStack already raised `change` for the
  operation.
- Unmount clears the adapter ref before or as part of destroying the engine so a
  retained component handle cannot return a destroyed instance.

### Supported Usage Boundary

- Use `useDashboardGrid()` commands for widget data, create, update, delete,
  maximize, minimize, restore, columns, persistence, and serializable state.
- Use the raw GridStack instance for engine queries, batching, compaction,
  geometry helpers, and advanced engine options not duplicated by Comins.
- GridStack methods that emit `change` already use the adapter's normal commit
  path. After a direct layout mutation that does not emit `change`, call
  `commitLayout()` and update the controlled React source from the emitted
  callbacks.
- Direct `addWidget()` or `removeWidget()` calls do not create or remove React
  widget content. The README must direct consumers to the Comins CRUD commands
  for those operations.
- Consumers must not call lifecycle-destructive methods such as `destroy()` on
  the borrowed instance. The component owns initialization, listeners, and
  cleanup.

The adapter remains internal, and creating an independent package adapter is not
added to the public export surface.

## README Information Architecture

The README uses this consumer-first order:

1. Title, one-line value proposition, and badges.
2. Animated CRUD/drag/resize demo with descriptive alt text.
3. Feature summary.
4. Support matrix: React and React DOM peers, bundled TypeScript declarations,
   tested Chromium desktop/mobile scope, explicit Firefox/Safari boundary, and
   SSR client-only integration.
5. Installation, including both GridStack and Comins CSS imports.
6. Minimal `useDashboardGrid()` plus `DashboardGrid` example.
7. Widget and layout data model.
8. Complete `DashboardGrid` props table.
9. Complete `useDashboardGrid()` commands table.
10. Advanced GridStack ref-handle example and state-synchronization warnings.
11. Persistence, styling, and runtime-behavior notes.
12. Example, API, changelog, security, and repository links.

Repository maintenance commands and historical release notes are not presented
as the main module explanation. They remain available through contributor or
project documentation where appropriate.

## Animated Demo Design

Add a focused English README demo route that uses only the public package API
and the actual widget renderer. It does not replace or translate the full
complete example.

The capture sequence is deterministic:

1. Show the initial grid to demonstrate read/render.
2. Create one widget through the visible UI.
3. Drag it to a new cell.
4. Resize it to demonstrate a layout update.
5. Delete it through the visible UI.

Playwright drives the real browser interactions and captures frames. A small
Swift ImageIO utility assembles the frames into a checked-in GIF without adding
an npm or runtime dependency. The target is approximately 960 pixels wide,
about ten seconds, and no more than 5 MiB. Capture output must not contain a
personal name, account path, email, token, remote asset, or local environment
detail.

Store the asset under `docs/assets/` and use an absolute GitHub raw-content URL
from the README so the image resolves on both GitHub and npm. The asset is not
part of the runtime package boundary; the package source continues to make no
network request or remote asset load.

## Mobile Touch Design

Add focused mobile Chromium tests using real Chromium touch input against the
existing mobile project and public demo surface. Verify:

- drag from the widget header moves the intended widget;
- resize from the handle changes width and height;
- the interaction produces one stable committed layout;
- the controlled React state preserves the committed geometry after rerender;
- touch interaction still works after a runtime column change.

First run these tests against the current adapter. If they pass, product source
does not change. If they fail, classify the failure as product behavior, test
contract, or execution environment before making a minimal adapter correction.
Any correction must remain inside `src/gridstack`, preserve desktop pointer
behavior, and avoid per-move React state updates.

Keyboard layout manipulation remains unsupported. Normal interactive controls
continue to use their existing button keyboard behavior.

## Documentation And Policy Alignment

- Update `docs/03-component-api-draft.md` with
  `onWidgetHeaderDoubleClick`, the complete `resetLayout()` input, and
  `DashboardGridHandle`.
- Rewrite `docs/05-open-questions.md` as resolved decisions and explicit
  boundaries. GridStack, controlled state, maximize/minimize, auto-arrange,
  touch support, and advanced API access must no longer appear unresolved.
- Update `SECURITY.md` to state that only the latest public release is supported
  before `1.0.0`; after publication, that release is `0.1.4`.
- Add a `0.1.4` changelog entry covering the additive handle, touch verification,
  consumer README, and maintenance changes.
- Update the package and root lockfile version to `0.1.4` during release
  preparation.
- Record behavior, public API, workflow, release, and provider evidence in the
  repository's dated report.

## CI Maintenance

Replace deprecated-runtime GitHub artifact actions with reviewed Node 24 major
releases pinned to immutable commit SHAs. Align `setup-node` with its reviewed
Node 24 action release. Preserve:

- checkout credential isolation;
- immutable `npm ci` installation;
- required `Sensitive data` and `verify` jobs;
- exact single-artifact creation and scanning;
- one-day artifact retention;
- OIDC trusted staged publishing;
- npm 2FA approval outside CI.

Action upgrades are maintenance changes only and must not weaken permissions,
artifact identity, Gitleaks handling, or stage controls.

## Release And Provider Closure

The intended package version is `0.1.4`. Implementation and local verification
may prepare that version, but publication remains a separate explicit gate.

After an approved `0.1.4` publication:

- `0.1.4` is the only supported pre-1.0 version;
- unsupported `0.1.2` and `0.1.3` are deprecated with a value-free support
  message directing users to the latest version;
- legacy `0.1.0` and `0.1.1` continue through the existing private npm Support
  removal process rather than being duplicated or publicly discussed;
- public npm maintainer metadata is changed to an approved GitHub noreply
  identity only after a separate account-wide approval;
- registry metadata, the public profile, provenance, and the downloaded package
  are rechecked without printing identity or sensitive values.

Comins governance requires the exact package artifact and automatic provenance.
It does not require `gitHead`, so missing `gitHead` is not a release blocker and
the artifact must not be mutated to inject it.

## Verification Design

### Focused API And Unit Verification

- Type-level export and ref-compatibility coverage for `DashboardGridHandle`.
- Adapter tests for live/null handle state, refresh forwarding, commit callbacks,
  returned snapshots, duplicate-geometry suppression, and unmount cleanup.
- Existing core state and public command tests remain unchanged unless the
  documented contract requires a correction.

### Browser Verification

- Existing desktop CRUD, drag, resize, boundary-exit, columns, persistence,
  maximize/minimize, and layout commit flows.
- New mobile touch drag, resize, rerender persistence, and column-change flows.
- Existing 100-widget and repeated-column resource gate.
- README demo capture sequence against the same actual interactions.

### Full Package And Security Verification

Run the package baseline and full gates, the consumer smoke test, and the exact
package-artifact gate. Extract and scan the single `0.1.4` archive with the
pinned redacted Gitleaks process. Parse the changed workflow YAML, run
`git diff --check`, and confirm no generated frames, archives, scanner output,
or temporary data remain.

## Failure Handling

- A public API type regression, duplicate layout commit, stale GridStack
  instance, desktop interaction regression, or failed touch test blocks release
  preparation.
- A GIF capture failure does not justify replacing real UI evidence with a
  simulated or AI-generated product image.
- A workflow action upgrade that changes permissions or artifact identity is
  rejected.
- Any required scanner, exact-artifact, consumer, full browser, or provenance
  failure blocks publication.
- Provider operations stop when the live package, account, support-case, or
  approval state differs from the reviewed precondition.
- Sensitive identity values, detector matches, fingerprints, and paths are never
  included in docs, reports, commands shown to the user, or public issues.

## Accepted Boundaries

- Firefox and Safari remain documented but unverified/unsupported until their
  own browser projects are approved.
- Keyboard widget movement and resize are not implemented.
- CodeQL default setup is optional because Contract v1.2 requires dependency
  and secret scanning but does not make CodeQL a module gate.
- The full GridStack instance is an advanced borrowed object, not a replacement
  for controlled React widget state.
- Provider cleanup cannot be reported complete until the separately approved
  npm changes and private Support outcome are verified.

## Acceptance Criteria

- The README is English, consumer-focused, and accurately documents support,
  installation, minimal use, all props, all commands, and the advanced handle.
- The four required badges and the real CRUD/drag/resize GIF resolve on both
  GitHub and npm-facing README rendering.
- Existing consumers remain compatible, while `DashboardGridHandle` gives
  advanced consumers access to the current GridStack public instance.
- Desktop behavior passes and mobile touch drag/resize is proven through focused
  browser tests.
- Stale API/open-question/security documentation is consistent with source and
  the approved support policy.
- GitHub Actions use reviewed immutable Node 24 action revisions without
  weakening the exact-artifact or OIDC publication design.
- The `0.1.4` local full, consumer, package, security, and browser gates pass
  before any remote release request.
- External npm deprecation, profile, support, staging, approval, and publication
  steps remain separately approved and are reported complete only after live
  value-free verification.

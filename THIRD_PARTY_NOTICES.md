# Third-Party Notices

`comins-grid-layout` depends on the following separately installed packages. They are not copied into the Comins JavaScript bundle.

| Package | Relationship | SPDX | Source | License |
| --- | --- | --- | --- | --- |
| gridstack | external runtime dependency | MIT | https://github.com/gridstack/gridstack.js | https://github.com/gridstack/gridstack.js/blob/master/LICENSE |
| react | peer dependency | MIT | https://github.com/react/react | https://github.com/react/react/blob/main/LICENSE |
| react-dom | peer dependency | MIT | https://github.com/react/react | https://github.com/react/react/blob/main/LICENSE |
| vue | peer dependency | MIT | https://github.com/vuejs/core | https://github.com/vuejs/core/blob/main/LICENSE |

`comins-grid-layout` is an independent module. It is not an official GridStack distribution and is not affiliated with or endorsed by the GridStack project.

Each dependency remains subject to its upstream license. Follow the linked source and license documents for the authoritative terms.

## Copied icon geometry

The widget action icons copy the maximize-2, minimize-2, rotate-ccw and trash-2
geometry from lucide-react 1.40.0, sourced from the
[Lucide project](https://github.com/lucide-icons/lucide/tree/1.40.0/packages/lucide-react).
Geometry and path keys are unchanged; the React wrappers are replaced by
Comins-owned React/Vue renderers and framework-neutral data in src/ui/icons.ts.
lucide-react is a development-only dependency for the documentation UI.

Lucide uses ISC; the upstream notice also identifies minimize-2 and trash-2
as Feather-derived, covered by MIT. Both full notices are retained unchanged
in [THIRD_PARTY_LICENSES/lucide.txt](THIRD_PARTY_LICENSES/lucide.txt) and must
accompany distributed copies. No upstream runtime code is bundled.

Scope reviewed under the maintainer-approved Core/Vue implementation plan
(2026-10-12, Task 4): four icons, package widget controls, both upstream notices
retained. A source version, icon selection or distribution change requires
review of this record.

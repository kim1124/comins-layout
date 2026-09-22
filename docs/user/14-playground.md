# Playground

The repository Playground is the executable companion to these guides. It uses the same public package surfaces and canonical routes.

```bash
git clone https://github.com/kim1124/comins-layout.git
cd comins-layout
npm install
npm run dev
```

Open `http://127.0.0.1:6001/docs/getting-started`. The API reference is `http://127.0.0.1:6001/api`.

## Recommended route map

| Area | Route |
| --- | --- |
| Getting started | `/docs/getting-started` |
| Widget basics | `/examples/widget/basic` |
| Add, delete all, reset | `/examples/widget/manage` |
| Widget events | `/examples/widget/events` |
| Layout basics | `/examples/layout/basic` |
| Lock/unlock | `/examples/layout/lock` |
| Save/load | `/examples/layout/persistence` |
| Arrange/fill gaps | `/examples/layout/arrange` |
| Layout events | `/examples/layout/events` |
| Lazy content rendering and mount status | `/examples/advanced/lazy-load` |
| Responsive: column calculation and layout policy | `/examples/advanced/responsive` |
| Multi-grid transfer and orientation toggle | `/examples/advanced/multi-grid/horizontal` |
| External trash drop | `/examples/advanced/external-drop-trash` |
| Safe public handle | `/examples/advanced/public-api` |
| API reference | `/api` |

Additional Advanced menu routes demonstrate grid lines, float, mobile touch, controlled two-/three-level nested composition, RTL, size to content, title-only drag handles, and transforms. The multi-grid route switches horizontal and vertical presentation in place. The three responsive examples are combined on one page; former URLs remain compatible.

Static Grid is integrated into the lock-mode selector on the Layout Lock / Unlock page. Widget Basic includes target selection and maximize, minimize, and restore actions. Size To Content lets you add or remove content and toggle automatic sizing to compare it with a fixed height.

Read the API reference in this order: purpose, live example, minimal code, detailed API. Entry-level launch buttons open the same Playground screens inside the reference. Only one example runs at a time; switching or closing discards its state. Types and utilities include related examples and invocation code.

The internal `/readme-demo` route is a deterministic browser fixture used to regenerate README animations. It is not a consumer example or a supported package route.

The five README animations use compact feature fixtures, not this full interface. Their [capture notes](../assets/README.md) identify the exact scenes and source date. Current guides describe source version `0.2.3`; registry availability is verified separately.

When a guide and an example appear to disagree, treat the current exported TypeScript declarations and focused repository tests as the implementation contract, then report the documentation discrepancy as an issue.

In Mobile Touch, containers up to 640px use 3 columns so each initial widget has room for its title and actions. The toggle switches persistent handle visibility between `"mobile"` and `false`; movement and resizing remain available. Breakpoint examples use container width, and `none` still corrects bounds and overlaps. These are example settings rather than package-wide responsive defaults.

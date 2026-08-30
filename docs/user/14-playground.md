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
| Lazy React content | `/examples/advanced/lazy-load` |
| Responsive column width | `/examples/advanced/responsive/column` |
| Responsive breakpoints | `/examples/advanced/responsive/breakpoints` |
| Multi-grid transfer and orientation toggle | `/examples/advanced/multi-grid/horizontal` |
| External trash drop | `/examples/advanced/external-drop-trash` |
| Safe public handle | `/examples/advanced/public-api` |
| API reference | `/api` |

Additional Advanced menu routes demonstrate grid lines, float, mobile touch, controlled two-/three-level nested composition, responsive `none`, RTL, size to content, static mode, title-only drag handles, and transforms. The multi-grid route switches horizontal and vertical presentation in place.

The internal `/readme-demo` route is a deterministic browser fixture used to regenerate README animations. It is not a consumer example or a supported package route.

When a guide and an example appear to disagree, treat the current exported TypeScript declarations and focused repository tests as the implementation contract, then report the documentation discrepancy as an issue.

# 엔진 옵션

지원되는 GridStack 설정은 `engineOptions`로 전달합니다. Application 상태는 React에서 관리하고 패키지가 명시적으로 mapping하는 엔진 동작만 사용합니다.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  engineOptions={{
    cellHeight: 88,
    margin: 8,
    float: false,
    animate: true,
    dragHandle: ".comins-grid-layout-widget__header",
    resizeHandles: "se",
    alwaysShowResizeHandle: "mobile",
  }}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => widget.title}
/>
```

지원 필드는 `cellHeight`, `margin`, `float`, `animate`, `staticGrid`, `rtl`, `minRow`, `maxRow`, `sizeToContent`, `dragHandle`, `resizeHandles`, `alwaysShowResizeHandle`, `nonce`입니다. 패키지 기본값은 cell height `96`, margin `8`, float `false`, resize handle `se`입니다.

Widget의 `sizeToContent`와 `resizeToContentParent`로 item별 content sizing을 지정할 수 있습니다. Widget의 `locked`, `movable`, `resizable`은 grid의 `editable`, `movable`, `resizable`과 함께 적용됩니다.

엔진 `lazyLoad` 필드는 `0.2.x` 전반에 유지되는 deprecated 호환 mapping이며 React content를 지연하지 않습니다. 신규 코드는 `lazyRenderWidget`과 widget `lazyLoad`를 사용합니다.

유효하지 않은 지원 설정은 `DashboardGridConfigurationError`를 발생시킵니다. 목록에 없는 GridStack option은 의도적으로 pass-through하지 않습니다.

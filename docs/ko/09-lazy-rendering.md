# 지연 렌더링

비용이 큰 React content를 첫 교차 시점까지 미루려면 `lazyRenderWidget`을 사용합니다. GridStack item geometry와 widget shell은 계속 mount되므로 전체 위젯 virtualization은 아닙니다.

```tsx
<div data-dashboard-lazy-scroll style={{ maxHeight: 480, overflow: "auto" }}>
  <DashboardGrid
    lazyRenderWidget
    widgets={dashboard.widgets}
    onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
    renderWidget={(widget) => <ExpensiveChart metric={widget.data} />}
  />
</div>
```

그리드 지연 렌더링을 켜면 위젯은 기본적으로 lazy입니다. 특정 위젯의 `lazyLoad: false`는 eager render로 제외합니다. 위젯에 `lazyLoad: true`만 설정해서는 전역 기능이 켜지지 않습니다.

가장 가까운 scroll container에 `data-dashboard-lazy-scroll`을 지정하면 `IntersectionObserver` root가 됩니다. 해당 ancestor가 없으면 viewport가 기준입니다. `IntersectionObserver`가 없는 환경에서는 eager fallback하고, 한 번 표시된 content는 계속 mount됩니다.

`engineOptions.lazyLoad`는 `0.2.1` 호환 mapping만 유지하며 React content를 지연하지 않습니다. `0.3.0` 제거 예정이므로 신규 코드는 component prop과 widget flag를 사용합니다.

Skeleton, loading placeholder, 보이지 않을 때 unmount, 데이터 fetch는 소비자가 `renderWidget` 내부에서 구현합니다.

Playground: `/examples/advanced/lazy-load`.

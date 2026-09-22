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

가장 가까운 scroll container에 `data-dashboard-lazy-scroll`을 지정하면 `IntersectionObserver` root가 됩니다. 해당 ancestor가 없으면 viewport가 기준입니다. `IntersectionObserver`가 없는 환경에서는 eager fallback하고, 한 번 표시된 content는 화면 밖으로 나가도 계속 mount됩니다. 최초 콘텐츠 표시를 늦추는 기능이지 한 번만 렌더링하거나 화면 밖 콘텐츠를 제거하는 가상화 기능이 아닙니다. 표시 후에는 일반적인 React 상태·props 변경에 따라 다시 렌더링합니다. 이미 표시된 콘텐츠는 옵션을 다시 켜도 숨기지 않습니다.

`engineOptions.lazyLoad`는 `0.2.x` 호환 mapping만 유지하며 React content를 지연하지 않습니다. `0.3.0` 제거 예정이므로 신규 코드는 component prop과 widget flag를 사용합니다.

Skeleton, loading placeholder, 보이지 않을 때 unmount, 데이터 fetch는 소비자가 `renderWidget` 내부에서 구현합니다.

Playground: `/examples/advanced/lazy-load`.

예제의 이름은 **콘텐츠 지연 렌더링**입니다. 내부 영역을 스크롤하며 실제 콘텐츠 마운트에 따른 렌더링 개수와 위젯별 대기/완료 표시를 확인합니다. 켜짐/꺼짐으로 즉시 렌더링과 비교하고, 켜짐 상태에서 **다시 실험**을 누르면 Grid와 스크롤 위치를 초기화해 최초 진입을 다시 관찰할 수 있습니다. 대기 안내와 집계는 예제 전용 UI이며 패키지의 데이터 로딩 기능이 아닙니다.

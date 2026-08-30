# 스타일, 접근성, 지원 경계

두 CSS를 한 번씩 import합니다. 패키지 스타일은 `.comins-grid-layout` 아래에 한정되고 global reset을 적용하지 않습니다.

```tsx
import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";

<DashboardGrid
  className="brand-dashboard__grid"
  widgets={dashboard.widgets}
  actionLabels={{ maximize: "확장", minimize: "축소", restore: "복원", remove: "삭제" }}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => widget.title}
/>
```

Local container에서 `--comins-grid-layout-accent`, `--comins-grid-layout-border`, `--comins-grid-layout-surface`, `--comins-grid-layout-text`, `--comins-grid-layout-radius`, `--comins-grid-layout-shadow` 등을 override할 수 있습니다.

기본 액션 버튼은 키보드로 조작 가능하며 widget title과 `actionLabels`로 접근 가능한 이름을 만듭니다. `renderWidgetActions`로 교체하면 버튼 semantics, keyboard, focus, label을 소비자가 제공합니다. 위젯 이동/resize는 pointer/touch 전용이며 keyboard 이동/resize는 제공하지 않습니다.

## 지원 경계

- React/React DOM `>=18 <20` peer dependency, TypeScript declaration 제공
- Desktop Chrome 자동화, 대표 Firefox 및 mobile Chromium touch 시나리오 검증
- Branded Edge와 Safari 직접 인증 없음: 소비자 별도 검증 필요
- SSR은 client boundary 필요, Next.js 전용 API 없음
- 명시적 nested `DashboardGrid` 조합 지원, native dynamic GridStack sub-grid ownership 미지원
- 외부 HTML target은 같은 document light DOM만 지원
- Lazy rendering은 content 지연이며 virtualization/skeleton API가 아님
- Runtime network 요청, 저장소, telemetry, 인증, fetch, server integration 없음

`widgets`와 직렬화되는 `data`는 application 소유이므로 권한과 민감정보를 렌더링·저장 전에 검증해야 합니다.

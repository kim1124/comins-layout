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

`sizeToContent`는 콘텐츠 높이에 맞춰 위젯의 행 수 `h`를 조정하는 선택 기능이며 기본적으로 꺼져 있습니다. 셀 한 칸의 픽셀 높이인 `cellHeight`를 바꾸는 기능은 아닙니다. 고정 높이 대시보드에는 끈 상태를 유지하고, 콘텐츠 길이에 따라 카드 높이가 달라져야 할 때 켭니다. 이미 콘텐츠가 현재 높이에 들어가면 켜도 `h`가 같을 수 있습니다. 옵션을 끄는 것만으로 이전 `h`가 복원되지는 않습니다.

콘텐츠 높이 측정에는 위젯 헤더가 포함되며 `minH`/`maxH`를 따릅니다. 콘텐츠 변경 후 다시 측정하려면 `refreshKey` 또는 핸들의 `refresh()`를 사용합니다. 변경된 높이를 React 상태와 저장 데이터에 반영하려면 `onLayoutCommit`을 연결합니다. 최대화·최소화 중에는 콘텐츠 크기 맞춤을 일시 중단하고 복원 후 재개합니다. 위젯의 `sizeToContent: false`는 전역 크기 맞춤에서 해당 위젯을 제외합니다.

`staticGrid: true`는 엔진의 드래그 이동과 리사이즈를 막습니다. 위젯 내부 입력이나 앱에서 연결한 삭제·최대화 버튼까지 비활성화하는 읽기 전용 모드는 아닙니다. 플레이그라운드의 위젯 표는 정적 모드까지 반영한 현재 이동·리사이즈 가능 여부를 표시합니다. 위젯별 설정은 보존되어 전체 잠금을 해제한 뒤 다시 적용됩니다.

레이아웃 잠금/해제 페이지의 잠금 방식 선택에서 정적 모드와 이동·리사이즈 잠금을 비교합니다. 정적 모드는 외부 위젯 드롭 수신도 차단하지만 앱의 버튼이나 명령 호출을 막지는 않습니다.

Size To Content 예제는 활동 내역을 추가·삭제하며 높이 증가와 감소를 확인합니다. 행 단위 반올림으로 콘텐츠 아래에 빈 공간이 남을 수 있으며 카드 외곽과 리사이즈 핸들은 실제 배정된 그리드 영역을 따릅니다. 수동 리사이즈는 별도 설정이며, 자동 높이를 켠 상태에서는 재측정 시 콘텐츠 높이가 다시 적용됩니다.

`float: true`는 위젯 위의 빈 공간을 유지할 수 있게 하고, 기본값인 `false`는 위로 당겨 빈 공간을 줄입니다. `dragHandle`은 드래그를 시작할 영역을 제한하며 리사이즈 핸들과는 별개입니다. `alwaysShowResizeHandle`은 핸들의 표시 정책이지 리사이즈 권한 설정이 아닙니다.

Widget의 `sizeToContent`와 `resizeToContentParent`로 item별 content sizing을 지정할 수 있습니다. Widget의 `locked`, `movable`, `resizable`은 grid의 `editable`, `movable`, `resizable`과 함께 적용됩니다.

엔진 `lazyLoad` 필드는 `0.2.x` 전반에 유지되는 deprecated 호환 mapping이며 React content를 지연하지 않습니다. 신규 코드는 `lazyRenderWidget`과 widget `lazyLoad`를 사용합니다.

유효하지 않은 지원 설정은 `DashboardGridConfigurationError`를 발생시킵니다. 목록에 없는 GridStack option은 의도적으로 pass-through하지 않습니다.

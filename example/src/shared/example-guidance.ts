import type { Framework } from './example-catalog';
import type { Locale } from './locale';
import { exampleTextForFramework } from './framework-api';

type Copy = Record<Locale, string>;
type ExampleGuidance = { items: Copy[]; references?: { name: string; description: Copy }[]; referenceCaption?: Copy; referenceNameLabel?: Copy };

// Preserve the full guidance from the React examples for both public framework tabs.
// Embedded React examples keep their original inline guide and API excerpts.
const guidance: Record<string, ExampleGuidance> = {
  "widget/basic": {
    "items": [
      {
        "ko": "이 예제는 12컬럼에 10개 위젯을 W3/H2로 배치합니다. W/H는 픽셀이 아니라 위젯이 차지하는 컬럼 수와 행 수입니다.",
        "en": "This example places ten W3/H2 widgets in 12 columns. W/H are column and row counts, not pixels."
      },
      {
        "ko": "각 위젯 표에서 번호, 현재 W/H, 이동 및 리사이즈 가능 여부를 확인합니다.",
        "en": "Each widget table shows its number, current W/H, and move/resize availability."
      },
      {
        "ko": "타이틀 버튼은 해당 위젯의 이동·리사이즈 허용 여부만 독립적으로 전환합니다.",
        "en": "Title actions toggle movement and resizing for that widget independently."
      },
      {
        "ko": "타이틀 더블 클릭은 같은 행의 빈 공간을 채웁니다. 위젯 2·6·10을 삭제한 뒤 Title 1을 더블 클릭해 비교합니다. 잠금 상태에서는 실행하지 않습니다.",
        "en": "Double-click a title to fill unused columns in its row. Remove widgets 2, 6 and 10, then double-click Title 1 to compare. Locked widgets do not fill gaps."
      }
    ]
  },
  "widget/resize": { items: [
    { ko: '대상 위젯의 W/H를 입력하면 resizeWidget으로 즉시 반영합니다. W/H는 픽셀이 아닌 컬럼 수와 행 수이며, W는 1부터 현재 레이아웃의 전체 컬럼 수까지, H는 1~6까지 허용합니다.', en: 'Enter W/H to apply resizeWidget immediately. W/H are column and row counts, not pixels; W supports 1 through the current layout column count, and H supports 1–6.' },
    { ko: '크기 복원은 최초 API 크기 변경 전 저장한 해당 위젯의 위치·크기를 복원합니다. 직전 작업 취소나 전체 레이아웃 초기화가 아닙니다. 다른 위젯은 충돌 처리로 이동할 수 있습니다.', en: 'Restore size restores the selected widget’s saved position and size before its first API resize. It is not undo or a full layout reset. Collision handling may move other widgets.' },
    { ko: '타이틀의 이동·리사이즈 잠금은 포인터 조작을 제한합니다. resizeWidget 명령은 잠금과 무관하게 허용 범위 안에서 크기를 변경합니다.', en: 'Title movement and resize locks restrict pointer interaction. The resizeWidget command still applies sizes within the allowed bounds.' },
  ] },
  "widget/manage": {
    "items": [
      {
        "ko": "추가 버튼은 페이지가 열린 동안 번호를 계속 증가시킵니다. 번호 발급은 이 예제의 정책이며 패키지가 ID를 자동 생성하는 기능은 아닙니다.",
        "en": "Add increments the number while this page is mounted. This is an example policy; the package does not automatically generate IDs."
      },
      {
        "ko": "전체 삭제는 모든 위젯을 제거합니다. 초기화는 최초 1~10번 위젯과 12컬럼 배치를 복원하지만 추가 번호 카운터는 되돌리지 않습니다.",
        "en": "Clear all removes every widget. Reset restores widgets 1–10 and the initial 12-column layout without resetting the next-number counter."
      },
      {
        "ko": "모든 작업은 useDashboardGrid의 제어 상태 명령으로 처리됩니다.",
        "en": "Every action is handled by controlled-state commands from useDashboardGrid."
      }
    ]
  },
  "widget/events": {
    "items": [
      {
        "ko": "이동은 onBeforeMove → onMove → onAfterMove, 크기 조절은 onBeforeResize → onResize → onAfterResize 순서로 관찰합니다. 진행 중 이벤트는 animation frame 단위로 병합됩니다.",
        "en": "Observe movement through onBeforeMove → onMove → onAfterMove and resizing through onBeforeResize → onResize → onAfterResize. Active events are coalesced per animation frame."
      },
      {
        "ko": "이벤트의 layout은 그리드 단위 좌표입니다. 종료 이벤트는 필요한 레이아웃 콜백 전달 후 호출되지만 React 화면 갱신이나 비동기 작업 완료를 기다리지 않습니다. before 이벤트는 취소용 API가 아닙니다.",
        "en": "Event layout values use grid units. End events run after any required layout callbacks, without waiting for React rendering or asynchronous work. Before events are notifications, not cancellation APIs."
      },
      {
        "ko": "타이틀을 더블 클릭하면 onBeforeTitleDoubleClick → onTitleDoubleClick → onAfterTitleDoubleClick을 기록합니다. 같은 행에 빈 공간이 있으면 기본 너비 확장도 실행합니다. 잠금 상태에서는 이벤트만 기록합니다.",
        "en": "Double-click the title to log onBeforeTitleDoubleClick → onTitleDoubleClick → onAfterTitleDoubleClick. The default action also fills unused columns in the same row. Locked widgets only log events."
      }
    ],
    "referenceCaption": {
      "ko": "이벤트 핸들러",
      "en": "Event handlers"
    },
    "referenceNameLabel": {
      "ko": "이벤트명",
      "en": "Event name"
    },
    "references": [
      {
        "name": "onBeforeMove",
        "description": {
          "ko": "위젯 이동이 시작되기 직전에 호출됩니다.",
          "en": "Called immediately before widget movement starts."
        }
      },
      {
        "name": "onMove",
        "description": {
          "ko": "위젯 이동 중 갱신된 layout을 전달합니다.",
          "en": "Provides the updated layout while the widget moves."
        }
      },
      {
        "name": "onAfterMove",
        "description": {
          "ko": "이동 종료 시 필요한 레이아웃 콜백 전달 후 최종 좌표를 알립니다.",
          "en": "Reports final coordinates after movement ends and any required layout callbacks are delivered."
        }
      },
      {
        "name": "onBeforeResize",
        "description": {
          "ko": "위젯 리사이즈가 시작되기 직전에 호출됩니다.",
          "en": "Called immediately before widget resizing starts."
        }
      },
      {
        "name": "onResize",
        "description": {
          "ko": "위젯 리사이즈 중 갱신된 layout을 전달합니다.",
          "en": "Provides the updated layout while the widget resizes."
        }
      },
      {
        "name": "onAfterResize",
        "description": {
          "ko": "크기 조절 종료 시 필요한 레이아웃 콜백 전달 후 최종 크기를 알립니다.",
          "en": "Reports final size after resizing ends and any required layout callbacks are delivered."
        }
      },
      {
        "name": "onBeforeTitleDoubleClick",
        "description": {
          "ko": "타이틀 더블 클릭 처리 직전에 호출됩니다.",
          "en": "Called immediately before title double-click handling."
        }
      },
      {
        "name": "onTitleDoubleClick",
        "description": {
          "ko": "기본 빈 공간 채우기 후 타이틀 더블 클릭을 알립니다.",
          "en": "Reports a title double-click after default row-gap filling."
        }
      },
      {
        "name": "onAfterTitleDoubleClick",
        "description": {
          "ko": "더블 클릭 콜백 호출 후 실행됩니다. 세 단계 모두 클릭 시점의 좌표를 전달합니다.",
          "en": "Runs after the double-click callback. All three stages receive the layout captured at click time."
        }
      }
    ]
  },
  "layout/basic": {
    "items": [
      {
        "ko": "1~12 컬럼을 선택하면 현재 제어 레이아웃이 해당 컬럼 수에 맞게 전환됩니다.",
        "en": "Selecting 1–12 columns switches the current controlled layout to that column count."
      },
      {
        "ko": "이전에 사용한 컬럼 수로 돌아오면 저장된 배치를 복원합니다. x/y는 시작 컬럼·행, w/h는 차지하는 컬럼·행 수이며 픽셀 좌표가 아닙니다.",
        "en": "Returning to a visited column count restores its saved layout. x/y are starting column/row positions and w/h are column/row spans, not pixels."
      }
    ]
  },
  "layout/lock": {
    "items": [
      {
        "ko": "movable과 resizable을 동시에 false로 전달해 전체 레이아웃 상호작용을 잠급니다.",
        "en": "Passing false to both movable and resizable locks layout-wide interactions."
      },
      {
        "ko": "위젯별 movable/resizable 값은 유지되므로 전체 잠금을 해제하면 기존 위젯 설정이 다시 적용됩니다.",
        "en": "Per-widget movable/resizable values are preserved and apply again after unlocking."
      },
      {
        "ko": "잠금은 포인터 이동과 크기 조절에 적용됩니다. 추가·삭제 버튼이나 콘텐츠 입력은 별도로 제어하며, 이 예제에서는 계속 사용할 수 있습니다.",
        "en": "The lock applies to pointer movement and resizing. Add/remove buttons and content inputs require separate control and remain available in this example."
      },
      {
        "ko": "잠금 방식에서 Static Grid를 선택하면 engineOptions.staticGrid로 엔진의 정적 모드를 사용합니다. 레이아웃 잠금은 movable/resizable을 제어하고, 정적 모드는 외부 위젯 드롭 수신까지 차단합니다.",
        "en": "Choose Static Grid to use engineOptions.staticGrid. Interaction locking controls movable/resizable; static mode also blocks incoming external widget drops."
      },
      {
        "ko": "두 모드는 이 화면에서 이동·리사이즈 결과가 같습니다. Static Grid의 추가 차이는 외부 드롭 수신 차단이며, 이 화면에는 드롭 소스가 없습니다. 추가·삭제와 상태 명령은 계속 사용할 수 있습니다. 기본 타이틀 더블 클릭 확장도 잠금 중에는 실행하지 않습니다.",
        "en": "Both modes block movement and resizing in this screen. Static Grid additionally blocks incoming external drops; this screen has no drop source. Add/remove and state commands remain available. Default title double-click expansion is also blocked while locked."
      }
    ]
  },
  "layout/persistence": {
    "items": [
      {
        "ko": "serializeState는 위젯 속성, 현재 컬럼, 복원 위치, 컬럼별 레이아웃 캐시를 저장합니다.",
        "en": "serializeState stores widget properties, active columns, restore positions, and per-column layout caches."
      },
      {
        "ko": "restoreLayout은 저장한 전체 상태를 한 번의 제어 상태 명령으로 복구합니다.",
        "en": "restoreLayout restores the saved full state through one controlled-state command."
      },
      {
        "ko": "저장 → 위젯 이동 또는 컬럼 변경 → 불러오기 순서로 확인합니다. 이 예제는 페이지 메모리에만 저장하므로 새로고침하거나 페이지를 나가면 저장본이 사라집니다.",
        "en": "Save, move a widget or change columns, then load. This example stores the snapshot only in page memory; reloading or leaving the page discards it."
      },
      {
        "ko": "새로고침 후에도 유지하려면 앱에서 JSON을 저장소에 보관해야 합니다. serializeLayout은 현재 배치만, serializeState는 위젯 속성과 컬럼별 배치까지 포함합니다.",
        "en": "To persist across reloads, store the JSON in your app's storage. serializeLayout captures only the active layout; serializeState includes widget properties and per-column layouts."
      }
    ]
  },
  "layout/arrange": {
    "items": [
      {
        "ko": "autoArrangeWidgets는 위젯 배열 순서대로 왼쪽부터 배치하고 너비가 부족하면 다음 행으로 넘깁니다. 임의의 빈 구멍을 모두 메우는 최적화 알고리즘은 아닙니다.",
        "en": "autoArrangeWidgets places widgets left to right in array order and starts a new row when needed. It is not an optimization algorithm that fills every possible gap."
      },
      {
        "ko": "fitWidgetsToColumns는 시작 행 y가 같은 위젯을 묶어, 빈 컬럼 공간이 있는 행의 너비를 가능한 균등하게 재분배합니다. 위젯의 가로 위치와 너비가 바뀌며 크기 제약을 따릅니다.",
        "en": "fitWidgetsToColumns groups widgets with the same starting y and redistributes widths as evenly as possible in rows with unused columns. It changes horizontal positions and widths while respecting size constraints."
      },
      {
        "ko": "위젯을 이동하거나 삭제해 빈 공간을 만든 뒤 두 명령의 결과를 비교합니다. GridStack의 compact()와는 별개의 상태 변경 명령입니다.",
        "en": "Move or remove widgets to create gaps, then compare the two commands. These state commands are distinct from GridStack compact()."
      }
    ]
  },
  "layout/events": {
    "items": [
      {
        "ko": "onLayoutMutation은 useDashboardGrid의 옵션입니다. widget:add, widget:update, widget:remove, widgets:clear, layout:commit, layout:reset, layout:restore, layout:arrange, layout:fill, columns:change를 구분합니다.",
        "en": "onLayoutMutation is a useDashboardGrid option. Kinds are widget:add, widget:update, widget:remove, widgets:clear, layout:commit, layout:reset, layout:restore, layout:arrange, layout:fill, and columns:change."
      },
      {
        "ko": "좌표 변경만 감지하는 이벤트가 아닙니다. 위젯의 이동 잠금을 바꿔도 widget:update가 기록됩니다. React 상태 처리 후 kind, widgetIds, columns, snapshot을 전달하며 이 화면은 앞의 세 필드를 표시합니다.",
        "en": "This is not limited to coordinate changes: toggling a widget's move lock logs widget:update. After React state processing, it supplies kind, widgetIds, columns, and snapshot; this screen displays the first three fields."
      },
      {
        "ko": "타이틀 더블 클릭 자체는 기록하지 않습니다. 해당 콜백에서 상태 명령을 실행하면 그 명령의 결과는 기록됩니다. 상단 전체 잠금은 예제의 별도 상태이므로 이 로그에 포함되지 않습니다.",
        "en": "A title double-click itself is not logged, but state commands run by its callback can be. The top-level lock uses separate example state and is not included in this log."
      }
    ]
  },
  "advanced/cell-height": {
    "items": [
      {
        "ko": "engineOptions.cellHeight를 72px, 96px, 120px로 변경해 같은 레이아웃의 행 높이를 비교합니다.",
        "en": "Switch engineOptions.cellHeight between 72px, 96px, and 120px to compare row height on the same layout."
      },
      {
        "ko": "위젯의 W/H는 Grid 단위로 유지되고 실제 픽셀 높이만 셀 높이에 따라 달라집니다.",
        "en": "Widget W/H remain grid units while their pixel height changes with cell height."
      }
    ]
  },
  "advanced/grid-lines": {
    "items": [
      {
        "ko": "12컬럼과 96px 행 높이에 맞춘 Playground 전용 가이드 라인을 겹쳐 배치 단위를 표시합니다.",
        "en": "Overlays Playground-only guide lines aligned to 12 columns and 96px rows."
      },
      {
        "ko": "가이드 라인은 시각 보조이며 저장되는 위젯 레이아웃에는 영향을 주지 않습니다.",
        "en": "Guide lines are visual aids and do not affect saved widget layout."
      }
    ]
  },
  "advanced/float": {
    "items": [
      {
        "ko": "float=true는 위젯 위쪽의 빈 공간을 유지하고, false는 가능한 위쪽으로 당겨 배치합니다. 패키지 기본값은 false이며 이 예제는 true로 시작합니다.",
        "en": "float=true preserves gaps above widgets; false packs widgets upward. The package default is false; this example starts with true."
      },
      {
        "ko": "토글 전후에 위젯을 이동해 빈 공간 처리 차이를 확인합니다.",
        "en": "Move widgets before and after toggling to observe gap handling."
      }
    ]
  },
  "advanced/mobile-touch": {
    "items": [
      {
        "ko": "터치로 위젯을 이동하고 우측 하단 핸들로 크기를 조절합니다. 토글은 핸들 표시 방식만 바꾸며 이동·리사이즈 기능을 끄지 않습니다.",
        "en": "Move widgets by touch and resize from the bottom-right handle. The toggle changes handle visibility, not whether movement or resizing is enabled."
      },
      {
        "ko": "터치 환경에서 핸들을 상시 표시하는 mobile 설정과 자동 숨김 설정을 비교합니다. 640px 이하 컨테이너의 3컬럼 전환은 이 예제의 설정입니다.",
        "en": "Compare the mobile setting, which keeps handles visible on touch devices, with auto-hide. Switching to 3 columns at container widths up to 640px is specific to this example."
      }
    ]
  },
  "advanced/rtl": {
    "items": [
      {
        "ko": "rtl=true는 위젯 배치 기준과 드래그 좌표를 오른쪽에서 왼쪽 방향으로 전환합니다.",
        "en": "rtl=true switches widget placement and drag coordinates to right-to-left direction."
      },
      {
        "ko": "제어 상태의 x 값은 유지하면서 GridStack의 시각 위치 계산만 RTL 기준으로 동기화합니다.",
        "en": "Controlled x values remain stable while GridStack synchronizes visual positioning for RTL."
      }
    ]
  },
  "advanced/title-drag": {
    "items": [
      {
        "ko": "dragHandle을 타이틀 selector로 제한해 Content 조작과 위젯 이동 시작 영역을 분리합니다.",
        "en": "Limits dragHandle to the title selector, separating content interaction from the widget move start area."
      },
      {
        "ko": "설정이 켜져 있을 때 타이틀과 콘텐츠를 각각 드래그해 비교합니다. 타이틀에서만 이동이 시작되며 리사이즈는 우측 하단 핸들을 사용합니다.",
        "en": "With the setting enabled, compare dragging the title and the content. Only the title starts movement; resize using the bottom-right handle."
      }
    ]
  },
  "advanced/transform": {
    "items": [
      {
        "ko": "scale과 translate가 적용된 부모에서도 GridStack 포인터 좌표가 위젯 geometry로 정확히 변환되는지 확인합니다.",
        "en": "Verifies that GridStack pointer coordinates map correctly to widget geometry inside scaled and translated parents."
      },
      {
        "ko": "토글로 변환 전후의 동일한 이동·리사이즈 결과를 비교합니다.",
        "en": "Toggle the transform to compare identical move and resize outcomes."
      }
    ]
  },
  "advanced/external-drop-trash": {
    "items": [
      {
        "ko": "externalDropTargets는 같은 문서의 HTML 영역을 ID와 CSS 선택자로 등록합니다. iframe과 Shadow DOM 내부 대상은 지원하지 않습니다.",
        "en": "externalDropTargets registers HTML areas in the same document by ID and CSS selector. Targets inside iframes or Shadow DOM are not supported."
      },
      {
        "ko": "패키지는 onWidgetExternalDrop으로 드롭을 알립니다. 이 예제는 targetId === \"trash\"를 확인하고 removeWidget을 호출해 삭제합니다.",
        "en": "The package reports drops through onWidgetExternalDrop. This example checks targetId === \"trash\" and calls removeWidget to delete the widget."
      },
      {
        "ko": "휴지통 밖에 놓거나 삭제 콜백을 연결하지 않으면 위젯은 삭제되지 않습니다. 일반 드래그에 따른 배치 변경은 onLayoutCommit을 통해 별도로 반영될 수 있습니다.",
        "en": "Dropping outside the trash or omitting the deletion callback does not delete the widget. Ordinary drag layout changes may still be applied through onLayoutCommit."
      }
    ]
  },
  "advanced/public-api": {
    "items": [
      {
        "ko": "읽기 메서드: getColumnCount, getRowCount, getFloat, isAreaEmpty, willItFit으로 엔진 상태를 조회합니다.",
        "en": "Read methods: query engine state with getColumnCount, getRowCount, getFloat, isAreaEmpty, and willItFit."
      },
      {
        "ko": "compact는 배치를 정리하고 결과를 onLayoutCommit으로 전달합니다. 이 예제는 applyLayoutSnapshot을 연결해 React 상태에 반영합니다. commitLayout은 현재 배치를 전달하며 같은 결과의 중복 전달을 억제합니다.",
        "en": "compact rearranges widgets and reports the result through onLayoutCommit. This example connects applyLayoutSnapshot to update React state. commitLayout reports the current layout and suppresses duplicates."
      },
      {
        "ko": "refresh는 콘텐츠와 드래그 핸들을 다시 측정하고 필요한 배치 보정을 전달합니다. 엔진 준비 전에는 조회 결과와 배치 반환값이 null일 수 있습니다.",
        "en": "refresh remeasures content and drag handles and reports any needed layout corrections. Queries and layout-returning methods may return null before the engine is ready."
      },
      {
        "ko": "isAreaEmpty는 지정 영역의 점유 여부를 검사합니다. willItFit은 위젯 배치 후 최대 행 수 maxRow를 넘는지 검사하며, 이 예제처럼 제한이 없으면 true입니다.",
        "en": "isAreaEmpty checks occupancy of a specified area. willItFit checks whether placing a widget would exceed maxRow; it is true without that limit, as in this example."
      },
      {
        "ko": "getGridStack은 하위 호환 escape hatch이며 raw addWidget/removeWidget/load/destroy는 제어 상태를 우회하므로 사용하지 않습니다.",
        "en": "getGridStack is a compatibility escape hatch; raw addWidget/removeWidget/load/destroy bypass controlled state and are not used here."
      }
    ],
    "referenceCaption": {
      "ko": "공개 메서드",
      "en": "Public methods"
    },
    "referenceNameLabel": {
      "ko": "메서드명",
      "en": "Method name"
    },
    "references": [
      {
        "name": "getColumnCount",
        "description": {
          "ko": "현재 Grid의 활성 컬럼 수를 조회합니다.",
          "en": "Returns the active grid column count."
        }
      },
      {
        "name": "getRowCount",
        "description": {
          "ko": "최소 행 수 minRow 설정을 포함한 현재 Grid의 행 수를 조회합니다.",
          "en": "Returns the current grid row count, including the minRow setting."
        }
      },
      {
        "name": "getFloat",
        "description": {
          "ko": "현재 GridStack float 설정을 조회합니다.",
          "en": "Returns the current GridStack float setting."
        }
      },
      {
        "name": "isAreaEmpty",
        "description": {
          "ko": "지정한 x, y, w, h 영역이 비어 있는지 확인합니다.",
          "en": "Checks whether a specified x, y, w, h area is empty."
        }
      },
      {
        "name": "willItFit",
        "description": {
          "ko": "최대 행 수 maxRow 안에 배치 가능한지 검사합니다. 제한이 없으면 true이며 지정 위치가 비었다는 보장은 아닙니다.",
          "en": "Checks whether placement fits within maxRow. Without that limit it returns true; this does not guarantee the requested position is empty."
        }
      },
      {
        "name": "compact",
        "description": {
          "ko": "배치를 정리하고 onLayoutCommit으로 결과를 전달한 뒤 스냅샷을 반환합니다.",
          "en": "Compacts the layout, reports it through onLayoutCommit, and returns the snapshot."
        }
      },
      {
        "name": "refresh",
        "description": {
          "ko": "콘텐츠와 핸들을 재측정하고 필요한 배치 보정을 전달합니다. 반환값은 없습니다.",
          "en": "Remeasures content and handles and reports needed layout corrections. Returns no value."
        }
      },
      {
        "name": "commitLayout",
        "description": {
          "ko": "현재 배치를 콜백으로 전달하고 반환합니다. 동일 스냅샷의 중복 전달은 억제합니다.",
          "en": "Reports and returns the current layout, suppressing duplicate snapshot notifications."
        }
      },
      {
        "name": "getGridStack",
        "description": {
          "ko": "하위 호환 escape hatch입니다. raw CRUD는 제어 상태를 우회하므로 사용하지 않습니다.",
          "en": "Backward-compatibility escape hatch. Do not use raw CRUD because it bypasses controlled state."
        }
      }
    ]
  },
  "advanced/size-to-content": {
    "items": [
      {
        "ko": "위젯의 행 수 h를 조정합니다. cellHeight는 유지하며 헤더 높이와 minH/maxH 제약을 포함합니다.",
        "en": "Adjusts widget height h in rows, preserving cellHeight and respecting the header height and minH/maxH limits."
      },
      {
        "ko": "이 예제는 켜진 상태로 시작하지만 패키지에서 자동 활성화되지는 않습니다. 고정 높이 카드에는 끈 상태를 사용합니다.",
        "en": "This example starts enabled; the package does not enable it by default. Leave it off for fixed-height cards."
      },
      {
        "ko": "내용 추가·삭제 후 refreshKey로 재측정하고 onLayoutCommit으로 React 상태를 갱신합니다. 이 예제는 cellHeight=1px을 사용하여 헤더·여백·줄바꿈을 포함한 실제 콘텐츠 높이에 1px 단위로 맞춥니다. 항목 추가·삭제 시 실제 요소 높이만큼 증감하며, 저장되는 h도 1px 단위입니다. 항목 하나를 그리드 한 칸으로 환산하지 않습니다.",
        "en": "Content changes trigger remeasurement through refreshKey and update React state through onLayoutCommit. This example uses cellHeight=1px to fit the actual content height, including headers, spacing and wrapped text, to the nearest enclosing pixel. Adding or removing an item changes height by its actual element height; saved h values also use 1px units. One item does not mean one grid row."
      },
      {
        "ko": "끄면 내용이 늘어도 현재 높이를 유지하며 내부에서 스크롤합니다. 수동 리사이즈는 별도 설정이며, 켠 상태에서는 재측정 시 콘텐츠 높이가 다시 적용됩니다.",
        "en": "When off, added content scrolls within the current height. Manual resizing is a separate setting; when enabled, remeasurement reapplies the content height."
      }
    ]
  },
  "advanced/lazy-load": {
    "items": [
      {
        "ko": "lazyRenderWidget는 콘텐츠의 최초 렌더링만 지연합니다. 외곽과 제목은 처음부터 표시되며 전체 위젯 가상화나 데이터 다운로드 기능은 아닙니다.",
        "en": "lazyRenderWidget delays only the first content render. Shells and titles exist from the start; this is not whole-widget virtualization or data fetching."
      },
      {
        "ko": "아래 상태는 실제 콘텐츠 컴포넌트가 마운트된 결과입니다. 한 번 완료된 본문은 화면 밖으로 나가도 유지되며 이후 React 상태 변경도 반영됩니다.",
        "en": "The status reflects actual content component mounts. Once mounted, content stays mounted offscreen and continues to receive React updates."
      },
      {
        "ko": "끄면 모든 본문이 즉시 렌더링됩니다. 다시 켜도 이미 표시된 본문은 숨기지 않습니다. 켜짐 상태에서 다시 실험을 누르면 Grid를 새로 마운트하고 스크롤을 처음으로 되돌립니다.",
        "en": "Turning this off renders all content immediately. Turning it back on does not hide existing content. Restart while enabled to remount the grid and reset its scroll position."
      }
    ]
  },
  "advanced/responsive": {
    "items": [
      {
        "ko": "컬럼 결정 방식: columnWidth=180은 컨테이너 너비를 180으로 나눈 값을 반올림해 1~12컬럼으로 제한합니다. 고정 셀 너비가 아닙니다.",
        "en": "Column calculation: columnWidth=180 rounds the container width divided by 180, limited to 1–12 columns. It does not fix cell widths."
      },
      {
        "ko": "Breakpoint 방식: 컨테이너 너비 640px 이하에서 2컬럼, 960px 이하에서 6컬럼, 그보다 넓으면 12컬럼입니다. 이 수치는 예제 설정입니다.",
        "en": "Breakpoints: up to 640px uses 2 columns, up to 960px uses 6, and wider containers use 12. These are example settings."
      },
      {
        "ko": "배치 정책: moveScale은 x/w를 비례 조정합니다. layout: \"none\"은 비례 변환을 하지 않지만 컬럼 경계와 위젯 겹침은 보정합니다. none은 반응형을 끄는 설정이 아닙니다.",
        "en": "Layout policy: moveScale scales x/w proportionally. layout: \"none\" skips proportional scaling but corrects column bounds and overlaps. none does not disable responsiveness."
      },
      {
        "ko": "너비만 바꾸면 방문한 컬럼의 저장된 배치를 복원합니다. 방식·정책 변경 또는 다시 실험은 초기 배치와 캐시부터 시작합니다. 실제 너비는 화면의 사용 가능한 공간으로 제한됩니다.",
        "en": "Changing width restores cached layouts for visited column counts. Changing method/policy or restarting resets the layout and cache. Actual width is capped by the available screen space."
      }
    ]
  },
  "advanced/multi-grid/horizontal": {
    "items": [
      {
        "ko": "복사 모드에서는 원래 위치에 원본 모양을 남기고 + 윤곽선만 움직입니다. 대상 Grid의 배치 예정 영역에 놓으면 복사됩니다. 같은 Grid 안에 놓으면 기존처럼 위치만 바뀌며 복제되지 않습니다.",
        "en": "Copy mode leaves a visual of the source in place and moves only a + outline. Drop on the target grid's placement preview to copy. Dropping within the same grid still moves the widget; it does not duplicate it."
      },
      {
        "ko": "팔레트 항목은 복사 방식으로 새 위젯을 만듭니다. acceptExternalWidgets가 허용한 요청을 onWidgetDropRequest에서 받아 앱의 React 상태를 갱신해야 추가됩니다. 요청만 받고 상태를 갱신하지 않으면 추가되지 않습니다.",
        "en": "Palette items create widgets by copying. After acceptExternalWidgets accepts a candidate, handle onWidgetDropRequest and update the app's React state to add it. Receiving the request alone does not add a widget."
      },
      {
        "ko": "Grid 간 이동은 원본을 제거하고 복사는 원본을 유지합니다. 복사도 위젯 ID를 유지하므로 대상에 같은 ID가 있으면 거부됩니다. locked·이동 불가·최소화·최대화 위젯도 전송할 수 없습니다.",
        "en": "Moving between grids removes the source widget; copying keeps it. Copies retain the widget ID, so an existing target ID causes rejection. Locked, non-movable, minimized, and maximized widgets cannot transfer."
      },
      {
        "ko": "A → B 전송 허용/차단을 전환하여 같은 위젯의 이동·복사를 비교합니다. 차단은 드래그와 전송 버튼에 동일하게 적용하며 양쪽 목록을 유지합니다. B → A와 팔레트 추가는 허용합니다. 신규 팔레트 위젯은 6×2로, Grid A에서는 전체 너비, Grid B에서는 절반 너비로 추가됩니다.",
        "en": "Toggle A → B transfer acceptance to compare moving and copying the same widget. Blocking applies equally to dragging and transfer buttons, preserving both lists. B → A and palette additions remain allowed. New palette widgets use 6×2 cells: full width in Grid A and half width in Grid B."
      },
      {
        "ko": "두 Grid를 가로 또는 세로로 배치해 좌우·상하 전송 동선을 비교합니다.",
        "en": "Switch between horizontal and vertical grid arrangements to compare left-right and top-bottom transfer flow."
      },
      {
        "ko": "전송 버튼은 같은 transferDashboardWidget 함수를 사용하는 키보드 조작 대안입니다. 드래그는 놓은 위치를 사용하고, 버튼은 대상 Grid의 마지막 행 아래에 배치합니다.",
        "en": "Transfer buttons provide a keyboard alternative using the same transferDashboardWidget helper. Dragging uses the drop location; buttons place the widget below the target grid's last row."
      }
    ]
  },
  "advanced/nested/basic": {
    "items": [
      {
        "ko": "2단계 Root → Child 또는 3단계 Root → Child → Grandchild로 DashboardGrid를 구성합니다. 각 단계는 독립된 React 제어 상태와 layout commit을 소유합니다.",
        "en": "Compose DashboardGrid as two levels (Root → Child) or three (Root → Child → Grandchild). Each level owns independent React controlled state and layout commits."
      },
      {
        "ko": "부모 위젯의 renderWidget 안에 자식 DashboardGrid를 렌더링합니다. 각 단계의 위젯과 배치는 해당 React 상태에서 관리합니다. 자식 Grid의 gridId는 서로 다르며 GridStack의 자동 하위 Grid 생성 기능은 사용하지 않습니다.",
        "en": "Render a child DashboardGrid inside the parent widget's renderWidget. Each level manages its widgets and layout in its own React state. Child grids have distinct gridId values; GridStack's automatic sub-grid creation is not used."
      },
      {
        "ko": "중첩만으로 위젯이 다른 Grid로 전송되지는 않습니다. 계층 내부 이동은 같은 Grid의 layout 이동이며 A→B Grid 전송은 다중 Grid 예제로 분리되어 있습니다.",
        "en": "Nesting alone does not transfer widgets between grids. Movement inside the hierarchy changes layout within one grid; A-to-B grid transfer is separated into the Multiple Grids example."
      },
      {
        "ko": "중첩 경계 충돌을 피하기 위해 각 위젯은 표시된 타이틀 grab 영역에서 이동합니다.",
        "en": "Widgets move from the visible title grab area to avoid interaction conflicts across nested boundaries."
      }
    ]
  }
};

export function getExampleGuidance(id: string, locale: Locale, framework: Framework) {
  const entry = guidance[id];
  if (!entry) return undefined;
  const localize = (copy: Copy) => exampleTextForFramework(copy[locale], framework, locale);
  return { items: entry.items.map(localize),
    references: entry.references?.map(row => ({ name: exampleTextForFramework(row.name, framework, locale), description: localize(row.description) })),
    referenceCaption: entry.referenceCaption ? localize(entry.referenceCaption) : undefined,
    referenceNameLabel: entry.referenceNameLabel ? localize(entry.referenceNameLabel) : undefined,
  };
}

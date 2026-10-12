# Playground

저장소 Playground는 가이드와 동일한 public package surface를 실행하는 예제 애플리케이션입니다.

```bash
git clone https://github.com/kim1124/comins-layout.git
cd comins-layout
npm install
npm run dev
```

시작 문서는 `http://127.0.0.1:6001/docs/getting-started`, API reference는 `http://127.0.0.1:6001/api`입니다.

| 기능 | 경로 |
| --- | --- |
| 시작 가이드 | `/docs/getting-started` |
| 위젯 기본 | `/examples/widget/basic` |
| 추가, 전체 삭제, 초기화 | `/examples/widget/manage` |
| 위젯 이벤트 | `/examples/widget/events` |
| 레이아웃 기본 | `/examples/layout/basic` |
| 잠금/해제 | `/examples/layout/lock` |
| 저장/불러오기 | `/examples/layout/persistence` |
| 자동 정렬/빈 공간 채우기 | `/examples/layout/arrange` |
| 레이아웃 이벤트 | `/examples/layout/events` |
| 콘텐츠 지연 렌더링 및 상태 확인 | `/examples/advanced/lazy-load` |
| 반응형: 컬럼 결정 방식과 배치 정책 비교 | `/examples/advanced/responsive` |
| 다중 Grid 전송과 배치 방향 전환 | `/examples/advanced/multi-grid/horizontal` |
| 외부 휴지통 드롭 | `/examples/advanced/external-drop-trash` |
| 안전한 public handle | `/examples/advanced/public-api` |
| API reference | `/api` |

Advanced 메뉴에는 grid line, float, mobile touch, 2/3단계 nested composition, RTL, size to content, title drag handle, transform 예제도 있습니다. 다중 Grid route에서는 가로/세로 배치를 페이지 안에서 전환합니다. 반응형 세 예제는 한 페이지로 통합했으며 기존 주소도 유지됩니다.

정적 모드(Static Grid)는 레이아웃 잠금/해제 페이지의 잠금 방식 선택에 통합했습니다. 위젯 기본 페이지는 타이틀 더블 클릭으로 빈 공간을 채웁니다. 동적 위젯 크기(`/examples/widget/resize`)에서 대상을 선택하고 W/H 입력·적용 크기·복원을 확인합니다. Size To Content 페이지는 내용 추가·삭제와 옵션 전환으로 자동 높이와 고정 높이를 비교합니다.

API reference는 기능 설명 → 직접 실행 → 최소 적용 코드 → 상세 API 순서로 읽습니다. 각 항목의 실행 버튼은 동일한 Playground 화면을 문서 안에 엽니다. 한 번에 하나만 실행하며 전환·종료 시 예제 상태는 초기화됩니다. 타입·유틸리티에는 관련 예제와 호출 코드가 함께 제공됩니다.

`/readme-demo`는 README GIF 재생성을 위한 내부 deterministic fixture이며 소비자 예제 또는 지원 package route가 아닙니다.

README GIF 5개는 전체 플레이그라운드 UI가 아닌 기능별 축약 화면입니다. 실제 촬영 장면과 기준 날짜는 [촬영 안내](../assets/README.md)에서 확인합니다. 현재 가이드는 소스 버전 `0.3.0` 기준이며, npm 공개 여부는 레지스트리에서 별도로 확인합니다.

가이드와 예제의 내용이 다르면 현재 export된 TypeScript declaration과 focused test를 구현 계약으로 확인한 뒤 문서 오류를 이슈로 보고합니다.

Mobile Touch 예제는 640px 이하 컨테이너에서 3컬럼을 사용해 초기 위젯의 제목과 버튼 공간을 확보합니다. 토글은 핸들 상시 표시를 `"mobile"`과 `false`로 전환하며 이동·리사이즈는 계속 가능합니다. Breakpoint 예제는 컨테이너 너비 기준이고 `none`도 경계와 겹침을 보정합니다. 이는 예제 설정이며 패키지 전역 반응형 기본값이 아닙니다.

## 0.3.0 공통 React/Vue 셸

Sortable Playground와 동일한 상단 헤더·사이드바, 예제 제목·API 태그, 밑줄형 프레임워크 탭, 우측 정렬 제어 영역, 실행 화면·소스 카드 구조를 사용한다. React/Vue 전환 시에도 패널 간격과 정렬은 유지하며, 위젯별 조작은 Grid Layout 기능에 맞춰 제공한다.

`/examples/widget/basic/react` 또는 `/examples/widget/basic/vue`에서 동일한 셸을 사용한다. 왼쪽에서 기능 예제를 선택하고 React/Vue 탭으로 실행 프레임워크를 바꾼다. 초기 배치·컬럼·셀 높이·주요 옵션은 동일하다. 전환하면 해당 예제를 초기화하며 언어 변경은 현재 상태를 유지한다. 코드 보기는 실제 TSX/SFC와 보조 파일을 제공하고 관련 API 표기는 콜백·emit·slot에 맞춰 바뀐다. 기존 React 주소는 계속 사용할 수 있다. npm 0.2.3은 Vue를 포함하지 않는다.

Playground는 `npm run dev`로 로컬에서 개발자가 직접 실행한다. 900px 이하에서는 예제 선택 메뉴를 사용하며 페이지를 스크롤해 실행 영역에 접근한다. 좁은 위젯의 제목과 버튼은 헤더 안에서 줄바꿈한다.

React와 Vue 3 탭은 23개 예제의 제어 순서·아이콘·실행 배치·결과 표시를 공유하며, 실제 렌더러와 API 연결만 다르다. 실행 영역 아래의 **기능 설명 · 동작 및 API**를 펼치면 해당 예제의 동작·제약·이벤트 또는 메서드 설명을 확인할 수 있다. Vue 탭에서는 컴포넌트 emit과 slot 명칭을 표시하고 `onLayoutMutation`은 Composable 옵션 콜백으로 유지한다.

동적 위젯 크기의 W 상한은 현재 컬럼 수(초기 12)이며 H는 1~6입니다. Basic은 탭 아래 22px 여백을 두며, 조작 가능한 타이틀은 손모양 커서를 표시합니다. 이동·리사이즈가 모두 불가능하거나 정적 모드이면 기본 커서를 사용합니다.

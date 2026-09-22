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

정적 모드(Static Grid)는 레이아웃 잠금/해제 페이지의 잠금 방식 선택에 통합했습니다. 위젯 기본 페이지에서는 대상을 선택해 최대화·최소화·복원을 실행합니다. Size To Content 페이지는 내용 추가·삭제와 옵션 전환으로 자동 높이와 고정 높이를 비교합니다.

API reference는 기능 설명 → 직접 실행 → 최소 적용 코드 → 상세 API 순서로 읽습니다. 각 항목의 실행 버튼은 동일한 Playground 화면을 문서 안에 엽니다. 한 번에 하나만 실행하며 전환·종료 시 예제 상태는 초기화됩니다. 타입·유틸리티에는 관련 예제와 호출 코드가 함께 제공됩니다.

`/readme-demo`는 README GIF 재생성을 위한 내부 deterministic fixture이며 소비자 예제 또는 지원 package route가 아닙니다.

README GIF 5개는 전체 플레이그라운드 UI가 아닌 기능별 축약 화면입니다. 실제 촬영 장면과 기준 날짜는 [촬영 안내](../assets/README.md)에서 확인합니다. 현재 가이드는 소스 버전 `0.2.3` 기준이며, npm 공개 여부는 레지스트리에서 별도로 확인합니다.

가이드와 예제의 내용이 다르면 현재 export된 TypeScript declaration과 focused test를 구현 계약으로 확인한 뒤 문서 오류를 이슈로 보고합니다.

Mobile Touch 예제는 640px 이하 컨테이너에서 3컬럼을 사용해 초기 위젯의 제목과 버튼 공간을 확보합니다. 토글은 핸들 상시 표시를 `"mobile"`과 `false`로 전환하며 이동·리사이즈는 계속 가능합니다. Breakpoint 예제는 컨테이너 너비 기준이고 `none`도 경계와 겹침을 보정합니다. 이는 예제 설정이며 패키지 전역 반응형 기본값이 아닙니다.

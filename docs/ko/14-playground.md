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
| React content lazy | `/examples/advanced/lazy-load` |
| 반응형 column width | `/examples/advanced/responsive/column` |
| 반응형 breakpoint | `/examples/advanced/responsive/breakpoints` |
| 팔레트와 Grid 전송 | `/examples/advanced/multi-grid/horizontal` |
| 안전한 public handle | `/examples/advanced/public-api` |
| API reference | `/api` |

Advanced 메뉴에는 grid line, float, mobile touch, nested composition, responsive `none`, RTL, size to content, static mode, title drag handle, transform, vertical multi-grid 예제도 있습니다.

`/readme-demo`는 README GIF 재생성을 위한 내부 deterministic fixture이며 소비자 예제 또는 지원 package route가 아닙니다.

가이드와 예제의 내용이 다르면 현재 export된 TypeScript declaration과 focused test를 구현 계약으로 확인한 뒤 문서 오류를 이슈로 보고합니다.

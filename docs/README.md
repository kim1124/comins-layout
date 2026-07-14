# comins-grid-layout Docs

이 디렉터리는 `comins-grid-layout` 패키지 설계, public API, 검증 기준을 관리한다.

## 독립 저장소 기준

`comins-grid-layout`는 KMSF 모노레포의 `packages/gridstack`에서 분리된 독립 프로젝트다. 현재 개발과 릴리스의 기준은 `<repo-root>` 및 GitHub [`kim1124/comins-layout`](https://github.com/kim1124/comins-layout) 저장소다. KMSF 경로와 과거 문서는 이력 참고용이며, 이 저장소의 변경을 자동으로 동기화하는 대상이 아니다.

## 문서 목록

- `01-requirements.md`: 사용자 요구사항을 패키지 관점으로 정리한 문서
- `02-architecture.md`: React 어댑터, GridStack 엔진 경계, 상태 모델 구조
- `03-component-api-draft.md`: 컴포넌트와 훅 API 기준
- `04-verification-strategy.md`: Vitest, Playwright, 빌드 검증 기준
- `05-open-questions.md`: 후속 합의가 필요한 항목
- `superpowers/specs/2026-07-14-persistence-performance-stabilization-design.md`: persistence round-trip 및 100+ widget 안정화 설계

프로젝트 운영 및 기여 절차는 루트 `GUIDE.md`를 따른다.

## 현재 상태

현재 단계는 `DashboardGrid`, `useDashboardGrid`, GridStack adapter boundary, Vitest, Playwright 검증이 존재하는 구현 진행 상태다. 후속 기능 확장 시에도 TDD 절차에 따라 실패 테스트를 먼저 추가한다.

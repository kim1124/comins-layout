# comins-grid-layout Docs

이 디렉터리는 `comins-grid-layout` 패키지 설계, public API, 검증 기준을 관리한다.

## Standalone Documentation Contract

현재 개발과 릴리스 준비의 기준은 `<repo-root>`, npm package `comins-grid-layout`, GitHub [`kim1124/comins-layout`](https://github.com/kim1124/comins-layout) 저장소다. 이 디렉터리의 current contract는 root `GUIDE.md`와 경로별 `AGENTS.md`를 따른다.

## 문서 목록

- `01-requirements.md`: 사용자 요구사항을 패키지 관점으로 정리한 문서
- `02-architecture.md`: React 어댑터, GridStack 엔진 경계, 상태 모델 구조
- `03-component-api-draft.md`: 컴포넌트와 훅 API 기준
- `04-verification-strategy.md`: Vitest, Playwright, 빌드 검증 기준
- `05-open-questions.md`: resolved product decisions, explicit unsupported behavior, and provider-side boundaries
- `superpowers/specs/2026-07-14-persistence-performance-stabilization-design.md`: persistence round-trip 및 100+ widget 안정화 설계
- `superpowers/plans/2026-07-14-persistence-performance-stabilization.md`: persistence 및 Chrome resource counter 구현 계획

프로젝트 운영 및 기여 절차는 루트 `GUIDE.md`를 따른다.

## Historical Records

`reports/`와 완료된 `superpowers/specs`, `superpowers/plans` 문서는 당시의 결정과 검증 증적이다. 현재 운영 지침을 바꾸는 대상이 아니며, 과거 저장소·환경 참조는 이력으로 유지한다.

## 현재 상태

현재 단계는 `DashboardGrid`, `useDashboardGrid`, GridStack adapter boundary, Vitest, Playwright 검증이 존재하는 구현 진행 상태다. 재현 가능한 결함이나 결정론적 동작 변경은 신뢰도를 높일 수 있을 때 가장 작은 회귀 테스트를 먼저 추가하고, 문서·설정 변경은 유형에 맞는 검증을 사용한다.

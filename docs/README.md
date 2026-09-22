# comins-grid-layout Docs

이 디렉터리는 `comins-grid-layout` 0.2.3 기준 사용자 가이드, 패키지 설계, public API, 검증 기준을 관리한다.

현재 체크아웃의 `CHANGELOG.md` **Unreleased** 변경도 포함한다. 문서와 GIF의 최신화는 npm 배포를 의미하지 않으며, 버전 번호는 이번 문서 갱신으로 변경하지 않는다.

## 사용자 가이드

- `docs/user`: 영문 primary 가이드. 현재 공개 API, 실행 예제, 상태 소유권, 실패·미지원 경계를 설명한다.
- `docs/ko`: 영문과 동일한 파일 구조의 국문 가이드다.
- 신규 사용자는 `docs/user/01-quick-start.md` 또는 `docs/ko/01-quick-start.md`부터 확인한다.

## 현재 예제 확인 순서

| 확인할 내용 | 로컬 경로 | 가이드 |
| --- | --- | --- |
| 기능 목적 → 실행 예제 → 최소 코드 → 상세 API | `/api` | [플레이그라운드](ko/14-playground.md) |
| 이동·리사이즈 잠금과 정적 모드의 차이 | `/examples/layout/lock` | [엔진 옵션](ko/11-engine-options.md) |
| 내용 추가·삭제에 따른 자동 높이 | `/examples/advanced/size-to-content` | [엔진 옵션](ko/11-engine-options.md) |
| 원본을 남기는 복사와 원본을 옮기는 이동 | `/examples/advanced/multi-grid/horizontal` | [팔레트와 그리드 전송](ko/08-palette-and-grid-transfer.md) |
| 컬럼 결정 방식과 배치 정책 비교 | `/examples/advanced/responsive` | [반응형 레이아웃](ko/06-responsive-layouts.md) |
| 내부 스크롤 후 콘텐츠 렌더링 개수 변화 | `/examples/advanced/lazy-load` | [지연 렌더링](ko/09-lazy-rendering.md) |

`npm run dev`로 실행한 서버에서 확인한다. README의 GIF는 전체 UI가 아닌 기능별 축약 촬영이며, 촬영 범위와 재생성 방법은 [GIF 안내](assets/README.md)를 따른다.

## Maintainer 문서

- `01-requirements.md`: 사용자 요구사항을 패키지 관점으로 정리한 문서
- `02-architecture.md`: React 어댑터, GridStack 엔진, transfer, lazy content 경계와 상태 모델 구조
- `03-component-api-draft.md`: 파일명은 유지하지만 내용은 `0.2.3` current 컴포넌트·훅 API reference
- `assets/README.md`: README GIF의 촬영 소스, 버전, 재생성 및 검증 방법
- `04-verification-strategy.md`: Vitest, Playwright, 빌드 검증 기준
- `05-open-questions.md`: resolved product decisions, explicit unsupported behavior, and provider-side boundaries
- `06-transfer-lazy-loading-plan.md`: transfer 구현 완료와 최소 lazy content boundary, 미구현 skeleton/full-lazy 범위를 함께 보존한 부분 구현 계획
- `superpowers/plans/2026-08-28-playground-example-restructure.md`: 3개 메뉴와 기능별 서브 메뉴 Playground 구현 계약

프로젝트 운영 및 기여 절차는 루트 `GUIDE.md`를 따른다.

## Historical Records

`reports/`와 완료된 `superpowers/specs`, `superpowers/plans` 문서는 당시의 결정과 검증 증적이다. 현재 운영 지침을 바꾸는 대상이 아니며, 과거 저장소·환경 참조는 이력으로 유지한다.

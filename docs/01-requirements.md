# Requirements

## Goal

자율형 대시보드 레이아웃을 구성할 수 있는 React 패키지를 만든다.

## Functional Requirements

- 위젯 CRUD를 지원한다.
- 위젯을 마우스로 드래그 앤 드롭하여 위치를 변경할 수 있다.
- 위젯 크기 조절을 지원한다.
- 위젯 최대화와 최소화를 지원한다.
- 위젯을 한 번에 정렬하는 자동 정렬 기능을 제공한다.
- 레이아웃 컬럼 수를 `1`부터 `12`까지 변경할 수 있다.
- 컬럼 수 변경은 런타임에 반영되어야 한다.
- 위젯 이동 가능 여부를 옵션으로 제어한다.
- 위젯 크기 조절 가능 여부를 옵션으로 제어한다.
- 위젯 내부 콘텐츠는 위젯 크기 변화에 반응할 수 있어야 한다.
- 콘텐츠 resize 알림은 `requestAnimationFrame` 또는 `ResizeObserver` 기반으로 스케줄링한다.
- 레이아웃 초기화, 갱신, 리셋, 직렬화를 지원한다.

## Non-Functional Requirements

- 대시보드 기본 레이아웃으로 재사용될 가능성이 높으므로 메모리와 성능을 우선 검토한다.
- React 렌더 경로에서 대량 객체 복사를 피한다.
- 드래그와 리사이즈 중에는 고빈도 React 상태 갱신을 피한다.
- 엔진 교체 가능성을 위해 GridStack 직접 사용은 어댑터 내부로 제한한다.
- 패키지는 Next.js에 의존하지 않는다.

## Initial Technology Stack

- React
- TypeScript
- Vite
- Vitest
- Playwright
- GridStack

## Repository Scope

- 이 패키지는 KMSF 모노레포의 하위 패키지가 아닌 독립 Git 저장소로 관리한다.
- 기능 구현, 검증, 작업 보고, 원격 반영은 이 저장소와 `kim1124/comins-layout`의 `main` 브랜치를 기준으로 한다.
- KMSF `packages/gridstack`는 이관 이전 이력 참고 대상으로만 사용하며, 기본 작업에서 소스 동기화를 요구하지 않는다.

## Library Research Notes

- GridStack은 공식 React 예제를 제공하지만 React 전용 래퍼를 안정 API로 제공하는 방식은 아니다.
- `react-grid-layout`은 React 전용 대시보드 레이아웃 라이브러리로 널리 사용되는 대안이다.
- 현재 패키지명과 요구사항 기준으로는 GridStack을 기본 엔진으로 채택하되, 어댑터 경계로 교체 가능성을 남긴다.

## Source References

- GridStack React hooks demo: https://gridstackjs.com/demo/react-hooks.html
- GridStack API docs: https://gridstackjs.com/doc/html/classes/GridStack.html
- react-grid-layout repository: https://github.com/react-grid-layout/react-grid-layout

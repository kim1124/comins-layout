# comins-grid-layout Test Artifacts

`vitest`는 순수 로직, `playwright`는 브라우저 상호작용을 검증한다. 명령과 resource gate는 루트·이 디렉터리의 `AGENTS.md` 및 [Verification Strategy](../docs/04-verification-strategy.md)를 따른다.

Unreleased Core/Vue 검증은 `npm run check:core`, `npm run typecheck:vue`, `npm run verify`에 포함된 산출물 경계 검사, `npm run test:consumer`의 독립 설치 5개로 구분한다. 소비자는 동일 tarball을 사용하며 반대 프레임워크 미설치·제네릭 음성 타입·production 렌더링을 확인한다. 결과와 tarball 해시는 `reports/artifacts/consumer/result.json`에 기록한다. 테스트 fixture의 Vue 화면을 공개 예제로 재사용하지 않는다.

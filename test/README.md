# comins-grid-layout Test Artifacts

이 디렉터리는 패키지 로컬 테스트와 검증 산출물을 관리한다.

- `vitest`: 순수 helper, reducer, adapter option mapping 테스트
- `playwright`: 예제 렌더링과 브라우저 상호작용 테스트

기본 검증은 루트에서 `npm run verify`를 실행한다. GridStack lifecycle, drag, resize, column cycle, 또는 100+ widget 동작 변경은 `npm run verify:full`로 Chromium CDP resource gate까지 확인한다. 작업 보고서는 루트 `reports/YYYY-MM-DD.md`에 기록한다.

# comins-grid-layout Development Guide

## Project Ownership

`comins-grid-layout`는 KMSF 모노레포의 `packages/gridstack`에서 분리된 독립 프로젝트다. 기능 구현, 문서, 테스트, 작업 보고, 릴리스 준비는 이 저장소에서 관리한다.

- Local root: `<repo-root>`
- GitHub repository: [`kim1124/comins-layout`](https://github.com/kim1124/comins-layout)
- Integration branch: `main`
- npm package name: `comins-grid-layout`

KMSF `packages/gridstack`는 분리 이전의 이력과 구현 배경을 확인할 때만 참고한다. 별도 지시가 없으면 두 저장소 간 소스 동기화, 변경 복제, 동시 릴리스를 수행하지 않는다.

## Working Agreement

1. 작업 전 루트 `AGENTS.md`와 대상 디렉터리의 `AGENTS.md`를 확인한다.
2. 변경 범위는 `README.md`, 이 문서, `docs/README.md` 및 대상 기능 문서에서 먼저 확인한다.
3. GridStack 의존 코드는 `src/gridstack` adapter boundary 내부에 유지하고, layout state는 serializable object로 유지한다.
4. substantial 변경은 `reports/YYYY-MM-DD.md`에 작업 시각, 변경 파일, 실제 실행한 검증, 결과, 잔여 리스크를 기록한다.

## Verification and Integration

기본 검증은 다음 명령을 사용한다.

```bash
npm run verify
```

브라우저 상호작용 변경 또는 전체 검증이 필요한 경우 다음 명령을 추가로 실행한다.

```bash
npm run verify:full
```

검증 결과와 `git diff --check`를 확인한 뒤, 의도한 파일만 커밋하여 `origin/main`에 반영한다. 검증을 실행하지 못했거나 실패한 항목은 완료 보고의 잔여 리스크로 명시한다.

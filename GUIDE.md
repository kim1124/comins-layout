# comins-grid-layout Development Guide

## Project Ownership

`comins-grid-layout`는 독립 React package다.

- Local root: `<repo-root>`
- GitHub repository: [`kim1124/comins-layout`](https://github.com/kim1124/comins-layout)
- Integration branch: `main`
- npm package name: `comins-grid-layout`

## Working Agreement

1. 작업 전 루트 `AGENTS.md`와 대상 디렉터리의 `AGENTS.md`를 확인한다.
2. 변경 범위와 직접 관련된 public contract 또는 기능 문서만 확인한다.
3. GridStack 의존 코드는 `src/gridstack` adapter boundary 내부에 유지하고, layout state는 serializable object로 유지한다.

## Verification and Integration

변경 유형별 명령과 브라우저·resource gate 기준은 루트 `AGENTS.md`와 [Verification Strategy](docs/04-verification-strategy.md)를 따른다.

커밋은 요청받은 경우에만 수행하며, push와 publish에는 명시 요청이 필요하다.

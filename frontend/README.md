# Next.js template

`https://ui.shadcn.com/create`로 초기화한 템플릿

`npx shadcn@latest init --preset b1D0dv72 --template next`

기본 설정 + style mira

`npx shadcn@latest add --all` <= 모든 컴포넌트 추가해뒀음. 나중에 prune 해서 지워야됨

폴더구조는 [bullet proof react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) 를 참고하되 features 간 상호참조 가능, 순환 참조만 지양

## Code Quality (ESLint & Prettier)

`frontend/.prettierrc`
`frontend/eslint.config.mjs`

- **ESLint**: 비동기 `floating-promises` 경고, 인라인 `type-imports` 권장
- **Prettier**: Tailwind CSS 클래스 자동 정렬 및 상단 `import` 구문 순서 자동 정렬 적용
- **공통**: `src/shared/components/ui` 폴더 내 shadcn 컴포넌트들은 린트/포맷팅 대상에서 제외

## better auth

https://console.cloud.google.com/auth/clients 에서 해당되는 곳에

http://localhost:3000 를 승인된 원본
http://localhost:3000/api/auth/callback/google 를 승인된 리다이렉트 uri

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 현재 상태

PromptQuest는 개발자의 AI 활용 능력을 점수화하는 플랫폼의 인터랙티브 프로토타입입니다. 현재 `src/`는 **정적 목업/데모**입니다. 모든 페이지는 `src/lib/data.ts`의 하드코딩된 데이터를 렌더링하고, 평가 흐름은 실제 파이프라인이 아닌 타이머 기반 애니메이션입니다. `src/lib/supabase.ts`는 클라이언트 stub일 뿐, 어떤 페이지도 백엔드를 읽지 않습니다. 자세한 평가는 `docs/review-feedback.md` 참고.

`docs/` 디렉토리가 **앞으로 구현할 MVP 아키텍처의 단일 진실 소스**(v5 스펙, 2인 12 영업일 빌드)입니다. 비자명한 기능을 추가하기 전에 반드시 읽어야 합니다. 핵심 진입점:

- `docs/02-evaluation-logic.md` — 4단계 채점 파이프라인 (Validator → Quantitative → Judge → Aggregator), cross-family LLM 설계 (사용자 대화는 Claude, 채점은 GPT-4o-mini), 그리고 Supabase Edge Function에 들어갈 TypeScript 레퍼런스 구현 전체.
- `docs/03-team-split.md` — 파일 소유권 분담 (`app/(main)/*`, `lib/anthropic/` → A; `supabase/*`, `lib/openai/`, `lib/evaluation/` → B) 과 병렬 작업 전 합의해야 할 공유 인터페이스 계약 (`lib/types/*`, `lib/api/contracts.ts`).
- `docs/05-database-schema.md` 와 `docs/06-api-endpoints.md` — RLS 적용된 Supabase 스키마와 Route Handler 계약.

계획된 아키텍처를 구현할 때, Route Handler는 동기적인 사용자 대면 작업(`/api/sessions/[id]/messages`의 Claude 호출 등)을 처리하고, 긴 평가 파이프라인은 Supabase Edge Function (Deno)에서 비동기로 실행되며 `/api/sessions/[id]/submit`에서 트리거됩니다. 이렇게 분리한 이유 — Vercel Route Handler는 30초 타임아웃이 있고, Judge 앙상블 (3× GPT-4o-mini)은 재시도 포함 약 22초가 걸리기 때문입니다.

## 명령어

```bash
npm run dev           # next dev (Turbopack)
npm run build         # 프로덕션 빌드 — 스모크 테스트로 사용
npm run start         # 프로덕션 빌드 실행
npm run lint          # eslint .
npm run lint:fix      # eslint . --fix
npm run format        # prettier --write src/**
npm run format:check  # CI 스타일 prettier 체크
```

테스트 러너는 설정되어 있지 않습니다. 환경 변수 파일은 커밋되어 있지 않습니다. `src/lib/supabase.ts`는 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 읽지만, 계획된 전체 환경 변수 목록은 `docs/appendix.md`에 있습니다 (Anthropic, OpenAI, Upstash, Supabase service role).

## 코드베이스 컨벤션

- **Next.js 16 App Router + React 19.** 페이지 params 타입은 `Promise<{ slug: string }>` 이며 `use(params)`로 unwrap합니다. 라우트 추가 시 이 패턴을 유지하세요.
- **경로 alias `@/*` → `./src/*`** (`tsconfig.json` 참고).
- **Tailwind v4 `@theme inline` 디자인 토큰**이 `src/app/globals.css`에 정의되어 있습니다 (oklch 팔레트, 커스텀 `bg-*`, `text-*`, `acc`, `line`, `diff-*` 색상명). 컴포넌트는 토큰을 직접 사용합니다 (예: `bg-bg-1`, `text-text-3`, `border-line`). 임의의 hex 색상을 도입하지 말고 `@theme` 블록을 확장하세요.
- **한국어 우선 UI** (`<html lang="ko">`, 모든 카피 한국어). 목업 데이터와 카피는 `src/lib/data.ts`에 있습니다.
- **Prettier:** single quote, 세미콜론, trailing-comma all, width 100, `arrowParens: always`. ESLint는 prettier를 warning 룰로 실행하며 `_` 접두 미사용 변수는 무시합니다.
- **현재는 모두 클라이언트 컴포넌트.** `src/app/`의 모든 페이지가 `'use client'`로 시작하며 데모 애니메이션을 위해 `useState`/`useEffect`를 씁니다. 서버 컴포넌트 도입은 OK이나, 도입 이유를 명확히 하세요.

## 기획 문서 작업 시

`docs/` 파일들은 상대 anchor 링크로 상호 연결되어 있습니다 (예: `[2.5](./02-evaluation-logic.md#25-...)`). 구조 변경 시 링크를 유지하고, 분리된 섹션을 다시 한 파일로 합치지 마세요 — 14개의 작은 문서로 분리한 것은 의도적이며 diff-friendly를 위한 선택입니다. `docs/` 안의 MD 파일들은 Prettier로 포맷되어 있습니다 (테이블 정렬 주의). 편집 후엔 `npm run format`을 실행하세요.

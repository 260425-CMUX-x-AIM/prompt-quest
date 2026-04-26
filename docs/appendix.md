# 부록

## 부록 A: 환경 변수 명세

`.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co

# Anthropic (사용자 대화)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (평가 — cross-family)
OPENAI_API_KEY=sk-...
VALIDATOR_MODEL=gpt-4o-mini
JUDGE_MODEL=gpt-4o-mini

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# 사이트
NEXT_PUBLIC_SITE_URL=https://promptquest.app
NEXT_PUBLIC_PRIVACY_CONTACT=privacy@promptquest.app
```

Supabase Edge Function Secrets (Project Settings > Functions):

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
VALIDATOR_MODEL=gpt-4o-mini
JUDGE_MODEL=gpt-4o-mini
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 부록 B: 기술 스택 결정 사유

| 영역                        | 선택                          | 이유                                        |
| --------------------------- | ----------------------------- | ------------------------------------------- |
| 프론트                      | Next.js 14 App Router         | RSC + Streaming + 1인이 풀스택 가능         |
| 백엔드                      | Next.js Route Handlers        | 별도 서버 불필요                            |
| 백그라운드 채점             | Supabase Edge Function (Deno) | Vercel 30초 타임아웃 회피                   |
| DB/Auth                     | Supabase                      | RLS + Realtime + Auth 통합                  |
| 사용자 대화 모델            | Claude Sonnet 4.6             | 한국어 + 코딩 품질                          |
| 평가 모델 (Validator/Judge) | OpenAI GPT-4o-mini            | Cross-family로 자기 채점 편향 회피 + 저비용 |
| 디자인 시스템               | (외부 데모 프로젝트)          | 별도 자산, 본 문서에선 사용만               |
| Rate Limiting               | Upstash Redis                 | 서버리스 친화 + Free tier                   |
| 배포                        | Vercel                        | Next.js 최적                                |

---

## 부록 C: 골든 셋 구축 가이드

운영자가 직접 채점한 50~100개 세션. Judge/Validator 시스템 회귀 테스트의 핵심.

**구축 방법:**

1. 베타 테스트 기간 동안 다양한 점수대의 세션 수집 (낮음/중간/높음 골고루)
2. 운영자 2~3명이 독립적으로 동일 세션 채점
3. 채점자 간 차이가 5점 이상인 세션은 토론 후 합의
4. 합의된 점수를 "정답"으로 저장
5. Judge 프롬프트 변경 시마다 골든 셋 전체 재채점하여 MAE 확인

**저장 스키마 (v2 추가):**

```sql
create table golden_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  expected_score int not null,
  expected_breakdown jsonb,
  rater_notes text,
  created_at timestamptz default now()
);
```

**4가지 품질 메트릭 ([2.11](./02-evaluation-logic.md#211-평가-신뢰도-검증--골든-셋) 참고):**

| 메트릭                       | 정의                             | 목표값 |
| ---------------------------- | -------------------------------- | ------ |
| `inter_run_stddev`           | 같은 세션 5회 채점 표준편차 평균 | < 5    |
| `golden_set_mae`             | 골든 셋 평균 절대 오차           | < 8    |
| `score_distribution_entropy` | 점수 분포 다양성 (Shannon)       | > 2.5  |
| `judge_self_consistency`     | Judge 단독 self-consistency      | > 0.7  |

---

## 부록 D: 외부 자산 (디자인 데모)

본 문서는 디자인 명세를 포함하지 않음. 디자인은 별도 데모 프로젝트에 정의되어 있으며, 개발 시 다음 자산을 가져와서 사용.

**데모 프로젝트에서 가져올 것:**

1. **`styles/tokens.css`** — 모든 디자인 토큰 (색상, 타이포, 간격, 라운드)
2. **공통 컴포넌트** — `Logo`, `NavBar`, `DiffTag`, `CategoryTag`, `ProgressBar`, `StatChip`
3. **화면 시안 (jsx)** — 랜딩, 태스크 목록/상세, 챌린지 3분할, 결과 화면, 마이 페이지 등
4. **컴포넌트 인터랙션** — 메시지 버블, 인라인 코드 블록, 프롬프트 입력창, 결과물 작업공간

**활용 방법:**

- `tokens.css`를 그대로 프로젝트에 복사 → 모든 컴포넌트가 토큰만 참조
- shadcn/ui 변수 오버라이드 (디자인 데모에 안내됨)
- 시안 jsx를 Next.js 페이지로 옮길 때 인라인 스타일 / 컴포넌트 구조 그대로

---

## 부록 E: 참고 자료

- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions 가이드](https://supabase.com/docs/guides/functions)
- [Anthropic API 문서](https://docs.claude.com/en/api/getting-started)
- [OpenAI API 문서 — JSON mode](https://platform.openai.com/docs/guides/json-mode)
- [LLM-as-Judge 편향 연구 (Zheng et al., 2023)](https://arxiv.org/abs/2306.05685)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Prompt Injection 방어 가이드](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/system-prompts)
- [shadcn/ui 테마 커스터마이징](https://ui.shadcn.com/docs/theming)

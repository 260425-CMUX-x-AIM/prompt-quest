# PromptQuest 흥미 요소 설계

문제 수만 많아지면 금방 문제집처럼 보입니다. 이 문서는 사용자가 계속 돌아오게 만드는 장치와, 기존 Quest를 더 재미있게 소비하게 만드는 운영 아이디어를 정리합니다.

## 1. 퀘스트 라인

같은 문제도 묶는 방식에 따라 체감이 달라집니다.

| 퀘스트 라인 | 구성 | 감정 포인트 |
| --- | --- | --- |
| `First Blood` | `regex-email-001` → `debug-async-001` | "첫 클리어" 경험을 빠르게 줌 |
| `Bug Hunter` | `debug-date-001` → `debug-null-state-001` → `perf-react-001` | 점점 큰 장애를 잡는 느낌 |
| `Red Team Sight` | `review-pr-001` → `review-rate-limit-001` → `security-xss-001` | 코드 리뷰에서 보안 감각으로 확장 |
| `Backend Gauntlet` | `api-design-001` → `algo-rate-limit-001` → `security-ssrf-001` | 설계, 구현, 방어까지 한 줄로 연결 |
| `Ship It Week` | `component-pagination-001` → `component-command-palette-001` → `test-contract-001` | 실제 제품 개발 흐름처럼 전개 |

## 2. 보스 퀘스트

보스 퀘스트는 2~3개 카테고리를 섞은 특별 문제입니다. 일반 문제를 몇 개 이상 클리어해야 해금되도록 설계하면 동기부여가 생깁니다.

### `boss-launch-night-001` 배포 전야 종합 점검

- 권장 해금 조건: easy 3개 + medium 2개 클리어
- 구성:
  - API 설계 초안 검토
  - rate limit / auth 리뷰
  - 마지막에 체크리스트 제출
- 제출물 형식:

```md
## Risks
## Fix Order
## Release Decision
```

- 평가 포인트:
  - 위험 우선순위 정렬
  - "지금 막아야 할 것"과 "출시 후 보완할 것" 구분
  - AI에게 범위를 좁혀가며 의사결정하는 과정

### `boss-incident-warroom-001` 새벽 장애 대응

- 권장 해금 조건: debug 2개 + perf 1개 클리어
- 시나리오:
  - API p95 급증
  - DB lock 증가
  - 프론트 검색창 입력 지연
- 제출물 형식:

```md
## Triage
## Suspected Causes
## Immediate Mitigation
## Follow-up
```

- 평가 포인트:
  - 원인 가설을 난사하지 않고 우선순위화하는지
  - 측정과 추측을 분리하는지
  - AI에게 로그, 메트릭, 재현 순서를 잘 요청하는지

### `boss-legacy-rescue-001` 레거시 구출 작전

- 권장 해금 조건: refactor 1개 + test 2개 클리어
- 시나리오:
  - 콜백 헬
  - flaky 테스트
  - 과도한 전역 상태
- 제출물 형식:

```md
## Stabilization Plan
## Refactor Slices
## Safety Nets
```

- 평가 포인트:
  - 큰 리팩토링을 안전한 조각으로 나누는지
  - 테스트를 먼저 고정하는 전략이 있는지
  - AI에게 전체 재작성보다 단계적 전환을 시키는지

## 3. 이벤트 모드

같은 문제를 다른 룰로 다시 플레이하게 만드는 장치입니다.

| 모드 | 룰 | 기대 효과 |
| --- | --- | --- |
| `Speedrun` | 시간 가중치 +20%, 토큰 초과 페널티 강화 | 빠른 판단형 플레이 |
| `One Shot` | 시도 횟수 1회, 수정 없이 제출 | 첫 프롬프트 설계력 강조 |
| `Blind Review` | 결과물은 숨기고 대화 로그만으로 일부 평가 | 맥락 활용 능력 부각 |
| `Patch Only` | 전체 재작성 금지, diff 형식만 제출 | 정밀 수정 능력 측정 |
| `Hotfix Friday` | 제한 시간 짧고 버그/보안 문제만 출제 | 몰입감 있는 주간 이벤트 |

## 4. 업적 설계

업적은 점수보다 행동을 보상할 때 효과가 큽니다.

| 업적명 | 조건 |
| --- | --- |
| `First Clear` | 첫 Quest 통과 |
| `Minimalist` | 700 tokens 이하로 easy 1개 통과 |
| `Debugger` | debug 카테고리 3개 연속 통과 |
| `Architect` | hard 난이도 2개 이상 80점 이상 |
| `No Panic` | error recovery 점수 9.0 이상 달성 |
| `Patch Surgeon` | Patch Only 모드에서 medium 이상 통과 |
| `Judge Whisperer` | clarity 9.5 이상 3회 달성 |

## 5. 결과 화면을 더 재미있게 만드는 요소

### 추천 요소

- `이번 플레이 스타일` 배지
  - 예: `Fast Fixer`, `Careful Reviewer`, `Over-Explainer`, `Sharp Recoverer`
- `다음 추천 퀘스트`
  - 현재 점수 약점을 기준으로 2개 추천
- `한 줄 리플레이`
  - "첫 프롬프트는 좋았지만, 2턴째에서 요구사항을 다시 풀어 써 토큰 효율이 떨어졌습니다."
- `실수 컬렉션`
  - 반복되는 패턴을 축적
  - 예: `반례를 늦게 제시함`, `출력 형식 고정을 자주 놓침`

## 6. 시즌 운영 아이디어

| 시즌명 | 콘셉트 | 예시 |
| --- | --- | --- |
| `Bug Bash Week` | 버그/리뷰 중심 | debug, review 문제 가중 노출 |
| `Security Month` | 보안 집중 | XSS, SSRF, 권한 문제 묶음 |
| `Frontend Forge` | UI/성능 집중 | component + perf 라인 강화 |
| `Interview Pack` | 채용형 모드 | 시간 제한 + One Shot 조합 |

## 7. 운영자가 바로 쓸 수 있는 장치

- 매주 `이번 주 보스 퀘스트` 1개만 전면 배치
- easy 1개는 항상 무료 공개, 나머지는 점진 해금
- hard 문제는 해설보다 `잘한 프롬프트 예시`를 보상으로 제공
- 3일 연속 플레이 시 새로운 이벤트 모드 1개 해금
- 결과 페이지에서 "이번엔 몇 퍼센트가 여기서 막혔는지" 같은 비교 문구 노출

## 8. 추천 구현 우선순위

1. 퀘스트 라인 묶음과 다음 추천 퀘스트
2. 업적 5~7개
3. 보스 퀘스트 1개
4. Speedrun / Patch Only 이벤트 모드
5. 시즌 운영 배너와 랭킹

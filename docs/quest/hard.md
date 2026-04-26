# 고급 Quest 7종

고급 문제는 10턴 이상 상호작용할 가능성이 높고, 단순 정답보다 문제 구조화와 리스크 통제가 중요합니다. 사용자가 AI를 어떻게 통제했는지가 점수 차이를 크게 만듭니다.

## 1. `arch-event-001` 주문/결제/재고 이벤트 기반 아키텍처 설계

- 카테고리: `arch`
- 예상 시간: 35분
- 제출물 형식:

```md
## Context
## Components
## Event Flow
## Failure Handling
## Idempotency / Ordering
## Trade-offs
```

### 시나리오

이커머스 시스템을 주문, 결제, 재고 마이크로서비스로 분리하려고 합니다. 주문 생성부터 결제 승인, 재고 차감, 보상 처리까지 이벤트 기반으로 설계해야 합니다.

### 필수 요구사항

| ID | 설명 | 가중치 |
| --- | --- | --- |
| `req-1` | 핵심 서비스와 책임 분리 | 0.2 |
| `req-2` | 정상 플로우 이벤트 순서 정의 | 0.2 |
| `req-3` | 중복 이벤트와 out-of-order 처리 | 0.2 |
| `req-4` | 실패 시 보상 또는 재처리 전략 | 0.25 |
| `req-5` | 운영 관점 모니터링/재플레이 전략 | 0.15 |

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 결제 성공 후 재고 차감 성공 | 주문 `confirmed` |
| `tc-2` | edge_case | 재고 차감 실패 | 결제 취소 또는 보상 흐름 정의 |
| `tc-3` | edge_case | `payment_succeeded` 이벤트 중복 수신 | 부작용 없이 한 번만 반영 |
| `tc-4` | error_handling | 재고 이벤트가 결제 이벤트보다 먼저 도착 | 순서 역전 처리 전략 명시 |

### 숨김 체크

- 메시지 브로커만 언급하고 idempotency key, inbox/outbox, DLQ 같은 운영 장치가 없는지 확인
- 정확히 한 번 처리 환상에 기대지 않는지 확인
- 이벤트 스키마 버전 관리가 완전히 빠지지 않는지 확인

### PASS 조건

- 정상 흐름, 실패 흐름, 중복/순서 문제를 모두 다뤄야 함
- "이벤트로 연결한다" 수준의 추상 답변이면 FAIL
- 최소 1개 이상의 보상 전략 또는 재처리 전략이 있어야 함

### 고득점 포인트

- AI에게 먼저 bounded context와 상태 전이를 분리해서 설명하게 함
- 모호한 부분은 "at-least-once delivery 전제" 같은 가정을 명시
- 트레이드오프를 숨기지 않고 일관성 지연, 복잡도 증가를 함께 정리

### 권장 베이스라인

- median tokens: `~3200`
- median attempts: `5`
- median time: `30분`
- pattern bonus:
  - `+3`: 장애/재처리/관측성까지 포함
  - `-3`: 정상 시나리오만 예쁘게 정리하고 실패 경로 누락

## 2. `refactor-legacy-001` 콜백 헬 주문 처리 모듈 리팩토링

- 카테고리: `refactor`
- 예상 시간: 28분
- 제출물 형식:

```ts
export async function processOrder(orderId: string): Promise<ProcessOrderResult>;
```

### 시나리오

주문 검증, 재고 확인, 결제, 이메일 발송이 중첩 콜백으로 얽혀 있습니다. 사용자는 AI에게 단순 문법 변환이 아니라 에러 흐름, 롤백, 가독성 개선까지 반영한 리팩토링을 시켜야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 모든 단계 성공 | 상태 `completed` |
| `tc-2` | edge_case | 결제 실패 | 재고 예약 해제, 상태 `payment_failed` |
| `tc-3` | edge_case | 이메일 발송 실패 | 주문은 완료, 경고 로깅 또는 후속 재시도 큐 |
| `tc-4` | error_handling | 존재하지 않는 주문 | `ORDER_NOT_FOUND` 에러 |

### 숨김 체크

- `async/await`로만 바꾸고 여전히 하나의 거대 함수인 상태인지 확인
- 단계별 책임 분리 없이 부수효과가 뒤섞여 있는지 확인
- 실패 시 누락된 cleanup 또는 rollback이 없는지 확인

### PASS 조건

- 콜백 헬 제거
- 최소한 검증/재고/결제/후처리 단계가 읽히도록 구조화
- 부분 실패 처리 기준이 명확해야 함

### 고득점 포인트

- AI에게 "문법 치환"이 아니라 "도메인 흐름 재구성"을 요구
- 어디까지가 트랜잭션성 보장 범위인지 먼저 확정
- 치명적 실패와 비치명적 실패를 분리

### 권장 베이스라인

- median tokens: `~2600`
- median attempts: `4`
- median time: `24분`
- pattern bonus:
  - `+3`: helper 분리와 rollback 기준 명확화
  - `-2`: 전역 try/catch 하나로 모든 오류를 뭉개기

## 3. `security-xss-001` 댓글 렌더링 XSS 취약점 진단 및 수정

- 카테고리: `security`
- 예상 시간: 30분
- 제출물 형식:

```md
## Vulnerability Summary
## Attack Path
## Patch
## Residual Risks
```

또는

```tsx
// sanitize + render patch
```

### 시나리오

사용자 댓글을 Markdown으로 렌더링하는 기능에서 stored XSS가 발생합니다. 사용자는 AI와 협업해 취약점 원인, 재현 경로, 수정 패치, 잔여 리스크까지 정리해야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | ``Hello **world**`` | 정상 렌더링 |
| `tc-2` | negative | ``<script>alert(1)</script>`` | 실행되지 않고 제거 또는 escape |
| `tc-3` | negative | ``[click](javascript:alert(1))`` | 위험 링크 차단 |
| `tc-4` | edge_case | 코드 블록 안의 `<script>` 문자열 | 문자열로만 보존 |

### 숨김 체크

- 클라이언트 렌더링 단에서만 막고 서버 저장/미리보기 경로는 비워두지 않았는지 확인
- sanitizer allowlist가 과도하게 넓지 않은지 확인
- Markdown parser 옵션 조합으로 HTML 허용이 다시 열리지 않는지 확인

### PASS 조건

- 스크립트 실행과 `javascript:` 링크를 모두 차단
- 정상 Markdown 표현은 최대한 유지
- 취약점 설명 없이 라이브러리 이름만 바꾸는 제출물은 FAIL

### 고득점 포인트

- AI에게 "재현 payload, 원인, 패치, 잔여 리스크" 순으로 답변하게 함
- encode와 sanitize 차이를 분리해서 검증
- 이벤트 핸들러 속성, data URI 등 우회 벡터를 추가로 점검

### 권장 베이스라인

- median tokens: `~2400`
- median attempts: `4`
- median time: `26분`
- pattern bonus:
  - `+3`: 공격 경로와 잔여 리스크까지 정리
  - `-3`: `<script>`만 막고 URL scheme 우회 누락

## 4. `perf-react-001` React 대시보드 렌더링 병목 분석

- 카테고리: `perf`
- 예상 시간: 32분
- 제출물 형식:

```md
## Bottlenecks
## Measurement
## Patch Strategy
## Verification
```

또는

```tsx
// dashboard patch
```

### 시나리오

검색창에 한 글자 입력할 때마다 200개 행이 모두 다시 렌더링되고, 차트까지 재계산되어 입력 지연이 심합니다. 사용자는 AI에게 병목 원인 분석과 수정 우선순위를 끌어내야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 검색어 입력 | 입력 지연 체감이 줄고 필터 결과 유지 |
| `tc-2` | positive | 행 선택 후 검색 | 선택 상태 유지 |
| `tc-3` | edge_case | 데이터 1,000건 | 전체 재렌더 횟수 유의미하게 감소 |
| `tc-4` | error_handling | 검색어 초기화 | 빈 상태에서 정상 복구 |

### 숨김 체크

- 무조건 `useMemo/useCallback` 남발로 끝내지 않는지 확인
- 느린 계산, 큰 리스트, 상태 위치, transition 적용 가능성을 분리해서 보는지 확인
- 측정 없이 감으로 최적화한 답변이 아닌지 확인

### PASS 조건

- 최소 2개 이상의 병목 원인을 식별
- 수정안과 검증 방식이 함께 제시돼야 함
- 기능 회귀 없이 입력/선택/필터 동작 유지

### 고득점 포인트

- AI에게 React Profiler, render count, expensive derive를 기준으로 분석하게 함
- `useDeferredValue`, `startTransition`, 리스트 분리, 가상화 등 후보를 비교
- 패치 후 무엇을 다시 측정할지까지 제시

### 권장 베이스라인

- median tokens: `~2800`
- median attempts: `4`
- median time: `28분`
- pattern bonus:
  - `+3`: 측정 기반 분석과 회귀 검증 포함
  - `-2`: 추측성 최적화만 나열

## 5. `security-ssrf-001` 이미지 가져오기 기능 SSRF 차단

- 카테고리: `security`
- 예상 시간: 34분
- 제출물 형식:

```md
## Threat Model
## Exploit Paths
## Patch Strategy
## Validation Plan
```

또는

```ts
export async function fetchRemoteImage(url: string): Promise<Buffer>;
```

### 시나리오

사용자가 URL을 넣으면 서버가 이미지를 다운로드해 썸네일을 만드는 기능이 있습니다. 내부 메타데이터 엔드포인트와 사설망을 찌를 수 있는 SSRF 위험이 있습니다.

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `https://cdn.example.com/a.png` | 허용 |
| `tc-2` | negative | `http://169.254.169.254/latest/meta-data/` | 차단 |
| `tc-3` | negative | `http://localhost:3000/admin` | 차단 |
| `tc-4` | edge_case | redirect를 거쳐 내부 IP로 이동 | 차단 |
| `tc-5` | edge_case | DNS rebinding 유사 케이스 | 방어 전략 명시 |

### 숨김 체크

- 문자열 blacklist만으로 끝내지 않는지 확인
- redirect follow 정책, DNS resolve, private CIDR 차단이 포함되는지 확인
- 이미지 content-type 검증과 다운로드 크기 제한도 최소 언급하는지 확인

### PASS 조건

- 메타데이터 IP, loopback, private network 접근 차단
- redirect 우회 대응 포함
- allowlist 또는 동등한 강한 제약이 있어야 함

### 고득점 포인트

- AI에게 공격면을 입력 검증, DNS, 네트워크, 응답 검증으로 분리하게 함
- "왜 blacklist만으로 부족한가"를 명확히 짚음
- 운영 환경의 egress 제어까지 포함

### 권장 베이스라인

- median tokens: `~2700`
- median attempts: `4`
- median time: `29분`
- pattern bonus:
  - `+3`: 네트워크 계층 방어까지 포함
  - `-3`: URL 문자열 치환 수준에 머묾

## 6. `perf-sql-001` 느린 리포트 SQL 병목 분석

- 카테고리: `perf`
- 예상 시간: 33분
- 제출물 형식:

```md
## Query Smells
## Index Strategy
## Rewrite Plan
## Validation
```

### 시나리오

주간 리포트 쿼리가 18초씩 걸려 대시보드가 멈춥니다. AI와 협업해 실행 계획 관점에서 병목을 찾고 쿼리/인덱스 개선안을 제안해야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 날짜 범위 + 상태 필터 | full scan 감소 전략 제시 |
| `tc-2` | edge_case | `LEFT JOIN` 다중 사용 | 불필요 join 제거 또는 pre-aggregation 제안 |
| `tc-3` | edge_case | `ORDER BY created_at DESC LIMIT 50` | 인덱스 활용 전략 제시 |
| `tc-4` | error_handling | 인덱스 추가만으로 해결 안 되는 케이스 | query rewrite 또는 materialization 고려 |

### 숨김 체크

- 무조건 인덱스만 늘리는 접근이 아닌지 확인
- 선택도, 정렬, 조인 순서를 분리해서 보는지 확인
- 검증 방법으로 `EXPLAIN ANALYZE`, p95 latency, rows examined 감소 등을 언급하는지 확인

### PASS 조건

- 병목 원인 최소 2개 이상 식별
- 인덱스 전략과 쿼리 rewrite 중 하나만이 아니라 둘의 관계를 설명
- 측정 계획이 있어야 함

### 고득점 포인트

- AI에게 실행 계획의 어떤 숫자를 봐야 하는지 먼저 물음
- 인덱스 추가 비용과 write penalty도 함께 고려
- 단기 핫픽스와 장기 구조 개선을 분리

### 권장 베이스라인

- median tokens: `~2850`
- median attempts: `4`
- median time: `29분`
- pattern bonus:
  - `+3`: 실행 계획 기반 분석
  - `-2`: "인덱스 추가"만 반복

## 7. `arch-multitenant-001` 멀티테넌트 권한/격리 아키텍처 설계

- 카테고리: `arch`
- 예상 시간: 36분
- 제출물 형식:

```md
## Tenant Model
## AuthZ Boundaries
## Data Isolation
## Failure / Migration Risks
## Auditability
```

### 시나리오

하나의 SaaS를 여러 기업이 함께 쓰는 구조로 확장해야 합니다. 조직 간 데이터 누출 없이 사용자, 역할, 리소스 접근을 설계해야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 같은 조직 관리자 조회 | 자기 조직 리소스만 접근 |
| `tc-2` | negative | 다른 조직 문서 id 직접 조회 | 접근 차단 |
| `tc-3` | edge_case | 한 사용자가 2개 조직에 속함 | 조직 컨텍스트에 따라 권한 계산 |
| `tc-4` | edge_case | 백그라운드 잡이 여러 조직 데이터 처리 | 테넌트 경계 보존 전략 필요 |
| `tc-5` | error_handling | 테넌트 분리 도입 마이그레이션 | 데이터 꼬임/누락 방지 계획 필요 |

### 숨김 체크

- 단순 `tenant_id` 컬럼 추가만으로 끝내지 않는지 확인
- 애플리케이션 레벨 권한과 DB 레벨 격리 모두 다루는지 확인
- 감사 로그, impersonation, 조직 전환 UX 같은 운영 요소를 최소 언급하는지 확인

### PASS 조건

- 인증과 권한, 데이터 격리, 운영 리스크를 모두 포함
- 크로스테넌트 누출 방지 전략이 핵심으로 드러나야 함
- 지나치게 추상적인 개념 설명만으로 끝나면 FAIL

### 고득점 포인트

- AI에게 "사용자-조직-역할-리소스" 관계 모델을 먼저 그리게 함
- 앱 레벨과 DB 레벨 책임을 구분
- 마이그레이션 중 위험 구간과 감사 가능성까지 포함

### 권장 베이스라인

- median tokens: `~3300`
- median attempts: `5`
- median time: `31분`
- pattern bonus:
  - `+3`: RLS/정책/운영 통제까지 함께 설계
  - `-3`: `tenant_id` 필터 한 줄로 해결했다고 가정

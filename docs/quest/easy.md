# 초급 Quest 7종

초급 문제는 1~3턴 안에서도 풀 수 있어야 하지만, 잘 만든 프롬프트와 잘못된 초안에 대한 수정 지시가 분명히 드러나도록 설계했습니다.

## 1. `regex-email-001` 이메일 추출 정규식 작성

- 카테고리: `regex`
- 예상 시간: 5분
- 제출물 형식:

```js
const EMAIL_REGEX = /YOUR_PATTERN/g;
```

### 시나리오

로그 텍스트에서 이메일 주소만 추출하는 JavaScript 정규식이 필요합니다. 로컬 파트, 서브도메인, `+tag`는 허용하되 잘못된 형식과 과도한 백트래킹은 피해야 합니다.

### 필수 요구사항

| ID | 설명 | 가중치 |
| --- | --- | --- |
| `req-1` | 유효한 이메일 형식만 매칭 | 0.5 |
| `req-2` | 도메인에는 `.` 이 최소 1개 포함 | 0.3 |
| `req-3` | ReDoS에 취약한 패턴 금지 | 0.2 |

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `Contact: alice@example.com or bob@sub.test.org` | `["alice@example.com", "bob@sub.test.org"]` |
| `tc-2` | negative | `Invalid: not-an-email, @missing.com, foo@bar` | `[]` |
| `tc-3` | edge_case | `Edge: a@b.c, very.long+tag@company.co.uk` | `["a@b.c", "very.long+tag@company.co.uk"]` |
| `tc-4` | edge_case | `Punctuation: user@example.com, next line` | `["user@example.com"]` |

### 숨김 체크

- `foo..bar@example.com` 같은 이상한 로컬 파트를 과하게 허용하지 않는지 확인
- `alice@example.` 처럼 끝이 `.` 로 끝나는 도메인을 잡지 않는지 확인
- `.*` 또는 중첩 반복자 기반 패턴으로 catastrophic backtracking 위험이 없는지 확인

### PASS 조건

- 공개 케이스 4개를 모두 통과
- 숨김 체크에서 명백한 과매칭 또는 ReDoS 위험이 없어야 함

### 고득점 포인트

- 첫 프롬프트에서 예시 입력, 금지 조건, 출력 형식을 함께 전달
- AI 초안이 `TLD >= 2` 같은 가정을 넣으면 `a@b.c` 반례를 즉시 제시
- 정규식 이유를 함께 물어보거나 word boundary, character class 설계를 확인

### 권장 베이스라인

- median tokens: `~800`
- median attempts: `2`
- median time: `4분`
- pattern bonus:
  - `+2`: ReDoS 안전성까지 명시적으로 확인
  - `-3`: `.*`, `.+` 같은 위험 패턴을 그대로 수용

## 2. `debug-async-001` Promise 체이닝 버그 수정

- 카테고리: `debug`
- 예상 시간: 6분
- 제출물 형식:

```ts
export async function buildCheckoutSummary(userId: string): Promise<{
  userId: string;
  email: string;
  orderCount: number;
  latestOrderTotal: number;
  couponCode: string | null;
}>;
```

### 시나리오

체크아웃 요약을 만드는 함수가 간헐적으로 `couponCode`를 비워서 반환하고, 주문이 없는 사용자는 런타임 에러를 냅니다. 사용자는 AI와 대화하며 비동기 흐름을 바로잡아야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `userId = "u-100"` | `couponCode: "SPRING10"`, `latestOrderTotal: 42000` |
| `tc-2` | edge_case | `userId = "u-empty"` | `orderCount: 0`, `latestOrderTotal: 0`, `couponCode: null` |
| `tc-3` | negative | `userId = "missing"` | `throw new Error("USER_NOT_FOUND")` |
| `tc-4` | error_handling | coupon 조회 실패 | 주문 정보는 유지, `couponCode`만 `null` 처리 |

### 숨김 체크

- `await` 누락으로 `Promise` 객체를 그대로 읽는 코드가 없는지 확인
- 주문 배열이 비었을 때 `orders[0]` 접근이 없는지 확인
- 필요 이상으로 직렬 실행해서 느려지지 않는지 확인

### PASS 조건

- 비동기 흐름이 안정적으로 종료되어야 함
- 사용자 없음, 주문 없음, 쿠폰 실패를 각각 구분 처리해야 함
- 제출물이 타입 시그니처를 지켜야 함

### 고득점 포인트

- AI에게 "정상/비정상/부분 실패" 케이스를 분리해서 생각하게 함
- 첫 응답의 흐름도가 틀렸을 때 원인과 기대 동작을 정확히 되짚음
- `Promise.all` 남용과 과도한 직렬 처리 중 어느 쪽이 문제인지 구분

### 권장 베이스라인

- median tokens: `~900`
- median attempts: `2`
- median time: `5분`
- pattern bonus:
  - `+2`: 예외 경로를 먼저 정리하고 수정 지시
  - `-2`: "다시 짜줘" 식으로 맥락 없이 전체 재생성만 반복

## 3. `review-pr-001` 신규 API PR 코드 리뷰

- 카테고리: `review`
- 예상 시간: 8분
- 제출물 형식:

```md
## Findings
1. [severity] 파일:라인 - 문제 요약
2. [severity] 파일:라인 - 문제 요약

## Optional Suggestions
- 개선 제안
```

### 시나리오

신규 관리자 API PR을 리뷰해야 합니다. 사용자는 AI에게 "이 PR에서 실제 배포를 막아야 할 문제"만 우선 찾게 하고, 최종 제출물은 리뷰 코멘트 목록으로 남깁니다.

### 리뷰 대상 요약

```ts
router.post('/admin/users', async (req, res) => {
  const { email, role } = req.body;
  const user = await prisma.user.create({ data: { email, role } });
  return res.status(200).json(user);
});

router.get('/admin/users', async (_req, res) => {
  const users = await prisma.user.findMany();
  return res.json(users);
});
```

### 공개 테스트 케이스

| ID | 유형 | 기대되는 핵심 지적 |
| --- | --- | --- |
| `tc-1` | positive | 관리자 권한 체크 부재 |
| `tc-2` | positive | 요청 본문 `role`을 그대로 신뢰 |
| `tc-3` | positive | 응답에 민감 정보가 포함될 가능성 |
| `tc-4` | edge_case | 생성 API가 `200 OK`를 반환하는 등 계약이 모호함 |

### 숨김 체크

- "문제 있어 보인다" 수준이 아니라 악용 시나리오 또는 영향이 적혀 있는지 확인
- 사소한 스타일 코멘트만 길게 쓰고 치명적 이슈를 놓치지 않는지 확인
- 파일/라인, 심각도, 수정 방향이 빠지지 않는지 확인

### PASS 조건

- 최소 3개 이상의 실질적인 배포 차단급 이슈를 적시
- 각 항목에 왜 위험한지 한 줄 이상 포함
- 스타일/가독성 위주 코멘트만으로 제출하지 않아야 함

### 고득점 포인트

- AI에게 "버그"보다 "권한, 데이터 노출, 계약 위반" 축으로 보게 함
- AI가 과한 추측을 하면 코드에 근거한 이슈만 남기도록 정제
- severity를 분리하고, 차단급 이슈와 권고사항을 분리

### 권장 베이스라인

- median tokens: `~1100`
- median attempts: `2`
- median time: `6분`
- pattern bonus:
  - `+3`: 영향도와 재현 경로까지 포함
  - `-2`: 근거 없는 추측성 이슈 다수 포함

## 4. `debug-date-001` 타임존 기준 청구일 계산 버그 수정

- 카테고리: `debug`
- 예상 시간: 7분
- 제출물 형식:

```ts
export function getBillingDate(iso: string, timeZone?: string): string;
```

### 시나리오

구독 청구 시스템이 UTC 기준으로 날짜를 잘라서 한국 사용자 청구일이 하루씩 밀립니다. 사용자는 AI와 함께 날짜 계산 방식을 고쳐야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `("2026-04-25T15:30:00Z", "Asia/Seoul")` | `"2026-04-26"` |
| `tc-2` | positive | `("2026-04-25T23:50:00Z", "UTC")` | `"2026-04-25"` |
| `tc-3` | negative | `("not-a-date", "Asia/Seoul")` | `throw new Error("INVALID_DATE")` |
| `tc-4` | edge_case | `("2024-02-29T12:00:00Z", "Asia/Seoul")` | `"2024-02-29"` |

### 숨김 체크

- `toISOString().slice(0, 10)` 같은 UTC 고정 로직이 남아 있지 않은지 확인
- `Intl.DateTimeFormat` 또는 동등한 시간대 처리 로직을 제대로 쓰는지 확인
- 반환 포맷이 항상 `YYYY-MM-DD`인지 확인

### PASS 조건

- 타임존별 날짜 계산이 맞아야 함
- 잘못된 입력은 조용히 깨지지 말고 명시적 에러 처리
- 하드코딩된 `Asia/Seoul` 전용 해법만 제출하면 안 됨

### 고득점 포인트

- 입력/출력 포맷과 타임존 가정을 첫 프롬프트에 고정
- AI가 locale 문자열 포맷에 의존하면 `YYYY-MM-DD` 보장을 추가로 요구
- 반례를 사용해 "날짜 경계" 문제를 정확히 짚음

### 권장 베이스라인

- median tokens: `~950`
- median attempts: `2`
- median time: `6분`
- pattern bonus:
  - `+2`: 날짜 경계 반례를 직접 제시
  - `-2`: 지역 포맷 문자열을 그대로 잘라 쓰는 불안정한 해법 수용

## 5. `regex-log-redact-001` 로그 속 개인정보 마스킹 정규식

- 카테고리: `regex`
- 예상 시간: 6분
- 제출물 형식:

```js
export function redactLogLine(input) {
  return input.replace(SENSITIVE_REGEX, '[REDACTED]');
}
```

### 시나리오

애플리케이션 로그에 이메일과 휴대폰 번호가 그대로 남고 있습니다. 사용자는 AI에게 마스킹용 정규식 또는 치환 로직을 만들게 해야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `email=alice@test.com` | `email=[REDACTED]` |
| `tc-2` | positive | `phone=010-1234-5678` | `phone=[REDACTED]` |
| `tc-3` | edge_case | `mixed alice@test.com / 01012345678` | 둘 다 마스킹 |
| `tc-4` | negative | `status=200 request=ok` | 원문 유지 |

### 숨김 체크

- 너무 넓은 패턴으로 일반 숫자열까지 마스킹하지 않는지 확인
- 이메일과 전화번호를 한 패턴 또는 안전한 복수 패턴으로 처리하는지 확인
- 치환 후 로그 구조가 완전히 깨지지 않는지 확인

### PASS 조건

- 이메일과 전화번호 모두 마스킹
- 비민감 일반 텍스트는 유지
- 과매칭이 심하면 FAIL

### 고득점 포인트

- AI에게 "무엇을 지우고 무엇을 남길지"를 먼저 명확히 규정
- 샘플 로그 3~4개를 같이 주고 반례를 포함
- 정규식 하나로 억지로 우겨 넣기보다 안전한 치환 전략도 허용

### 권장 베이스라인

- median tokens: `~850`
- median attempts: `2`
- median time: `5분`
- pattern bonus:
  - `+2`: 허용 범위와 비허용 범위를 명시
  - `-2`: 모든 숫자열을 통으로 지워 로그 가독성 상실

## 6. `debug-null-state-001` null 상태 전이 버그 수정

- 카테고리: `debug`
- 예상 시간: 7분
- 제출물 형식:

```ts
type ProfileState = 'idle' | 'loading' | 'ready' | 'error';
export function selectProfileName(model: ProfileModel): string;
```

### 시나리오

프로필 화면이 로딩 직후 `Cannot read properties of null`로 죽습니다. `loading`, `error`, `ready` 상태에서 데이터 shape가 달라지는 케이스를 안전하게 처리해야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `ready + profile.name="Yeeun"` | `"Yeeun"` |
| `tc-2` | edge_case | `loading + profile=null` | `"Loading..."` |
| `tc-3` | edge_case | `error + lastKnownProfile.name="Guest"` | `"Guest"` |
| `tc-4` | negative | `ready + malformed profile` | `throw new Error("INVALID_PROFILE")` |

### 숨김 체크

- optional chaining만 잔뜩 붙이고 상태 모델 자체는 방치하지 않는지 확인
- `loading`과 `error`에서 UX fallback이 분리되는지 확인
- 런타임 오류를 숨긴 채 빈 문자열만 반환하지 않는지 확인

### PASS 조건

- null 접근으로 죽지 않아야 함
- 상태별 반환 정책이 일관적이어야 함
- 잘못된 `ready` 데이터는 감지해야 함

### 고득점 포인트

- AI에게 데이터 shape 표를 먼저 만들어 달라고 요청
- 상태별 기대 출력값을 명시
- "죽지 않게"보다 "상태 의미를 보존"하게 수정하도록 유도

### 권장 베이스라인

- median tokens: `~980`
- median attempts: `2`
- median time: `6분`
- pattern bonus:
  - `+2`: 상태 모델을 먼저 정리
  - `-2`: null check만 추가하고 의미 없는 fallback 남발

## 7. `review-rate-limit-001` Rate limit 미들웨어 PR 리뷰

- 카테고리: `review`
- 예상 시간: 9분
- 제출물 형식:

```md
## Findings
1. [high] middleware.ts:12 - 문제 설명
```

### 시나리오

로그인 API 앞에 rate limiting 미들웨어를 붙인 PR입니다. 얼핏 맞아 보이지만 우회와 오탐 가능성이 섞여 있습니다.

### 리뷰 대상 요약

```ts
export async function limit(req, res, next) {
  const key = req.ip;
  const current = (await redis.get(key)) || 0;
  if (current > 5) return res.status(429).json({ error: 'Too many requests' });
  await redis.set(key, current + 1);
  next();
}
```

### 공개 테스트 케이스

| ID | 유형 | 기대되는 핵심 지적 |
| --- | --- | --- |
| `tc-1` | positive | TTL 부재로 영구 차단 가능 |
| `tc-2` | positive | 경쟁 상태로 동시 요청 우회 가능 |
| `tc-3` | positive | `req.ip` 신뢰 문제 또는 프록시 환경 이슈 |
| `tc-4` | edge_case | 기준이 `> 5`라 6번째가 아닌 7번째에 차단될 가능성 |

### 숨김 체크

- 운영 환경의 proxy/header 맥락을 언급하는지 확인
- atomic increment 또는 Lua/script 같은 대안을 최소 언급하는지 확인
- 사소한 코드 스타일보다 로직 리스크를 우선하는지 확인

### PASS 조건

- 최소 3개의 실질 이슈를 찾아야 함
- 각 이슈에 영향 또는 재현 방향 포함
- 해결 방향이 한 줄 이상 있어야 함

### 고득점 포인트

- AI에게 "오탐", "우회", "운영 리스크" 축으로 나눠 리뷰하게 함
- Redis 원자성, TTL, key 설계라는 세 개의 축을 분리
- 코멘트를 severity 순으로 정렬

### 권장 베이스라인

- median tokens: `~1200`
- median attempts: `2`
- median time: `7분`
- pattern bonus:
  - `+3`: 재현성과 운영 영향까지 적시
  - `-2`: "성능 안 좋을 수 있음" 같은 모호한 코멘트만 제출

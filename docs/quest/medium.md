# 중급 Quest 7종

중급 문제는 5~10턴 정도의 상호작용을 전제로 합니다. 첫 답변만으로 끝나는 문제보다, 요구사항 명세와 반례 보강을 통해 점진적으로 결과물을 다듬는 과정이 중요합니다.

## 1. `component-pagination-001` React 페이지네이션 컴포넌트 구현

- 카테고리: `component`
- 예상 시간: 15분
- 제출물 형식:

```tsx
export function Pagination(props: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}): JSX.Element;
```

### 시나리오

테이블 하단에 들어갈 페이지네이션 UI를 구현해야 합니다. 사용자는 AI에게 컴포넌트 코드를 생성하게 하되, 접근성, 엣지 케이스, ellipsis 규칙까지 챙겨야 합니다.

### 필수 요구사항

| ID | 설명 | 가중치 |
| --- | --- | --- |
| `req-1` | 현재 페이지, 처음/마지막 페이지, 인접 페이지를 명확히 노출 | 0.35 |
| `req-2` | 페이지 수가 많을 때 ellipsis 표시 | 0.2 |
| `req-3` | 이전/다음 버튼 비활성화 처리 | 0.15 |
| `req-4` | 키보드 접근성과 `aria-current` 지원 | 0.2 |
| `req-5` | `onPageChange`는 유효한 페이지에만 호출 | 0.1 |

### 공개 테스트 케이스

| ID | 유형 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `page=1, totalPages=5` | `1 2 3 4 5`, 이전 버튼 비활성화 |
| `tc-2` | positive | `page=5, totalPages=10` | `1 ... 4 5 6 ... 10` |
| `tc-3` | edge_case | `page=10, totalPages=10` | 다음 버튼 비활성화, 마지막 페이지 활성 |
| `tc-4` | edge_case | `page=1, totalPages=1` | 숫자 버튼 1개만 표시 |

### 숨김 체크

- `page < 1`, `page > totalPages` 입력 시 안전한 처리
- ellipsis가 연속으로 두 번 이상 렌더링되지 않는지 확인
- 클릭 대상이 버튼인지, 스크린리더가 현재 페이지를 인식하는지 확인

### PASS 조건

- 공개 케이스 4개 모두 만족
- 접근성 속성이 빠지지 않아야 함
- 시각적 출력만 맞고 클릭 동작이 잘못되면 FAIL

### 고득점 포인트

- AI에게 원하는 pagination 규칙을 예시로 먼저 고정
- 초기 답변이 애매하면 page window 규칙을 표로 재정의
- 이벤트 동작과 접근성 속성을 함께 검증하게 함

### 권장 베이스라인

- median tokens: `~1700`
- median attempts: `3`
- median time: `12분`
- pattern bonus:
  - `+2`: 인터랙션과 접근성을 별도 체크
  - `-2`: 렌더링 예시만 보고 실제 클릭 동작을 검증하지 않음

## 2. `algo-sort-001` 객체 배열 다중 키 정렬

- 카테고리: `algo`
- 예상 시간: 12분
- 제출물 형식:

```ts
type Ticket = {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'blocked' | 'in_progress' | 'todo' | 'done';
  createdAt: string;
  assignee: string | null;
};

export function sortTickets(items: Ticket[]): Ticket[];
```

### 시나리오

운영 대시보드에 보여줄 이슈 목록을 정렬해야 합니다. 단순 문자열 비교가 아니라 우선순위, 상태 우선순위, 생성일, 담당자 유무를 조합해야 합니다.

### 정렬 규칙

1. `priority`: `P0 > P1 > P2`
2. `status`: `blocked > in_progress > todo > done`
3. `createdAt`: 최신순
4. `assignee`: 담당자 있는 항목 우선
5. 위 기준이 모두 같으면 원래 순서를 유지

### 공개 테스트 케이스

| ID | 유형 | 입력 요약 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `P0/todo`, `P1/blocked`, `P0/blocked` | `P0/blocked`가 최상단 |
| `tc-2` | positive | 같은 `priority/status`, 날짜만 다름 | 최신 `createdAt` 우선 |
| `tc-3` | edge_case | 같은 모든 조건, `assignee`만 다름 | 담당자 있는 항목 우선 |
| `tc-4` | edge_case | 완전히 동일한 두 항목 | 입력 순서 유지 |

### 숨김 체크

- 원본 배열을 mutate 하지 않는지 확인
- `createdAt` 파싱 실패 시 예측 가능한 처리
- comparator가 엔진별로 불안정하지 않도록 안정 정렬을 의식했는지 확인

### PASS 조건

- 정렬 규칙 5개를 모두 만족
- 입력 배열을 직접 변경하지 않아야 함
- 안정 정렬 요구를 깨면 FAIL

### 고득점 포인트

- AI에게 규칙 우선순위를 번호로 분리해서 전달
- 문자열 compare와 도메인 우선순위를 구분하도록 유도
- 원본 불변성과 안정 정렬 조건을 명시

### 권장 베이스라인

- median tokens: `~1500`
- median attempts: `3`
- median time: `10분`
- pattern bonus:
  - `+2`: tie-breaker와 stable sort까지 확인
  - `-2`: 우선순위 테이블 없이 if 문만 덮어쓰기

## 3. `api-design-001` 팀 초대 REST API 설계

- 카테고리: `api_design`
- 예상 시간: 18분
- 제출물 형식:

```md
## Resources
## Endpoints
## Request / Response Examples
## Error Cases
## Idempotency / Auth Notes
```

### 시나리오

팀 워크스페이스에 멤버를 초대하는 REST API를 설계해야 합니다. 초대 생성, 조회, 수락, 만료, 역할 제한까지 다뤄야 하며 프론트엔드와 백엔드가 바로 계약으로 사용할 수 있어야 합니다.

### 필수 요구사항

| ID | 설명 | 가중치 |
| --- | --- | --- |
| `req-1` | 리소스 중심 URI 설계 | 0.2 |
| `req-2` | 생성/조회/수락/취소 플로우 포함 | 0.3 |
| `req-3` | 권한 및 역할 제약 명시 | 0.2 |
| `req-4` | 중복 수락, 만료 토큰, 재초대 시나리오 처리 | 0.2 |
| `req-5` | 상태 코드와 에러 응답 계약 명확화 | 0.1 |

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 팀 관리자 초대 생성 | `201 Created`, 초대 리소스 반환 |
| `tc-2` | positive | 초대 수락 | 멤버십 생성, 초대 상태 `accepted` |
| `tc-3` | edge_case | 이미 수락된 토큰 재사용 | 중복 생성 없이 idempotent 응답 |
| `tc-4` | edge_case | 권한 없는 멤버가 초대 생성 시도 | `403 Forbidden` |
| `tc-5` | error_handling | 만료된 초대 토큰 사용 | `410 Gone` 또는 동등하게 명확한 에러 |

### 숨김 체크

- `POST /acceptInvite` 같은 액션 중심 URI만 나열하고 끝내지 않는지 확인
- invite token과 invite resource id를 혼동하지 않는지 확인
- 페이징, 필터링, 감사 로그 필요성을 최소한 언급하는지 확인

### PASS 조건

- 주요 플로우 5개가 빠짐없이 포함
- 상태 코드와 에러 케이스가 일관적이어야 함
- 권한 설계가 모호하면 FAIL

### 고득점 포인트

- AI에게 "프론트와 백엔드가 그대로 계약으로 쓸 수 있는 수준"을 요구
- 토큰 재사용, 재초대, 취소 후 재생성 같은 상태 전이를 질문으로 보강
- 예시 JSON을 넣어 응답 계약을 고정

### 권장 베이스라인

- median tokens: `~1800`
- median attempts: `3`
- median time: `15분`
- pattern bonus:
  - `+3`: idempotency와 권한 제약을 명확히 분리
  - `-2`: 동사형 엔드포인트만 나열하고 리소스 모델 부재

## 4. `test-mock-001` 결제 재시도 워커 테스트 작성

- 카테고리: `test`
- 예상 시간: 14분
- 제출물 형식:

```ts
describe('retryFailedPayment', () => {
  // Jest or Vitest tests
});
```

### 시나리오

실패한 결제를 재시도하는 워커가 있습니다. 외부 결제 게이트웨이, DB 업데이트, 알림 발송을 모두 건드리므로 실제 네트워크 호출 없이 테스트 전략을 짜야 합니다.

### 대상 함수 요구 동작

1. 결제 성공 시 상태를 `paid`로 변경
2. 실패 횟수가 3회 미만이면 재시도 카운트 증가
3. 3회째 실패 시 상태를 `failed_permanently`로 변경하고 알림 발송
4. 이미 `paid` 상태인 결제는 아무 작업도 하지 않음

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 첫 재시도 성공 | gateway mock 1회 호출, DB `paid` 업데이트 |
| `tc-2` | positive | 두 번째 실패 | retry count 증가, 알림 없음 |
| `tc-3` | edge_case | 세 번째 실패 | `failed_permanently`, 알림 1회 |
| `tc-4` | edge_case | 이미 `paid` | gateway 호출 0회 |

### 숨김 체크

- 외부 의존성을 mock 또는 fake로 격리했는지 확인
- 시간 의존 로직이 있다면 fake timer 또는 주입 가능한 clock을 고려했는지 확인
- 성공/실패 단언만 있고 호출 횟수, 인자 검증이 빠지지 않았는지 확인

### PASS 조건

- 4개 시나리오를 모두 검증
- 실제 네트워크 호출 없이 동작
- mock이 과도하게 내부 구현 세부사항에 묶여 brittle 하지 않아야 함

### 고득점 포인트

- AI에게 "행동 검증"과 "상태 검증"을 구분하게 함
- 외부 gateway, repository, notifier를 어떤 단위로 fake/mock 할지 먼저 정리
- flaky 포인트를 먼저 짚고 테스트 구조를 요청

### 권장 베이스라인

- median tokens: `~1600`
- median attempts: `3`
- median time: `12분`
- pattern bonus:
  - `+2`: mock 전략과 검증 포인트를 선분리
  - `-2`: 테스트가 구현 세부에 과도하게 결합

## 5. `component-command-palette-001` 명령 팔레트 검색 UI 구현

- 카테고리: `component`
- 예상 시간: 17분
- 제출물 형식:

```tsx
export function CommandPalette(props: {
  open: boolean;
  items: CommandItem[];
  onClose: () => void;
  onSelect: (id: string) => void;
}): JSX.Element;
```

### 시나리오

`Cmd/Ctrl + K`로 열리는 명령 팔레트를 만들어야 합니다. 검색, 키보드 이동, 빈 결과 상태, 닫기 동작이 모두 포함되어야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | `open=true` | 오버레이와 목록 노출 |
| `tc-2` | positive | 검색어 `set` 입력 | 매칭 항목만 필터링 |
| `tc-3` | edge_case | 화살표 아래/위 + Enter | active item 이동 후 선택 |
| `tc-4` | edge_case | 결과 없음 | empty state 표시 |
| `tc-5` | error_handling | `Esc` 입력 | 팔레트 닫힘 |

### 숨김 체크

- 포커스가 열릴 때 입력창으로 이동하는지 확인
- active index가 필터링 결과 길이를 벗어나지 않는지 확인
- 배경 스크롤 잠금 또는 동등한 UX 처리가 있는지 확인

### PASS 조건

- 검색, 키보드 탐색, 선택, 닫기 흐름 모두 작동
- 빈 결과 상태가 있어야 함
- 마우스만 되는 구현이면 FAIL

### 고득점 포인트

- AI에게 상태 전이표를 먼저 만들게 함
- 접근성과 키보드 조작을 요구사항 상단에 배치
- 팔레트가 닫힐 때 상태 초기화 정책까지 확인

### 권장 베이스라인

- median tokens: `~1850`
- median attempts: `3`
- median time: `14분`
- pattern bonus:
  - `+2`: 키보드 UX와 포커스까지 명확히 확인
  - `-2`: 단순 필터 리스트 수준으로 축소

## 6. `algo-rate-limit-001` Sliding window rate limiter 구현

- 카테고리: `algo`
- 예상 시간: 16분
- 제출물 형식:

```ts
export class SlidingWindowLimiter {
  allow(key: string, nowMs: number): boolean;
}
```

### 시나리오

사용자별 분당 5회 요청 제한을 sliding window 방식으로 구현해야 합니다. 고정 윈도우보다 정확해야 하며, 오래된 요청 기록은 정리되어야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 1분 내 5회 요청 | 모두 허용 |
| `tc-2` | positive | 같은 창에서 6번째 요청 | 거부 |
| `tc-3` | edge_case | 61초 후 새 요청 | 다시 허용 |
| `tc-4` | edge_case | 서로 다른 key | 독립적으로 계산 |
| `tc-5` | error_handling | 오래된 timestamp 다수 존재 | 메모리 누수 없이 정리 |

### 숨김 체크

- 요청 허용 전/후 정리 순서가 올바른지 확인
- 배열이 무한히 커지지 않게 pruning 하는지 확인
- boundary 시점 `== 60000ms` 처리 규칙이 일관적인지 확인

### PASS 조건

- sliding window 특성을 만족
- key 간 독립성 보장
- 오래된 이벤트 정리 로직 포함

### 고득점 포인트

- AI에게 고정 윈도우와 sliding window 차이를 먼저 설명하게 함
- boundary 반례를 직접 제시
- 시간 복잡도와 메모리 관리도 같이 묻기

### 권장 베이스라인

- median tokens: `~1750`
- median attempts: `3`
- median time: `13분`
- pattern bonus:
  - `+2`: 경계값과 pruning까지 검증
  - `-2`: 허용 카운트만 맞고 stale cleanup 누락

## 7. `test-contract-001` webhook 계약 테스트 설계

- 카테고리: `test`
- 예상 시간: 16분
- 제출물 형식:

```ts
describe('payment webhook contract', () => {
  // contract-oriented tests
});
```

### 시나리오

외부 결제사가 보내는 webhook payload가 종종 변형됩니다. 사용자는 AI와 함께 내부 핸들러가 기대하는 계약을 테스트로 고정해야 합니다.

### 공개 테스트 케이스

| ID | 유형 | 시나리오 | 기대 결과 |
| --- | --- | --- | --- |
| `tc-1` | positive | 유효한 `payment.succeeded` payload | 주문 상태 `paid` |
| `tc-2` | edge_case | 선택 필드 누락 | 허용 가능한 기본값 적용 |
| `tc-3` | negative | 서명 검증 실패 | `401` 또는 이벤트 무시 |
| `tc-4` | negative | 알 수 없는 이벤트 타입 | 안전하게 무시 또는 로깅 |
| `tc-5` | edge_case | 같은 event id 중복 수신 | idempotent 처리 |

### 숨김 체크

- fixture를 외부 문서 계약처럼 다루는지 확인
- 서명, 이벤트 타입, 중복 id라는 세 축이 분리돼 있는지 확인
- happy path만 있고 계약 훼손 케이스가 빈약하지 않은지 확인

### PASS 조건

- 유효 payload, 무효 payload, 중복 payload를 모두 다룸
- 계약 테스트 관점이 드러나야 함
- 단순 단위 테스트 흉내만 내고 외부 계약이 빠지면 FAIL

### 고득점 포인트

- AI에게 "어떤 필드가 계약상 필수인지" 먼저 정리하게 함
- payload fixture와 기대 side effect를 분리
- 외부 시스템 변화에 강한 테스트 구조를 요구

### 권장 베이스라인

- median tokens: `~1700`
- median attempts: `3`
- median time: `13분`
- pattern bonus:
  - `+2`: 필수/선택 필드를 구분
  - `-2`: fixture 하나로 모든 케이스를 뭉개기

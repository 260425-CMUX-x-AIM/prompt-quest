# PromptQuest Quest 카탈로그

PromptQuest에 바로 넣어도 되는 형태로 정리한 문제 설계안입니다. 현재 저장소의 카테고리, 평가 철학, 난이도 체계를 그대로 따라 `easy / medium / hard`로 나눴고, 별도로 사용자가 계속 도전하게 만드는 흥미 요소 설계도 포함했습니다.

## 구성 원칙

- 개발자가 실제로 AI와 협업할 만한 업무 시나리오여야 함
- 결과물의 정답 여부를 가능한 한 명확하게 검증할 수 있어야 함
- 정답만 맞히는 문제가 아니라, 프롬프트 명확성·컨텍스트 활용·에러 복구를 드러낼 수 있어야 함
- `docs/02-evaluation-logic.md`의 4단계 평가 파이프라인에 무리 없이 들어가야 함

## 공통 채점 구조

| 항목 | 배점 | 의미 |
| --- | --- | --- |
| Correctness | 40 | Validator PASS 시 획득. FAIL이면 총점 0점 |
| Efficiency | 30 | 토큰, 시도 횟수, 시간 |
| Context | 15 | 이전 응답을 활용해 점진 개선하는 능력 |
| Recovery | 10 | AI 오류를 짚고 수정 지시하는 능력 |
| Clarity | 5 | 요구사항, 제약, 출력 형식을 명확히 주는 능력 |
| Pattern bonus | -5 ~ +5 | 좋은 협업 패턴 보너스, 나쁜 패턴 페널티 |

## 문서 읽는 법

- 각 문제에는 `제출물 형식`, `공개 테스트 케이스`, `숨김 체크`, `PASS 조건`, `고득점 포인트`, `권장 베이스라인`이 포함됩니다.
- 공개 테스트 케이스는 사용자에게 노출 가능한 범위입니다.
- 숨김 체크는 운영자가 Validator나 Judge 프롬프트에 넣어둘 항목입니다.
- 베이스라인은 초기 운영값 가정치이며, 실제 세션 데이터가 쌓이면 교체하는 전제입니다.

## 문제 목록

### 초급

| ID | 제목 | 카테고리 | 예상 시간 |
| --- | --- | --- | --- |
| `regex-email-001` | 이메일 추출 정규식 작성 | regex | 5분 |
| `debug-async-001` | Promise 체이닝 버그 수정 | debug | 6분 |
| `review-pr-001` | 신규 API PR 코드 리뷰 | review | 8분 |
| `debug-date-001` | 타임존 기준 청구일 계산 버그 수정 | debug | 7분 |
| `regex-log-redact-001` | 로그 속 개인정보 마스킹 정규식 | regex | 6분 |
| `debug-null-state-001` | null 상태 전이 버그 수정 | debug | 7분 |
| `review-rate-limit-001` | Rate limit 미들웨어 PR 리뷰 | review | 9분 |

자세한 내용: [easy.md](./easy.md)

### 중급

| ID | 제목 | 카테고리 | 예상 시간 |
| --- | --- | --- | --- |
| `component-pagination-001` | React 페이지네이션 컴포넌트 구현 | component | 15분 |
| `algo-sort-001` | 객체 배열 다중 키 정렬 | algo | 12분 |
| `api-design-001` | 팀 초대 REST API 설계 | api_design | 18분 |
| `test-mock-001` | 결제 재시도 워커 테스트 작성 | test | 14분 |
| `component-command-palette-001` | 명령 팔레트 검색 UI 구현 | component | 17분 |
| `algo-rate-limit-001` | Sliding window rate limiter 구현 | algo | 16분 |
| `test-contract-001` | webhook 계약 테스트 설계 | test | 16분 |

자세한 내용: [medium.md](./medium.md)

### 고급

| ID | 제목 | 카테고리 | 예상 시간 |
| --- | --- | --- | --- |
| `arch-event-001` | 주문/결제/재고 이벤트 기반 아키텍처 설계 | arch | 35분 |
| `refactor-legacy-001` | 콜백 헬 주문 처리 모듈 리팩토링 | refactor | 28분 |
| `security-xss-001` | 댓글 렌더링 XSS 취약점 진단 및 수정 | security | 30분 |
| `perf-react-001` | React 대시보드 렌더링 병목 분석 | perf | 32분 |
| `security-ssrf-001` | 이미지 가져오기 기능 SSRF 차단 | security | 34분 |
| `perf-sql-001` | 느린 리포트 SQL 병목 분석 | perf | 33분 |
| `arch-multitenant-001` | 멀티테넌트 권한/격리 아키텍처 설계 | arch | 36분 |

자세한 내용: [hard.md](./hard.md)

## 추천 플레이 루트

| 루트명 | 구성 | 의도 |
| --- | --- | --- |
| `First Clear` | `regex-email-001` → `debug-async-001` → `review-pr-001` | 처음 유입된 사용자가 20분 안에 첫 성취를 느끼게 하는 루트 |
| `Frontend Sprint` | `component-pagination-001` → `component-command-palette-001` → `perf-react-001` | 화면 구현부터 성능 분석까지 연결 |
| `Backend Incident Night` | `debug-date-001` → `api-design-001` → `security-ssrf-001` | 장애 대응, 계약 설계, 보안 진단 흐름 |
| `Testing Mindset` | `test-mock-001` → `test-contract-001` → `review-rate-limit-001` | 테스트와 리뷰 감각 강화 |

## 흥미 요소 문서

- [engagement.md](./engagement.md): 보스 퀘스트, 이벤트 모드, 업적, 추천 시즌 운영안

## 직군 확장 트랙

개발자 외 사용자까지 넓히려면, "정답이 명확한 실무형 산출물"을 각 직군에 맞게 다시 정의해야 합니다. 아래 문서는 그런 확장용 시드 카탈로그입니다.

| 직군 | 예시 미션 |
| --- | --- |
| 회계 / 재무 | 분개 검토, 비용 이상치 점검 |
| 디자이너 | UI critique, 브랜드 톤 보드 작성 |
| PM / 기획 | 요구사항 정리, 우선순위 조정 |
| 마케터 | 캠페인 카피, 퍼널 분석 |
| HR / 채용 | JD 정제, 면접 평가 정리 |
| 고객지원 / 운영 | VOC 분류, 장애 공지 초안 |

자세한 내용: [multidomain.md](./multidomain.md)

## 업종 확장 트랙

현재 문제들이 웹서비스 / SaaS 문맥에 상대적으로 치우쳐 있어서, 의료, 보험, 물류, 제조, 교육, 공공, 부동산, 법무, 에너지 등 더 다양한 산업으로 넓히기 위한 후보군을 별도 정리했습니다.

자세한 내용: [industry-expansion.md](./industry-expansion.md)

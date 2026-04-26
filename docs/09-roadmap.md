# 9. 개발 로드맵 (스프린트)

12 영업일, 2인 개발 기준. Day 1은 페어로 인터페이스 합의, 이후는 병렬.

## Day 1 — 페어 셋업 (공유)

오전 (둘이 함께):

- [ ] Next.js 14 프로젝트 생성
- [ ] Supabase 프로젝트 생성
- [ ] **인터페이스 합의 ([3.4](./03-team-split.md#34-인터페이스-계약-day-1-합의-사항))** — 6개 파일 작성
- [ ] `.env.example` 작성
- [ ] GitHub 리포지토리 + 브랜치 전략

오후 (분리 시작):

- A: shadcn/ui 설치, 디자인 데모에서 토큰 가져오기
- B: 5장 마이그레이션 작성 + 적용

## Day 2 — 인증 + 태스크 시스템

- A: 로그인/매직링크 + Profile 트리거 적용 + 약관 페이지 라우트
- B: 태스크 5개 YAML 작성 + 시드 스크립트 + RLS 검증

## Day 3 — 태스크 화면 + Validator

- A: 태스크 목록 + 상세 페이지 (mock 데이터로 시작)
- B: Validator 모듈 + 테스트 (5개 태스크에 대한 단위 테스트)

## Day 4 — 챌린지 레이아웃 + Quantitative

- A: 챌린지 화면 3분할 레이아웃 + 메시지 mock 컴포넌트
- B: Quantitative Analyzer + 패턴 분석 단위 테스트

## Day 5 — Claude API 연동 + Judge

- A: Claude API 실제 호출 + 메시지 저장 + 토큰 카운터
- B: Judge ensemble + OpenAI API 연동 + 분산 측정

## Day 6 — 결과물 작업공간 + Aggregator

- A: 결과물 작업공간 + 코드 추출/추가 인터랙션
- B: Aggregator + 통합 파이프라인 (`runEvaluationPipeline`)
- ★ **페어 30분: 결과 화면 ↔︎ 평가 결과 형식 통합 검증**

## Day 7 — 제출 흐름 + Edge Function

- A: 제출 모달 + 결과 화면 (점수 표시) + 신뢰도 배지
- B: Edge Function 배포 + Realtime 발행 + 분쟁 신청 API

## Day 8 — 마이 페이지 + 운영 도구

- A: 마이 페이지 히스토리 + 에러 상태 UI
- B: Rate Limiting (Upstash) + Sentry + 분쟁 검토 도구 (간단한 어드민 페이지)

## Day 9 — 통합 테스트

둘이 함께:

- [ ] E2E 시나리오 1: 로그인 → 풀이 → 채점 → 결과 확인
- [ ] E2E 시나리오 2: Validator FAIL 케이스
- [ ] E2E 시나리오 3: Rate Limit 발동
- [ ] 발견 버그 분담 수정

## Day 10 — 베타 빌드

- A: 랜딩 페이지 + 카피 다듬기 + 모바일 미니멀 대응
- B: 골든 셋 5개 만들고 Quality Check 실행 + 결과 분석

## Day 11~12 — 베타 테스트 + 피드백 반영

- 지인 5명 베타 테스트
- 피드백 반영 + 점수 분포 확인
- v1.5 백로그 정리

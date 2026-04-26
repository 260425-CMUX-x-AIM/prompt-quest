# 8. 태스크 제작 시스템

태스크는 사실상 이 서비스의 콘텐츠. 시스템으로 만들어야 합니다.

## 8.1 카테고리

```
[Easy — 1~3턴 풀이]
- regex     정규식 작성
- debug     단순 디버깅
- review    코드 리뷰

[Medium — 5~10턴 풀이]
- component UI 컴포넌트 구현
- algo      알고리즘 최적화
- api_design API 설계
- test      테스트 작성

[Hard — 10턴 이상]
- arch      아키텍처 설계
- refactor  레거시 리팩토링
- security  보안 취약점
- perf      성능 분석
```

## 8.2 태스크 YAML 표준 템플릿

```yaml
metadata:
  id: regex-email-001
  title: '이메일 추출 정규식 작성'
  category: regex
  difficulty: easy
  estimated_minutes: 5
  version: 1
  author: '운영자'
  created_at: 2026-04-25

context:
  background: |
    여러 형식이 섞여있는 텍스트에서 이메일 주소만 추출하는 정규식이 필요합니다.
  scenario: |
    당신은 로그 파일을 파싱하는 스크립트를 작성 중입니다.
    AI에게 정규식 패턴을 만들어달라고 요청하세요.

requirements:
  - id: req-1
    description: '유효한 이메일 형식만 매칭'
    weight: 0.5
  - id: req-2
    description: '도메인 부분에 점이 최소 1개 포함'
    weight: 0.3
  - id: req-3
    description: 'ReDoS 공격에 안전한 패턴'
    weight: 0.2

artifact_format:
  type: regex
  language: javascript
  stub: |
    const EMAIL_REGEX = /YOUR_PATTERN_HERE/g;

test_cases:
  - id: tc-positive-1
    input: 'Contact: alice@example.com or bob@sub.test.org'
    expected_matches: ['alice@example.com', 'bob@sub.test.org']
    type: positive
  - id: tc-negative-1
    input: 'Invalid: not-an-email, @missing.com, foo@'
    expected_matches: []
    type: negative
  - id: tc-edge-1
    input: 'Edge: a@b.c, very.long.name+tag@company.co.uk'
    expected_matches: ['a@b.c', 'very.long.name+tag@company.co.uk']
    type: edge_case

constraints:
  max_attempts: 5
  time_limit_seconds: 600
  forbidden_patterns:
    - "\\.\\*"

baseline:
  median_total_tokens: 800
  median_attempts: 2
  median_time_seconds: 240
  computed_from_sessions: 0
```

## 8.3 태스크 5개 (MVP 시드)

MVP 출시용으로 다음 5개를 직접 작성. 모두 위 템플릿 따름.

1. **`regex-email-001`** (Easy) — 이메일 추출 정규식
2. **`debug-async-001`** (Easy) — Promise 체이닝 버그 수정
3. **`component-pagination-001`** (Medium) — React 페이지네이션 컴포넌트
4. **`algo-sort-001`** (Medium) — 객체 배열 다중 키 정렬
5. **`refactor-legacy-001`** (Hard) — 콜백 헬을 async/await로 리팩토링

각 태스크의 전체 YAML은 `tasks/seed/` 디렉토리에 별도 파일로. 운영자가 직접 편집.

## 8.4 태스크 시드 스크립트

```ts
// scripts/seed-tasks.ts
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const taskDir = join(process.cwd(), 'tasks/seed');
const files = readdirSync(taskDir).filter((f) => f.endsWith('.yaml'));

for (const file of files) {
  const yaml = readFileSync(join(taskDir, file), 'utf-8');
  const def = parseYaml(yaml);

  await supabase.from('tasks').upsert(
    {
      slug: def.metadata.id,
      title: def.metadata.title,
      category_slug: def.metadata.category,
      difficulty: def.metadata.difficulty,
      yaml_definition: yaml,
      is_published: true,
      published_at: new Date().toISOString(),
    },
    { onConflict: 'slug' },
  );

  console.log(`Seeded: ${def.metadata.id}`);
}
```

## 8.5 v2 태스크 자동 생성 파이프라인 (이후 단계)

```
[운영자 주제 입력]
    ↓
[Generator AI] 다양한 시나리오 후보 N개 생성
    ↓
[Solver AI x M] 각 후보를 풀어보며 난이도/품질 측정
    ↓
[운영자 검수] 최종 선별 + 약간 수정
    ↓
[게시]
```

MVP 출시 후 콘텐츠 부족 문제 해결할 때 도입.

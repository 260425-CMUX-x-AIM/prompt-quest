# 5. DB 스키마 설계

Supabase(PostgreSQL) 기준. 모든 테이블 RLS 적용.

**MVP 범위:** `profiles`, `task_categories`, `tasks`, `sessions`, `messages`, `artifacts`, `evaluations`, `evaluation_stages`, `evaluation_disputes`.

**v1.5 추가:** `task_baselines`, `task_health_metrics`.

## 5.1 ERD 개요

```
auth.users
    │
    └── profiles (1:1)
              │
              └── sessions (1:N) ── messages (1:N)
                      │
                      └── artifacts (1:N)
                      │
                      └── evaluations (1:1)
                              │
                              ├── evaluation_stages (1:N)
                              └── evaluation_disputes (1:N)

task_categories (마스터, 11개)
    │
    └── tasks (1:N)
            │
            └── sessions (1:N)
```

## 5.2 핵심 테이블

### `profiles`

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  marketing_opt_in boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "프로필 읽기" on profiles for select using (true);
create policy "본인 프로필 수정" on profiles for update using (auth.uid() = id);
```

**자동 생성 트리거** (`auth.users` insert 시 `profiles` 자동 생성):

```sql
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := split_part(new.email, '@', 1);
  final_username := base_username;

  while exists (select 1 from profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || '-' || counter::text;
  end loop;

  insert into profiles (id, username, terms_accepted_at, privacy_accepted_at)
  values (new.id, final_username, now(), now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### `task_categories`

```sql
create table task_categories (
  slug text primary key,
  label_ko text not null,
  label_en text not null,
  description text,
  display_order int default 0,
  is_active boolean default true
);

insert into task_categories (slug, label_ko, label_en, display_order) values
  ('regex', '정규식 작성', 'Regex', 1),
  ('debug', '단순 디버깅', 'Debug', 2),
  ('review', '코드 리뷰', 'Review', 3),
  ('component', 'UI 컴포넌트', 'Component', 10),
  ('algo', '알고리즘', 'Algorithm', 11),
  ('api_design', 'API 설계', 'API Design', 12),
  ('test', '테스트 작성', 'Testing', 13),
  ('arch', '아키텍처 설계', 'Architecture', 20),
  ('refactor', '리팩토링', 'Refactoring', 21),
  ('security', '보안 취약점', 'Security', 22),
  ('perf', '성능 분석', 'Performance', 23);

alter table task_categories enable row level security;
create policy "카테고리 누구나 읽기" on task_categories for select using (true);
```

### `tasks`

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category_slug text not null references task_categories(slug),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),

  yaml_definition text not null,

  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index idx_tasks_published on tasks(is_published, difficulty);
create index idx_tasks_category on tasks(category_slug);

alter table tasks enable row level security;
create policy "공개 태스크 읽기" on tasks for select using (is_published = true);
```

### `sessions`

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  task_id uuid not null references tasks(id),

  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'evaluating', 'evaluated', 'failed', 'abandoned')),

  started_at timestamptz default now(),
  submitted_at timestamptz,
  evaluated_at timestamptz,

  attempt_count int default 0,
  message_count int default 0,
  total_input_tokens int default 0,
  total_output_tokens int default 0,

  created_at timestamptz default now()
);

create index idx_sessions_user_status on sessions(user_id, status);
create index idx_sessions_task on sessions(task_id);

alter table sessions enable row level security;
create policy "본인 세션 조회" on sessions for select using (auth.uid() = user_id);
create policy "본인 세션 생성" on sessions for insert with check (auth.uid() = user_id);
create policy "본인 세션 수정" on sessions for update using (auth.uid() = user_id);
```

### `messages`

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,

  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,

  input_tokens int,
  output_tokens int,

  extracted_code_blocks jsonb,

  created_at timestamptz default now()
);

create index idx_messages_session on messages(session_id, created_at);

alter table messages enable row level security;
create policy "본인 메시지 조회" on messages for select using (
  exists (select 1 from sessions where sessions.id = messages.session_id and sessions.user_id = auth.uid())
);
```

### `artifacts`

MVP는 단일 결과물. v1.5에서 다중 버전 도입.

```sql
create table artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,

  version int not null default 1,
  content text not null,
  language text,
  source text check (source in ('ai_extracted', 'user_edited', 'manual')),

  is_final boolean default false,

  created_at timestamptz default now()
);

create unique index idx_artifacts_final on artifacts(session_id) where is_final = true;

alter table artifacts enable row level security;
create policy "본인 아티팩트 조회" on artifacts for select using (
  exists (select 1 from sessions where sessions.id = artifacts.session_id and sessions.user_id = auth.uid())
);
create policy "본인 아티팩트 수정" on artifacts for all using (
  exists (select 1 from sessions where sessions.id = artifacts.session_id and sessions.user_id = auth.uid())
);
```

### `evaluations`

```sql
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique not null references sessions(id) on delete cascade,

  validator_passed boolean not null,
  validator_reason text,

  total_score int check (total_score between 0 and 100),
  scores jsonb,
  feedback jsonb,
  meta jsonb,                                    -- baseline_source, judge_max_stddev 등

  percentile numeric(4,1),

  created_at timestamptz default now()
);

alter table evaluations enable row level security;
create policy "본인 평가 조회" on evaluations for select using (
  exists (select 1 from sessions where sessions.id = evaluations.session_id and sessions.user_id = auth.uid())
);
```

### `evaluation_stages`

```sql
create table evaluation_stages (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,

  stage text not null check (stage in ('validator', 'quantitative', 'judge', 'aggregator')),
  status text not null check (status in ('pending', 'running', 'success', 'failed')),

  input_data jsonb,
  output_data jsonb,

  started_at timestamptz,
  completed_at timestamptz,
  duration_ms int,

  error_message text,

  created_at timestamptz default now()
);

create index idx_eval_stages_eval on evaluation_stages(evaluation_id, stage);

alter table evaluation_stages enable row level security;
create policy "본인 단계 조회" on evaluation_stages for select using (
  exists (
    select 1 from evaluations
    join sessions on sessions.id = evaluations.session_id
    where evaluations.id = evaluation_stages.evaluation_id
      and sessions.user_id = auth.uid()
  )
);
```

### `evaluation_disputes`

```sql
create table evaluation_disputes (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  user_id uuid not null references profiles(id),

  reason text not null check (reason in ('score_too_low', 'score_too_high', 'bad_feedback', 'other')),
  user_comment text,

  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'rescored', 'rejected')),
  admin_note text,
  rescored_value int,

  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create index idx_disputes_status on evaluation_disputes(status, created_at);

alter table evaluation_disputes enable row level security;
create policy "본인 분쟁 생성" on evaluation_disputes for insert with check (auth.uid() = user_id);
create policy "본인 분쟁 조회" on evaluation_disputes for select using (auth.uid() = user_id);
```

## 5.3 v1.5 추가 테이블

### `task_baselines`

```sql
create table task_baselines (
  task_id uuid primary key references tasks(id) on delete cascade,
  median_total_tokens int,
  median_attempts int,
  median_time_seconds int,
  sample_size int default 0,
  last_updated_at timestamptz default now()
);
```

샘플 30개 이상 쌓이면 백그라운드 잡으로 갱신. MVP에서는 YAML의 baseline 필드 사용.

### `task_health_metrics`

```sql
create table task_health_metrics (
  task_id uuid primary key references tasks(id) on delete cascade,
  total_attempts int default 0,
  completion_rate numeric(4,3),
  abandonment_rate numeric(4,3),
  avg_score numeric(5,2),
  score_stddev numeric(5,2),
  is_problematic boolean default false,
  problem_reason text,
  last_computed_at timestamptz default now()
);
```

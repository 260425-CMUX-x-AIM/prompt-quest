create extension if not exists pgcrypto;

create table if not exists profiles (
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := split_part(new.email, '@', 1);
  final_username := base_username;

  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || '-' || counter::text;
  end loop;

  insert into public.profiles (id, username, terms_accepted_at, privacy_accepted_at)
  values (new.id, final_username, now(), now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists task_categories (
  slug text primary key,
  label_ko text not null,
  label_en text not null,
  description text,
  display_order int default 0,
  is_active boolean default true
);

insert into task_categories (slug, label_ko, label_en, display_order)
values
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
  ('perf', '성능 분석', 'Performance', 23),
  ('sql', 'SQL', 'SQL', 24)
on conflict (slug) do nothing;

alter table task_categories enable row level security;

create policy "카테고리 누구나 읽기" on task_categories for select using (true);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category_slug text not null references task_categories(slug),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  yaml_definition text not null,
  estimated_minutes int default 5,
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index idx_tasks_published on tasks(is_published, difficulty);
create index idx_tasks_category on tasks(category_slug);

alter table tasks enable row level security;

create policy "공개 태스크 읽기" on tasks for select using (is_published = true);

create table if not exists sessions (
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

create table if not exists messages (
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
  exists (
    select 1
    from sessions
    where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
  )
);

create policy "본인 메시지 생성" on messages for insert with check (
  exists (
    select 1
    from sessions
    where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
  )
);

create table if not exists artifacts (
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
  exists (
    select 1
    from sessions
    where sessions.id = artifacts.session_id
      and sessions.user_id = auth.uid()
  )
);

create policy "본인 아티팩트 수정" on artifacts for all using (
  exists (
    select 1
    from sessions
    where sessions.id = artifacts.session_id
      and sessions.user_id = auth.uid()
  )
);

create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique not null references sessions(id) on delete cascade,
  validator_passed boolean not null,
  validator_reason text,
  total_score int check (total_score between 0 and 100),
  scores jsonb,
  feedback jsonb,
  meta jsonb,
  percentile numeric(4, 1),
  created_at timestamptz default now()
);

alter table evaluations enable row level security;

create policy "본인 평가 조회" on evaluations for select using (
  exists (
    select 1
    from sessions
    where sessions.id = evaluations.session_id
      and sessions.user_id = auth.uid()
  )
);

create table if not exists evaluation_stages (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
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
    select 1
    from sessions
    where sessions.id = evaluation_stages.session_id
      and sessions.user_id = auth.uid()
  )
);

create table if not exists evaluation_disputes (
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

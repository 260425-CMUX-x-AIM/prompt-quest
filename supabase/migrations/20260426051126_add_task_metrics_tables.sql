create table if not exists task_baselines (
  task_id uuid primary key references tasks(id) on delete cascade,
  median_total_tokens int,
  median_attempts int,
  median_time_seconds int,
  sample_size int default 0,
  last_updated_at timestamptz default now()
);

create table if not exists task_health_metrics (
  task_id uuid primary key references tasks(id) on delete cascade,
  total_attempts int default 0,
  completion_rate numeric(4, 3),
  abandonment_rate numeric(4, 3),
  avg_score numeric(5, 2),
  score_stddev numeric(5, 2),
  is_problematic boolean default false,
  problem_reason text,
  last_computed_at timestamptz default now()
);

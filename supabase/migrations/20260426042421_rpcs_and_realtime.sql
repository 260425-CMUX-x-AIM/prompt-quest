create or replace function public.increment_session_counters(
  p_session_id uuid,
  p_input_tokens integer,
  p_output_tokens integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.sessions
  set total_input_tokens = total_input_tokens + coalesce(p_input_tokens, 0),
      total_output_tokens = total_output_tokens + coalesce(p_output_tokens, 0),
      message_count = message_count + 2
  where id = p_session_id
    and (auth.uid() = user_id or auth.role() = 'service_role');
end;
$function$;

create or replace function public.submit_artifact(
  p_session_id uuid,
  p_artifact_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from public.sessions
    where id = p_session_id
      and (
        user_id = auth.uid()
        or auth.role() = 'service_role'
      )
      and status = 'in_progress'
  ) then
    raise exception 'session not found or not in progress';
  end if;

  update public.artifacts
  set is_final = false
  where session_id = p_session_id;

  update public.artifacts
  set is_final = true
  where id = p_artifact_id
    and session_id = p_session_id;

  update public.sessions
  set status = 'evaluating',
      submitted_at = now(),
      attempt_count = attempt_count + 1
  where id = p_session_id;
end;
$function$;

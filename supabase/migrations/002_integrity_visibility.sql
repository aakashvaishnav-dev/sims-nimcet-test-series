-- Apply in Supabase SQL Editor before deploying. Applies to NEW and ongoing attempts.
alter table public.attempts add column if not exists hidden_at timestamptz;
alter table public.attempts add column if not exists integrity_violation boolean not null default false;

create or replace function public.record_attempt_visibility(p_attempt_id uuid, p_event text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v public.attempts%rowtype; v_violation boolean := false;
begin
  if p_event not in ('hidden', 'visible') then raise exception 'Invalid event'; end if;
  select * into v from public.attempts where id = p_attempt_id for update;
  if not found or v.student_id <> auth.uid() then raise exception 'Not allowed'; end if;
  if v.status <> 'in_progress' then return jsonb_build_object('terminated', true, 'status', v.status); end if;
  if p_event = 'hidden' then
    if v.hidden_at is null then update public.attempts set hidden_at = clock_timestamp() where id = p_attempt_id; end if;
  else
    if v.hidden_at is not null and clock_timestamp() - v.hidden_at > interval '2 seconds' then
      update public.attempts set integrity_violation = true where id = p_attempt_id;
      v_violation := true;
      perform public.submit_attempt(p_attempt_id, true);
    else
      update public.attempts set hidden_at = null where id = p_attempt_id;
    end if;
  end if;
  return jsonb_build_object('terminated', v_violation, 'event', p_event);
end;
$$;
revoke all on function public.record_attempt_visibility(uuid,text) from public, anon;
grant execute on function public.record_attempt_visibility(uuid,text) to authenticated;

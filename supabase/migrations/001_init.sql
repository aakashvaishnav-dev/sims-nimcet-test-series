-- SIMS Raipur NIMCET Test Series - Initial schema
-- Run once in Supabase SQL Editor or with Supabase CLI.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'admin');
create type public.attempt_status as enum ('in_progress', 'submitted', 'auto_submitted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  max_attempts integer not null default 1 check (max_attempts > 0),
  total_questions integer not null default 0,
  total_marks numeric(10,2) not null default 0,
  default_marks numeric(10,2) not null default 4,
  default_negative_marks numeric(10,2) not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_window_valid check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_number integer not null check (question_number > 0),
  subject text not null default 'General',
  question_en text not null,
  question_hi text,
  option_a_en text not null,
  option_a_hi text,
  option_b_en text not null,
  option_b_hi text,
  option_c_en text not null,
  option_c_hi text,
  option_d_en text not null,
  option_d_hi text,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  explanation_en text,
  explanation_hi text,
  marks numeric(10,2) not null default 4 check (marks >= 0),
  negative_marks numeric(10,2) not null default 1 check (negative_marks >= 0),
  created_at timestamptz not null default now(),
  unique (exam_id, question_number)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  status public.attempt_status not null default 'in_progress',
  score numeric(10,2),
  correct_count integer,
  wrong_count integer,
  unanswered_count integer,
  percentage numeric(10,2),
  time_taken_seconds integer,
  created_at timestamptz not null default now()
);

create table public.answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option text check (selected_option in ('A','B','C','D')),
  is_marked_for_review boolean not null default false,
  saved_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create index exams_published_idx on public.exams(is_published, starts_at, ends_at);
create index questions_exam_idx on public.questions(exam_id, question_number);
create index attempts_student_idx on public.attempts(student_id, created_at desc);
create index attempts_exam_status_idx on public.attempts(exam_id, status, score desc);
create index attempts_expiry_idx on public.attempts(status, expires_at);
create index answers_attempt_idx on public.answers(attempt_id);

-- Automatically create a safe student profile after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  );
$$;

-- Secure scoring. Correct answers never need to be sent to the browser during a live test.
create or replace function public.submit_attempt(
  p_attempt_id uuid,
  p_auto boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_score numeric(10,2) := 0;
  v_total_marks numeric(10,2) := 0;
  v_correct integer := 0;
  v_wrong integer := 0;
  v_total integer := 0;
  v_unanswered integer := 0;
  v_percentage numeric(10,2) := 0;
  v_time integer := 0;
  v_status public.attempt_status;
begin
  select * into v_attempt
  from public.attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'Attempt not found';
  end if;

  if v_attempt.student_id <> auth.uid()
     and not public.is_admin(auth.uid())
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Not allowed';
  end if;

  if v_attempt.status <> 'in_progress' then
    return jsonb_build_object(
      'id', v_attempt.id,
      'status', v_attempt.status,
      'score', v_attempt.score,
      'correctCount', v_attempt.correct_count,
      'wrongCount', v_attempt.wrong_count,
      'unansweredCount', v_attempt.unanswered_count,
      'percentage', v_attempt.percentage
    );
  end if;

  select
    count(*)::integer,
    coalesce(sum(q.marks), 0),
    count(*) filter (where a.selected_option = q.correct_option)::integer,
    count(*) filter (where a.selected_option is not null and a.selected_option <> q.correct_option)::integer,
    coalesce(sum(
      case
        when a.selected_option = q.correct_option then q.marks
        when a.selected_option is not null and a.selected_option <> q.correct_option then -q.negative_marks
        else 0
      end
    ), 0)
  into v_total, v_total_marks, v_correct, v_wrong, v_score
  from public.questions q
  left join public.answers a
    on a.question_id = q.id and a.attempt_id = p_attempt_id
  where q.exam_id = v_attempt.exam_id;

  v_unanswered := greatest(v_total - v_correct - v_wrong, 0);
  if v_total_marks > 0 then
    v_percentage := round((v_score / v_total_marks) * 100, 2);
  end if;

  v_time := greatest(
    0,
    floor(extract(epoch from (least(now(), v_attempt.expires_at) - v_attempt.started_at)))::integer
  );

  if p_auto or now() >= v_attempt.expires_at then
    v_status := 'auto_submitted';
  else
    v_status := 'submitted';
  end if;

  update public.attempts
  set
    submitted_at = now(),
    status = v_status,
    score = v_score,
    correct_count = v_correct,
    wrong_count = v_wrong,
    unanswered_count = v_unanswered,
    percentage = v_percentage,
    time_taken_seconds = v_time
  where id = p_attempt_id;

  return jsonb_build_object(
    'id', p_attempt_id,
    'status', v_status,
    'score', v_score,
    'correctCount', v_correct,
    'wrongCount', v_wrong,
    'unansweredCount', v_unanswered,
    'percentage', v_percentage
  );
end;
$$;

create or replace function public.start_exam(p_exam_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_existing public.attempts%rowtype;
  v_attempt_count integer := 0;
  v_attempt_id uuid;
  v_expires timestamptz;
  v_question_count integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_exam from public.exams where id = p_exam_id;
  if not found then raise exception 'Exam not found'; end if;
  if not v_exam.is_published then raise exception 'Exam is not published'; end if;
  if v_exam.starts_at is not null and now() < v_exam.starts_at then raise exception 'Exam has not started yet'; end if;
  if v_exam.ends_at is not null and now() >= v_exam.ends_at then raise exception 'Exam window has ended'; end if;

  select count(*)::integer into v_question_count
  from public.questions where exam_id = p_exam_id;
  if v_question_count = 0 then raise exception 'This test has no questions'; end if;

  select * into v_existing
  from public.attempts
  where exam_id = p_exam_id and student_id = v_user and status = 'in_progress'
  order by started_at desc
  limit 1;

  if found then
    if v_existing.expires_at > now() then
      return jsonb_build_object(
        'attemptId', v_existing.id,
        'expiresAt', v_existing.expires_at,
        'resumed', true
      );
    else
      perform public.submit_attempt(v_existing.id, true);
    end if;
  end if;

  select count(*)::integer into v_attempt_count
  from public.attempts
  where exam_id = p_exam_id
    and student_id = v_user
    and status in ('submitted', 'auto_submitted');

  if v_attempt_count >= v_exam.max_attempts then
    raise exception 'Maximum attempts reached';
  end if;

  v_expires := now() + make_interval(mins => v_exam.duration_minutes);
  if v_exam.ends_at is not null then
    v_expires := least(v_expires, v_exam.ends_at);
  end if;

  insert into public.attempts (exam_id, student_id, started_at, expires_at, status)
  values (p_exam_id, v_user, now(), v_expires, 'in_progress')
  returning id into v_attempt_id;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'expiresAt', v_expires,
    'resumed', false
  );
end;
$$;

create or replace function public.save_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected_option text default null,
  p_marked_for_review boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_question_exam uuid;
  v_option text;
begin
  v_option := nullif(upper(trim(coalesce(p_selected_option, ''))), '');
  if v_option is not null and v_option not in ('A','B','C','D') then
    raise exception 'Invalid option';
  end if;

  select * into v_attempt
  from public.attempts
  where id = p_attempt_id
  for update;

  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.student_id <> auth.uid() then raise exception 'Not allowed'; end if;

  if v_attempt.status <> 'in_progress' then
    return jsonb_build_object('status', 'submitted');
  end if;

  if now() >= v_attempt.expires_at then
    perform public.submit_attempt(p_attempt_id, true);
    return jsonb_build_object('status', 'expired');
  end if;

  select exam_id into v_question_exam
  from public.questions where id = p_question_id;

  if v_question_exam is null or v_question_exam <> v_attempt.exam_id then
    raise exception 'Question does not belong to this test';
  end if;

  insert into public.answers (
    attempt_id, question_id, selected_option, is_marked_for_review, saved_at
  ) values (
    p_attempt_id, p_question_id, v_option, p_marked_for_review, now()
  )
  on conflict (attempt_id, question_id)
  do update set
    selected_option = excluded.selected_option,
    is_marked_for_review = excluded.is_marked_for_review,
    saved_at = now();

  return jsonb_build_object('status', 'saved', 'savedAt', now());
end;
$$;

create or replace function public.get_attempt_session(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_exam public.exams%rowtype;
  v_questions jsonb;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;

  if v_attempt.student_id <> auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'Not allowed';
  end if;

  if v_attempt.status = 'in_progress' and now() >= v_attempt.expires_at then
    perform public.submit_attempt(p_attempt_id, true);
    select * into v_attempt from public.attempts where id = p_attempt_id;
  end if;

  select * into v_exam from public.exams where id = v_attempt.exam_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'number', q.question_number,
        'subject', q.subject,
        'questionEn', q.question_en,
        'questionHi', q.question_hi,
        'optionAEn', q.option_a_en,
        'optionAHi', q.option_a_hi,
        'optionBEn', q.option_b_en,
        'optionBHi', q.option_b_hi,
        'optionCEn', q.option_c_en,
        'optionCHi', q.option_c_hi,
        'optionDEn', q.option_d_en,
        'optionDHi', q.option_d_hi,
        'selectedOption', a.selected_option,
        'markedForReview', coalesce(a.is_marked_for_review, false)
      ) order by q.question_number
    ), '[]'::jsonb
  ) into v_questions
  from public.questions q
  left join public.answers a
    on a.question_id = q.id and a.attempt_id = p_attempt_id
  where q.exam_id = v_attempt.exam_id;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'status', v_attempt.status,
      'startedAt', v_attempt.started_at,
      'expiresAt', v_attempt.expires_at,
      'serverNow', now()
    ),
    'exam', jsonb_build_object(
      'id', v_exam.id,
      'title', v_exam.title,
      'durationMinutes', v_exam.duration_minutes,
      'totalQuestions', v_exam.total_questions,
      'totalMarks', v_exam.total_marks
    ),
    'questions', v_questions
  );
end;
$$;

create or replace function public.get_attempt_result(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_exam public.exams%rowtype;
  v_questions jsonb;
  v_rank integer := 1;
  v_participants integer := 0;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found'; end if;

  if v_attempt.student_id <> auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'Not allowed';
  end if;

  if v_attempt.status = 'in_progress' and now() >= v_attempt.expires_at then
    perform public.submit_attempt(p_attempt_id, true);
    select * into v_attempt from public.attempts where id = p_attempt_id;
  end if;

  if v_attempt.status = 'in_progress' then
    raise exception 'Attempt is still in progress';
  end if;

  select * into v_exam from public.exams where id = v_attempt.exam_id;

  select count(*)::integer into v_participants
  from public.attempts
  where exam_id = v_attempt.exam_id and status in ('submitted','auto_submitted');

  select 1 + count(*)::integer into v_rank
  from public.attempts a
  where a.exam_id = v_attempt.exam_id
    and a.status in ('submitted','auto_submitted')
    and (
      coalesce(a.score, 0) > coalesce(v_attempt.score, 0)
      or (
        coalesce(a.score, 0) = coalesce(v_attempt.score, 0)
        and coalesce(a.time_taken_seconds, 2147483647) < coalesce(v_attempt.time_taken_seconds, 2147483647)
      )
    );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'number', q.question_number,
        'subject', q.subject,
        'questionEn', q.question_en,
        'questionHi', q.question_hi,
        'options', jsonb_build_object(
          'A', jsonb_build_object('en', q.option_a_en, 'hi', q.option_a_hi),
          'B', jsonb_build_object('en', q.option_b_en, 'hi', q.option_b_hi),
          'C', jsonb_build_object('en', q.option_c_en, 'hi', q.option_c_hi),
          'D', jsonb_build_object('en', q.option_d_en, 'hi', q.option_d_hi)
        ),
        'selectedOption', a.selected_option,
        'correctOption', q.correct_option,
        'explanationEn', q.explanation_en,
        'explanationHi', q.explanation_hi,
        'marks', q.marks,
        'negativeMarks', q.negative_marks
      ) order by q.question_number
    ), '[]'::jsonb
  ) into v_questions
  from public.questions q
  left join public.answers a
    on a.question_id = q.id and a.attempt_id = p_attempt_id
  where q.exam_id = v_attempt.exam_id;

  return jsonb_build_object(
    'exam', jsonb_build_object(
      'id', v_exam.id,
      'title', v_exam.title,
      'totalQuestions', v_exam.total_questions,
      'totalMarks', v_exam.total_marks
    ),
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'status', v_attempt.status,
      'startedAt', v_attempt.started_at,
      'submittedAt', v_attempt.submitted_at,
      'score', v_attempt.score,
      'correctCount', v_attempt.correct_count,
      'wrongCount', v_attempt.wrong_count,
      'unansweredCount', v_attempt.unanswered_count,
      'percentage', v_attempt.percentage,
      'timeTakenSeconds', v_attempt.time_taken_seconds,
      'rank', v_rank,
      'participants', v_participants
    ),
    'questions', v_questions
  );
end;
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "exams_public_read"
on public.exams for select
to anon, authenticated
using (is_published = true or public.is_admin(auth.uid()));

create policy "exams_admin_insert"
on public.exams for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "exams_admin_update"
on public.exams for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "exams_admin_delete"
on public.exams for delete
to authenticated
using (public.is_admin(auth.uid()));

create policy "questions_admin_only"
on public.questions for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "attempts_owner_or_admin_read"
on public.attempts for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

create policy "answers_owner_or_admin_read"
on public.answers for select
to authenticated
using (
  exists (
    select 1 from public.attempts a
    where a.id = attempt_id
      and (a.student_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

-- Tighten access to the questions table because it contains correct_option.
revoke all on public.questions from anon;
revoke all on public.questions from authenticated;
grant all on public.questions to service_role;

grant select on public.profiles to authenticated;
grant select on public.exams to anon, authenticated;
grant select on public.attempts to authenticated;
grant select on public.answers to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

revoke execute on function public.start_exam(uuid) from public, anon;
revoke execute on function public.save_answer(uuid, uuid, text, boolean) from public, anon;
revoke execute on function public.submit_attempt(uuid, boolean) from public, anon;
revoke execute on function public.get_attempt_session(uuid) from public, anon;
revoke execute on function public.get_attempt_result(uuid) from public, anon;

grant execute on function public.start_exam(uuid) to authenticated;
grant execute on function public.save_answer(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.submit_attempt(uuid, boolean) to authenticated, service_role;
grant execute on function public.get_attempt_session(uuid) to authenticated;
grant execute on function public.get_attempt_result(uuid) to authenticated;

-- Optional demo exam can be created from the Admin UI after setup.

-- Atomic bulk import used by the secure admin API.
create or replace function public.admin_import_questions(
  p_exam_id uuid,
  p_questions jsonb,
  p_replace boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam public.exams%rowtype;
  v_start integer := 0;
  v_inserted integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin(auth.uid()) then
    raise exception 'Admin access required';
  end if;

  select * into v_exam from public.exams where id = p_exam_id for update;
  if not found then raise exception 'Exam not found'; end if;
  if jsonb_typeof(p_questions) <> 'array' then raise exception 'Questions payload must be an array'; end if;

  if p_replace then
    delete from public.questions where exam_id = p_exam_id;
  else
    select coalesce(max(question_number), 0) into v_start from public.questions where exam_id = p_exam_id;
  end if;

  insert into public.questions (
    exam_id, question_number, subject, question_en, question_hi,
    option_a_en, option_a_hi, option_b_en, option_b_hi,
    option_c_en, option_c_hi, option_d_en, option_d_hi,
    correct_option, explanation_en, explanation_hi, marks, negative_marks
  )
  select
    p_exam_id,
    case
      when p_replace then coalesce(nullif((e.value ->> 'question_number'), '')::integer, e.ord::integer)
      else v_start + e.ord::integer
    end,
    coalesce(nullif(e.value ->> 'subject', ''), 'General'),
    e.value ->> 'question_en', nullif(e.value ->> 'question_hi', ''),
    e.value ->> 'option_a_en', nullif(e.value ->> 'option_a_hi', ''),
    e.value ->> 'option_b_en', nullif(e.value ->> 'option_b_hi', ''),
    e.value ->> 'option_c_en', nullif(e.value ->> 'option_c_hi', ''),
    e.value ->> 'option_d_en', nullif(e.value ->> 'option_d_hi', ''),
    upper(e.value ->> 'correct_option'),
    nullif(e.value ->> 'explanation_en', ''), nullif(e.value ->> 'explanation_hi', ''),
    coalesce(nullif(e.value ->> 'marks', '')::numeric, v_exam.default_marks),
    coalesce(nullif(e.value ->> 'negative_marks', '')::numeric, v_exam.default_negative_marks)
  from jsonb_array_elements(p_questions) with ordinality as e(value, ord);

  get diagnostics v_inserted = row_count;

  update public.exams
  set
    total_questions = (select count(*) from public.questions where exam_id = p_exam_id),
    total_marks = (select coalesce(sum(marks), 0) from public.questions where exam_id = p_exam_id),
    updated_at = now()
  where id = p_exam_id;

  return jsonb_build_object('inserted', v_inserted, 'replaced', p_replace);
end;
$$;

revoke execute on function public.admin_import_questions(uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.admin_import_questions(uuid, jsonb, boolean) to service_role;

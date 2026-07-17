-- ============================================================================
-- TogetherGoals — schema
-- Run this FIRST in the Supabase SQL editor, then policies.sql, then seed.sql.
-- Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default 'Friend',
  email      text,
  avatar_url text,
  xp         integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- couples --
-- A short, human-readable invite code. Generated server-side so two clients
-- signing up at the same instant can never collide on it.
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 6);
$$;

create table if not exists public.couples (
  id                 uuid primary key default gen_random_uuid(),
  invite_code        text unique not null default public.generate_invite_code(),
  created_by         uuid not null references auth.users (id) on delete cascade,
  relationship_since date,
  created_at         timestamptz not null default now()
);

create table if not exists public.couple_members (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  -- One couple per person, and a person can't join the same couple twice.
  unique (user_id)
);

create index if not exists couple_members_couple_idx on public.couple_members (couple_id);

-- Two people. That's the whole product — so the database enforces it, not the UI.
create or replace function public.enforce_couple_size()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'This couple is full — only two people allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists couple_members_max_two on public.couple_members;
create trigger couple_members_max_two
  before insert on public.couple_members
  for each row execute function public.enforce_couple_size();

-- -------------------------------------------------------------- categories --
create table if not exists public.categories (
  id     text primary key,
  name   text not null,
  icon   text not null,
  module text not null check (module in ('health', 'career', 'daily')),
  "group" text
);

-- ------------------------------------------------------------------- goals --
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  couple_id   uuid references public.couples (id) on delete set null,
  category_id text references public.categories (id),
  module      text not null check (module in ('health', 'career', 'daily')),
  title       text not null,
  description text default '',
  target      numeric not null check (target > 0),
  unit        text default 'times',
  current     numeric not null default 0 check (current >= 0),
  deadline    date,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  difficulty  text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  notes       text default '',
  status      text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists goals_user_idx   on public.goals (user_id);
create index if not exists goals_couple_idx on public.goals (couple_id);

-- ----------------------------------------------------------- goal_progress --
-- One row per goal per day. This table is the source of truth for streaks,
-- the heatmap and every chart — `goals.current` is only a cached "today".
create table if not exists public.goal_progress (
  id      uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date    date not null default current_date,
  value   numeric not null default 0 check (value >= 0),
  unique (goal_id, date)
);

create index if not exists goal_progress_user_date_idx on public.goal_progress (user_id, date);

-- ---------------------------------------------------------- activity_feed --
create table if not exists public.activity_feed (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null default 'goal_completed',
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_couple_idx on public.activity_feed (couple_id, created_at desc);

-- --------------------------------------------------------- weekly_reports --
-- Optional snapshots. The app computes reports live from goal_progress; this
-- table is here for history you want frozen (e.g. emailing a Monday summary).
create table if not exists public.weekly_reports (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  week_start     date not null,
  completion_pct integer not null default 0,
  health_score   integer not null default 0,
  career_score   integer not null default 0,
  combined_score integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ------------------------------------------------------------ achievements --
create table if not exists public.achievements (
  key         text primary key,
  emoji       text not null,
  title       text not null,
  description text not null
);

create table if not exists public.user_achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  achievement_key text not null references public.achievements (key) on delete cascade,
  earned_at       timestamptz not null default now(),
  unique (user_id, achievement_key)
);

-- ============================================================================
-- Functions
-- ============================================================================

-- New signup -> profile row. Runs as the definer so it can write to a table the
-- brand-new user has no session for yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membership check used by every RLS policy.
-- SECURITY DEFINER is essential here: without it, a policy on couple_members that
-- queries couple_members would recurse infinitely.
create or replace function public.is_couple_member(target_couple uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = target_couple
      and user_id = auth.uid()
  );
$$;

-- The couple this user belongs to (null if unpaired).
create or replace function public.my_couple_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = auth.uid() limit 1;
$$;

-- ---------------------------------------------------------- log_progress --
-- The single write path for progress. Counter, progress row, XP award and the
-- activity feed all move together in one transaction, so a client that dies
-- mid-request can never leave XP granted but the counter unmoved.
create or replace function public.log_progress(
  p_goal_id uuid,
  p_date    date,
  p_value   numeric
)
returns public.goals
language plpgsql
security invoker  -- RLS still applies: you can only write your own goals.
set search_path = public
as $$
declare
  v_goal        public.goals;
  v_was_done    boolean;
  v_now_done    boolean;
  v_row_value   numeric;
  v_xp          integer;
  v_name        text;
begin
  select * into v_goal from public.goals where id = p_goal_id;
  if not found then
    raise exception 'Goal not found';
  end if;

  v_was_done := v_goal.current >= v_goal.target;
  v_now_done := p_value >= v_goal.target;

  -- Career goals accumulate, so their daily row records *today's* activity rather
  -- than the running total.
  if v_goal.module = 'career' then
    select coalesce(value, 0) + 1 into v_row_value
    from public.goal_progress
    where goal_id = p_goal_id and date = p_date;
    v_row_value := coalesce(v_row_value, 1);
  else
    v_row_value := p_value;
  end if;

  update public.goals
     set current = p_value,
         status = case
                    when module <> 'career' then status
                    when p_value >= target  then 'completed'
                    when p_value > 0        then 'in_progress'
                    else 'pending'
                  end
   where id = p_goal_id
  returning * into v_goal;

  insert into public.goal_progress (goal_id, user_id, date, value)
  values (p_goal_id, v_goal.user_id, p_date, v_row_value)
  on conflict (goal_id, date) do update set value = excluded.value;

  -- XP is awarded once, on the transition into "done".
  if v_now_done and not v_was_done then
    v_xp := case v_goal.difficulty
              when 'easy' then 10
              when 'hard' then 35
              else 20
            end;

    update public.profiles
       set xp = xp + v_xp
     where id = v_goal.user_id
    returning name into v_name;

    if v_goal.couple_id is not null then
      insert into public.activity_feed (couple_id, user_id, type, message)
      values (
        v_goal.couple_id,
        v_goal.user_id,
        'goal_completed',
        v_name || ' completed ' || v_goal.title
      );
    end if;
  end if;

  return v_goal;
end;
$$;

-- ------------------------------------------------------ delete_own_account --
-- The anon client can't touch auth.users, so deletion goes through a definer
-- function that only ever deletes the caller. Cascades clear everything else.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ============================================================================
-- Realtime — so a goal ticked off on one phone lands on the other instantly.
-- ============================================================================
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.goal_progress;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.couple_members;

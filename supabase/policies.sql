-- ============================================================================
-- TogetherGoals — Row Level Security
-- Run this AFTER schema.sql.
--
-- The rule, in one sentence: you can write your own rows, and you can read your
-- own rows plus your partner's. Nobody else can see anything.
--
-- Every "can my partner see this?" check goes through is_couple_member(), which is
-- SECURITY DEFINER — that's what stops the couple_members policy recursing into itself.
-- ============================================================================

alter table public.profiles          enable row level security;
alter table public.couples           enable row level security;
alter table public.couple_members    enable row level security;
alter table public.categories        enable row level security;
alter table public.goals             enable row level security;
alter table public.goal_progress     enable row level security;
alter table public.activity_feed     enable row level security;
alter table public.weekly_reports    enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- ---------------------------------------------------------------- profiles --
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

-- Your partner's name, avatar and XP — that's what makes the couple view work.
drop policy if exists "read partner profile" on public.profiles;
create policy "read partner profile" on public.profiles
  for select using (
    exists (
      select 1 from public.couple_members m
      where m.user_id = profiles.id
        and public.is_couple_member(m.couple_id)
    )
  );

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());

-- ----------------------------------------------------------------- couples --
-- Anyone signed in may look a couple up by its invite code — that's how joining
-- works. They still can't read a single row of that couple's *data*.
drop policy if exists "read couples" on public.couples;
create policy "read couples" on public.couples
  for select to authenticated using (true);

drop policy if exists "create couple" on public.couples;
create policy "create couple" on public.couples
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "update own couple" on public.couples;
create policy "update own couple" on public.couples
  for update using (public.is_couple_member(id)) with check (public.is_couple_member(id));

-- ---------------------------------------------------------- couple_members --
drop policy if exists "read own membership" on public.couple_members;
create policy "read own membership" on public.couple_members
  for select using (user_id = auth.uid() or public.is_couple_member(couple_id));

drop policy if exists "join a couple" on public.couple_members;
create policy "join a couple" on public.couple_members
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "leave a couple" on public.couple_members;
create policy "leave a couple" on public.couple_members
  for delete using (user_id = auth.uid());

-- -------------------------------------------------------------- categories --
drop policy if exists "read categories" on public.categories;
create policy "read categories" on public.categories
  for select to authenticated using (true);

-- ------------------------------------------------------------------- goals --
-- Read your partner's goals; write only your own. Nobody edits anyone else's plan.
drop policy if exists "read couple goals" on public.goals;
create policy "read couple goals" on public.goals
  for select using (
    user_id = auth.uid()
    or (couple_id is not null and public.is_couple_member(couple_id))
  );

drop policy if exists "insert own goals" on public.goals;
create policy "insert own goals" on public.goals
  for insert with check (user_id = auth.uid());

drop policy if exists "update own goals" on public.goals;
create policy "update own goals" on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "delete own goals" on public.goals;
create policy "delete own goals" on public.goals
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------- goal_progress --
drop policy if exists "read couple progress" on public.goal_progress;
create policy "read couple progress" on public.goal_progress
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.goals g
      where g.id = goal_progress.goal_id
        and g.couple_id is not null
        and public.is_couple_member(g.couple_id)
    )
  );

drop policy if exists "write own progress" on public.goal_progress;
create policy "write own progress" on public.goal_progress
  for insert with check (user_id = auth.uid());

drop policy if exists "update own progress" on public.goal_progress;
create policy "update own progress" on public.goal_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "delete own progress" on public.goal_progress;
create policy "delete own progress" on public.goal_progress
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------- activity_feed --
drop policy if exists "read couple activity" on public.activity_feed;
create policy "read couple activity" on public.activity_feed
  for select using (public.is_couple_member(couple_id));

drop policy if exists "write own activity" on public.activity_feed;
create policy "write own activity" on public.activity_feed
  for insert with check (user_id = auth.uid() and public.is_couple_member(couple_id));

-- ---------------------------------------------------------- weekly_reports --
drop policy if exists "read couple reports" on public.weekly_reports;
create policy "read couple reports" on public.weekly_reports
  for select using (user_id = auth.uid() or public.is_couple_member(couple_id));

drop policy if exists "write own reports" on public.weekly_reports;
create policy "write own reports" on public.weekly_reports
  for insert with check (user_id = auth.uid());

drop policy if exists "update own reports" on public.weekly_reports;
create policy "update own reports" on public.weekly_reports
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ achievements --
drop policy if exists "read achievements" on public.achievements;
create policy "read achievements" on public.achievements
  for select to authenticated using (true);

drop policy if exists "read couple achievements" on public.user_achievements;
create policy "read couple achievements" on public.user_achievements
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.couple_members m
      where m.user_id = user_achievements.user_id
        and public.is_couple_member(m.couple_id)
    )
  );

drop policy if exists "earn own achievements" on public.user_achievements;
create policy "earn own achievements" on public.user_achievements
  for insert with check (user_id = auth.uid());

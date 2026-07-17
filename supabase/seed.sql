-- ============================================================================
-- TogetherGoals — reference data
-- Run this LAST (after schema.sql and policies.sql).
-- These ids match src/data/catalog.js exactly — keep the two in step.
-- ============================================================================

insert into public.categories (id, name, icon, module, "group") values
  ('water',         'Water',            '💧',  'health', 'Food'),
  ('calories',      'Calories',         '🔥',  'health', 'Food'),
  ('protein',       'Protein',          '🍗',  'health', 'Food'),
  ('fruits',        'Fruits',           '🍎',  'health', 'Food'),
  ('vegetables',    'Vegetables',       '🥦',  'health', 'Food'),
  ('healthy_meals', 'Healthy Meals',    '🥗',  'health', 'Food'),
  ('cheat_meals',   'Cheat Meals',      '🍕',  'health', 'Food'),
  ('running',       'Running',          '🏃',  'health', 'Workout'),
  ('cycling',       'Cycling',          '🚴',  'health', 'Workout'),
  ('gym',           'Gym',              '🏋️',  'health', 'Workout'),
  ('yoga',          'Yoga',             '🧘',  'health', 'Workout'),
  ('meditation',    'Meditation',       '🕯️',  'health', 'Workout'),
  ('stretching',    'Stretching',       '🤸',  'health', 'Workout'),
  ('course',        'Course',           '🎓',  'career', 'Learning'),
  ('leetcode',      'Leetcode',         '🧩',  'career', 'Practice'),
  ('reading',       'Reading',          '📚',  'career', 'Learning'),
  ('jobs',          'Job Applications', '📮',  'career', 'Search'),
  ('project',       'Project',          '🛠️',  'career', 'Building'),
  ('interview',     'Interview Prep',   '🎤',  'career', 'Practice'),
  ('ai',            'Learn AI',         '🤖',  'career', 'Learning'),
  ('habit',         'Habit',            '✨',  'daily',  'Habits'),
  ('mindfulness',   'Mindfulness',      '🌙',  'daily',  'Habits'),
  ('custom',        'Custom',           '🎯',  'daily',  'Habits')
on conflict (id) do update
  set name = excluded.name,
      icon = excluded.icon,
      module = excluded.module,
      "group" = excluded."group";

insert into public.achievements (key, emoji, title, description) values
  ('first_step',       '🌱', 'First Step',        'Complete your very first goal.'),
  ('fitness_freak',    '🏃', 'Fitness Freak',     'Complete 25 workout goals.'),
  ('coding_beast',     '💻', 'Coding Beast',      'Complete 25 career goals.'),
  ('healthy_hero',     '🥗', 'Healthy Hero',      'Complete 25 health goals.'),
  ('week_warrior',     '⚡', 'Week Warrior',      'Hit a 7 day streak.'),
  ('streak_30',        '🔥', '30 Day Streak',     'Show up 30 days in a row.'),
  ('perfect_week',     '❤️', 'Perfect Week',      'Score 100% every day for a full week.'),
  ('couple_champions', '👑', 'Couple Champions',  'Both partners finish all daily goals on the same day.'),
  ('century',          '💯', 'Centurion',         'Complete 100 goals in total.'),
  ('level_10',         '🌟', 'Rising Star',       'Reach level 10.')
on conflict (key) do update
  set emoji = excluded.emoji,
      title = excluded.title,
      description = excluded.description;

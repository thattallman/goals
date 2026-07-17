/**
 * The starter catalogue: categories, plus the preset goals we offer in the "quick add"
 * pickers on Health, Career and Daily Goals. Kept out of the database so both repos —
 * agree on exactly one source of truth.
 */

export const CATEGORIES = [
  // Health · food
  { id: 'water', name: 'Water', icon: '💧', module: 'health', group: 'Food' },
  { id: 'calories', name: 'Calories', icon: '🔥', module: 'health', group: 'Food' },
  { id: 'protein', name: 'Protein', icon: '🍗', module: 'health', group: 'Food' },
  { id: 'fruits', name: 'Fruits', icon: '🍎', module: 'health', group: 'Food' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥦', module: 'health', group: 'Food' },
  { id: 'healthy_meals', name: 'Healthy Meals', icon: '🥗', module: 'health', group: 'Food' },
  { id: 'cheat_meals', name: 'Cheat Meals', icon: '🍕', module: 'health', group: 'Food' },
  // Health · workout
  { id: 'running', name: 'Running', icon: '🏃', module: 'health', group: 'Workout' },
  { id: 'cycling', name: 'Cycling', icon: '🚴', module: 'health', group: 'Workout' },
  { id: 'gym', name: 'Gym', icon: '🏋️', module: 'health', group: 'Workout' },
  { id: 'yoga', name: 'Yoga', icon: '🧘', module: 'health', group: 'Workout' },
  { id: 'meditation', name: 'Meditation', icon: '🕯️', module: 'health', group: 'Workout' },
  { id: 'stretching', name: 'Stretching', icon: '🤸', module: 'health', group: 'Workout' },
  // Career
  { id: 'course', name: 'Course', icon: '🎓', module: 'career', group: 'Learning' },
  { id: 'leetcode', name: 'Leetcode', icon: '🧩', module: 'career', group: 'Practice' },
  { id: 'reading', name: 'Reading', icon: '📚', module: 'career', group: 'Learning' },
  { id: 'jobs', name: 'Job Applications', icon: '📮', module: 'career', group: 'Search' },
  { id: 'project', name: 'Project', icon: '🛠️', module: 'career', group: 'Building' },
  { id: 'interview', name: 'Interview Prep', icon: '🎤', module: 'career', group: 'Practice' },
  { id: 'ai', name: 'Learn AI', icon: '🤖', module: 'career', group: 'Learning' },
  // Daily habits
  { id: 'habit', name: 'Habit', icon: '✨', module: 'daily', group: 'Habits' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🌙', module: 'daily', group: 'Habits' },
  { id: 'custom', name: 'Custom', icon: '🎯', module: 'daily', group: 'Habits' },
]

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES.at(-1)

export const categoriesFor = (module) => CATEGORIES.filter((c) => c.module === module)

/** Presets shown as one-tap "add" chips. Targets are sensible defaults, all editable. */
export const PRESETS = {
  health: [
    { title: 'Drink 3L Water', category_id: 'water', target: 3, unit: 'L' },
    { title: 'Hit Calorie Target', category_id: 'calories', target: 2000, unit: 'kcal' },
    { title: 'Eat 100g Protein', category_id: 'protein', target: 100, unit: 'g' },
    { title: 'Eat 5 Fruits', category_id: 'fruits', target: 5, unit: 'servings' },
    { title: 'Eat 3 Vegetables', category_id: 'vegetables', target: 3, unit: 'servings' },
    { title: 'Healthy Meals', category_id: 'healthy_meals', target: 3, unit: 'meals' },
    { title: 'Limit Cheat Meals', category_id: 'cheat_meals', target: 1, unit: 'meals' },
    { title: 'Run 5km', category_id: 'running', target: 5, unit: 'km' },
    { title: 'Cycle 10km', category_id: 'cycling', target: 10, unit: 'km' },
    { title: 'Gym Session', category_id: 'gym', target: 1, unit: 'session' },
    { title: 'Yoga 20 min', category_id: 'yoga', target: 20, unit: 'min' },
    { title: 'Meditate 10 min', category_id: 'meditation', target: 10, unit: 'min' },
    { title: 'Stretch 15 min', category_id: 'stretching', target: 15, unit: 'min' },
  ],
  career: [
    { title: 'Complete React Course', category_id: 'course', target: 40, unit: 'lessons' },
    { title: 'Solve Leetcode', category_id: 'leetcode', target: 100, unit: 'problems' },
    { title: 'Read a Book', category_id: 'reading', target: 300, unit: 'pages' },
    { title: 'Apply to Jobs', category_id: 'jobs', target: 50, unit: 'applications' },
    { title: 'Build a Project', category_id: 'project', target: 20, unit: 'tasks' },
    { title: 'Interview Practice', category_id: 'interview', target: 10, unit: 'sessions' },
    { title: 'Learn AI', category_id: 'ai', target: 30, unit: 'hours' },
  ],
  daily: [
    { title: 'No Sugar', category_id: 'habit', target: 1, unit: 'day' },
    { title: 'Read 20 Pages', category_id: 'habit', target: 20, unit: 'pages' },
    { title: 'Sleep 8 Hours', category_id: 'habit', target: 8, unit: 'hours' },
    { title: '10,000 Steps', category_id: 'habit', target: 10000, unit: 'steps' },
    { title: 'Journal', category_id: 'mindfulness', target: 1, unit: 'entry' },
    { title: 'No Phone Before Bed', category_id: 'mindfulness', target: 1, unit: 'day' },
  ],
}

export const MODULES = {
  health: { label: 'Health', emoji: '🥗' },
  career: { label: 'Career', emoji: '💻' },
  daily: { label: 'Daily', emoji: '🎯' },
}

export const PRIORITIES = ['low', 'medium', 'high']
export const DIFFICULTIES = ['easy', 'medium', 'hard']
export const STATUSES = ['pending', 'in_progress', 'completed']

export const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Copy,
  MoreHorizontal,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Archive,
  ArchiveRestore,
  CalendarDays,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { pct } from '../../lib/format'
import { categoryById } from '../../data/catalog'
import { ProgressBar } from '../ui/Progress'
import { Badge } from '../ui/Feedback'
import { celebrate } from '../../lib/confetti'

const PRIORITY_TONE = { low: 'slate', medium: 'amber', high: 'red' }
const STATUS_TONE = { pending: 'slate', in_progress: 'brand', completed: 'mint' }

/** Menu of the destructive-ish actions, kept out of the card's main tap area. */
function GoalMenu({ goal, onEdit, onDuplicate, onArchive, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const items = [
    { label: 'Edit', icon: Pencil, onClick: () => onEdit(goal) },
    { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate(goal) },
    {
      label: goal.archived ? 'Restore' : 'Archive',
      icon: goal.archived ? ArchiveRestore : Archive,
      onClick: () => onArchive(goal),
    },
    { label: 'Delete', icon: Trash2, onClick: () => onDelete(goal), danger: true },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${goal.title}`}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <MoreHorizontal className="size-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lift dark:border-white/10 dark:bg-slate-900"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                  item.danger
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * One goal, everywhere. Health, Career and Daily all render this — the module only
 * changes the step size and whether the counter is cumulative.
 */
export function GoalCard({ goal, onSetValue, onEdit, onDuplicate, onArchive, onDelete, index = 0 }) {
  const category = categoryById(goal.category_id)
  const percent = pct(goal.current, goal.target)
  const complete = percent >= 100
  const isCareer = goal.module === 'career'

  // The step has to suit the unit: a gym session is 1 or nothing, 3L of water wants
  // halves, and 10,000 steps would take all day at +1.
  const step =
    goal.target <= 2
      ? 1
      : goal.target <= 5
        ? 0.5
        : goal.target <= 50
          ? 1
          : Math.round(goal.target / 20)

  const bump = (delta) => {
    const next = Math.max(0, Math.round((goal.current + delta) * 10) / 10)
    if (next >= goal.target && goal.current < goal.target) celebrate()
    onSetValue(goal, next)
  }

  const complete_ = () => {
    if (!complete) celebrate()
    onSetValue(goal, goal.target)
  }

  const overdue =
    goal.deadline && !complete && new Date(goal.deadline) < new Date(new Date().toDateString())

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: Math.min(index * 0.04, 0.3) }}
      className={cn(
        'glass group relative overflow-hidden rounded-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift',
        complete && 'ring-1 ring-mint-500/40',
        goal.archived && 'opacity-60',
      )}
    >
      {/* Completed cards get a subtle emerald wash — celebration without shouting. */}
      {complete && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-mint-500/8 to-transparent" />
      )}

      <div className="relative flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-blush-100 text-xl dark:from-brand-500/15 dark:to-blush-500/15"
          aria-hidden="true"
        >
          {category.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'truncate font-semibold text-slate-900 dark:text-white',
                complete && 'text-mint-700 dark:text-mint-300',
              )}
            >
              {goal.title}
            </h3>
            <GoalMenu
              goal={goal}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          </div>

          {goal.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {goal.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isCareer && <Badge tone={STATUS_TONE[goal.status]}>{goal.status.replace('_', ' ')}</Badge>}
            {goal.priority !== 'medium' && (
              <Badge tone={PRIORITY_TONE[goal.priority]}>{goal.priority} priority</Badge>
            )}
            {goal.deadline && (
              <Badge tone={overdue ? 'red' : 'slate'}>
                <CalendarDays className="size-3" aria-hidden="true" />
                {new Date(goal.deadline).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                })}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
            {goal.current}
            <span className="font-normal text-slate-400">
              {' '}
              / {goal.target} {goal.unit}
            </span>
          </span>
          <span
            className={cn(
              'tabular-nums text-xs font-bold',
              complete ? 'text-mint-600 dark:text-mint-400' : 'text-slate-400',
            )}
          >
            {percent}%
          </span>
        </div>
        <ProgressBar value={percent} tone={complete ? 'mint' : 'brand'} />
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => bump(-step)}
          disabled={goal.current <= 0}
          aria-label={`Decrease ${goal.title}`}
          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/10"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => bump(step)}
          aria-label={`Increase ${goal.title}`}
          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onSetValue(goal, 0)}
          aria-label={`Reset ${goal.title}`}
          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          <RotateCcw className="size-4" />
        </button>

        <button
          type="button"
          onClick={complete_}
          className={cn(
            'ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition',
            complete
              ? 'bg-mint-500 text-white'
              : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
          )}
        >
          <Check className="size-4" aria-hidden="true" />
          {complete ? 'Done' : 'Complete'}
        </button>
      </div>
    </motion.article>
  )
}

export default GoalCard

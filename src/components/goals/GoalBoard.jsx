import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import { useGoals, useGoalMutations } from '../../hooks/useGoals'
import { PRESETS, categoryById } from '../../data/catalog'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import { Button } from '../ui/Button'
import { CardSkeleton, EmptyState } from '../ui/Feedback'
import { Modal } from '../ui/Modal'
import { celebrateTogether } from '../../lib/confetti'
import { useAuth } from '../../context/AuthContext'
import { useCoupleProgress } from '../../hooks/useProgress'
import { useToast } from '../../context/ToastContext'

/** One-tap chips so a new user isn't staring at a blank page wondering what to type. */
function PresetPicker({ open, onClose, module, onPick }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick add"
      description="Start from a preset — you can edit everything afterwards."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {PRESETS[module].map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => onPick(preset)}
            className="glass flex items-center gap-3 rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-blush-100 text-lg dark:from-brand-500/15 dark:to-blush-500/15">
              {categoryById(preset.category_id).icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                {preset.title}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {preset.target} {preset.unit}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

/**
 * The shared engine behind Daily Goals, Health and Career: list, presets, the add/edit
 * form, and every mutation wired to optimistic updates. Pages above it only decide which
 * module they're showing and how to group it.
 */
export function GoalBoard({ module, groupBy, emptyCopy, showArchived = false }) {
  const { goals, isLoading } = useGoals(module)
  const mutations = useGoalMutations()
  const { partner } = useAuth()
  const { yourGoals, partnerGoals } = useCoupleProgress()
  const toast = useToast()

  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const visible = useMemo(
    () => goals.filter((g) => (showArchived ? true : !g.archived)),
    [goals, showArchived],
  )

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: 'all', label: null, goals: visible }]
    return groupBy(visible)
  }, [visible, groupBy])

  /**
   * The moment worth building the whole app for: both partners finish everything today.
   * Checked after every write, fired at most once per day.
   */
  const maybeCelebrateTogether = () => {
    if (!partner) return
    const allDone = (list) =>
      list.length > 0 && list.filter((g) => !g.archived).every((g) => g.current >= g.target)

    if (allDone(yourGoals) && allDone(partnerGoals)) {
      const key = `tg.celebrated.${new Date().toDateString()}`
      if (window.localStorage.getItem(key)) return
      window.localStorage.setItem(key, '1')
      celebrateTogether()
      toast.achievement('You both finished everything today. Perfect day together ❤️', {
        title: 'Couple Champions',
      })
    }
  }

  const setValue = (goal, value) => {
    mutations.setValue.mutate(
      { goalId: goal.id, value },
      { onSuccess: maybeCelebrateTogether },
    )
  }

  const submit = (values) => {
    if (values.id) mutations.updateGoal.mutate(values)
    else mutations.createGoal.mutate(values)
    setFormOpen(false)
    setEditing(null)
  }

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New goal
        </Button>
        <Button variant="secondary" onClick={() => setPresetsOpen(true)}>
          <Sparkles className="size-4" aria-hidden="true" />
          Quick add
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          emoji={emptyCopy.emoji}
          title={emptyCopy.title}
          description={emptyCopy.description}
          action="Add your first goal"
          onAction={() => setPresetsOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              {group.label && (
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {group.label}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums dark:bg-white/10">
                    {group.goals.length}
                  </span>
                </h2>
              )}
              <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {group.goals.map((goal, i) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      index={i}
                      onSetValue={setValue}
                      onEdit={(g) => {
                        setEditing(g)
                        setFormOpen(true)
                      }}
                      onDuplicate={(g) => mutations.duplicateGoal.mutate(g)}
                      onArchive={(g) =>
                        mutations.archiveGoal.mutate({ id: g.id, archived: !g.archived })
                      }
                      onDelete={setConfirmDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          ))}
        </div>
      )}

      {/* Floating add button — thumb-reachable on mobile, hidden on desktop. */}
      <motion.button
        type="button"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        whileTap={{ scale: 0.92 }}
        aria-label="Add a new goal"
        className="fixed right-5 bottom-24 z-40 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-blush-500 text-white shadow-glow lg:hidden"
      >
        <Plus className="size-6" />
      </motion.button>

      <GoalForm
        open={formOpen}
        goal={editing}
        module={module}
        saving={mutations.createGoal.isPending || mutations.updateGoal.isPending}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={submit}
      />

      <PresetPicker
        open={presetsOpen}
        module={module}
        onClose={() => setPresetsOpen(false)}
        onPick={(preset) => {
          mutations.createGoal.mutate({ ...preset, module, status: 'in_progress' })
          setPresetsOpen(false)
        }}
      />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        size="sm"
        title="Delete this goal?"
        description={`"${confirmDelete?.title}" and its history will be removed. This can't be undone.`}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={mutations.deleteGoal.isPending}
            onClick={() => {
              mutations.deleteGoal.mutate(confirmDelete.id)
              setConfirmDelete(null)
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default GoalBoard

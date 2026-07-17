import { useForm } from 'react-hook-form'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Field'
import {
  DIFFICULTIES,
  PRIORITIES,
  STATUSES,
  STATUS_LABEL,
  categoriesFor,
} from '../../data/catalog'

const options = (values, labels = {}) =>
  values.map((v) => ({ value: v, label: labels[v] ?? v[0].toUpperCase() + v.slice(1) }))

/**
 * Add / edit dialog for every module. `goal` present = edit, absent = create.
 * Validation lives in the register() rules — one source of truth, inline messages.
 */
export function GoalForm({ open, onClose, onSubmit, goal, module = 'daily', saving }) {
  const editing = Boolean(goal?.id)
  const categories = categoriesFor(module)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    values: {
      title: goal?.title ?? '',
      description: goal?.description ?? '',
      category_id: goal?.category_id ?? categories[0]?.id,
      target: goal?.target ?? 1,
      unit: goal?.unit ?? 'times',
      deadline: goal?.deadline ?? '',
      priority: goal?.priority ?? 'medium',
      difficulty: goal?.difficulty ?? 'medium',
      status: goal?.status ?? 'pending',
      notes: goal?.notes ?? '',
    },
  })

  const submit = handleSubmit((values) => {
    onSubmit({
      ...(editing ? { id: goal.id } : {}),
      ...values,
      module,
      target: Number(values.target),
      deadline: values.deadline || null,
    })
    reset()
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit goal' : 'New goal'}
      description={
        editing ? 'Tweak the details and save.' : 'What are the two of you working towards?'
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Title"
          required
          placeholder="e.g. Drink 3L of water"
          error={errors.title?.message}
          {...register('title', {
            required: 'Give your goal a name',
            maxLength: { value: 80, message: 'Keep it under 80 characters' },
          })}
        />

        <Textarea
          label="Description"
          rows={2}
          placeholder="Optional — why does this matter to you?"
          {...register('description')}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Category"
            options={categories.map((c) => ({ value: c.id, label: `${c.icon}  ${c.name}` }))}
            {...register('category_id')}
          />
          <Input
            label="Target"
            type="number"
            step="any"
            min="0.1"
            required
            error={errors.target?.message}
            {...register('target', {
              required: 'Set a target',
              min: { value: 0.1, message: 'Must be greater than zero' },
              valueAsNumber: true,
            })}
          />
          <Input label="Unit" placeholder="reps, km, pages…" {...register('unit')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Priority" options={options(PRIORITIES)} {...register('priority')} />
          <Select label="Difficulty" options={options(DIFFICULTIES)} hint="Harder goals earn more XP" {...register('difficulty')} />
          <Input label="Deadline" type="date" {...register('deadline')} />
        </div>

        {module === 'career' && (
          <Select label="Status" options={options(STATUSES, STATUS_LABEL)} {...register('status')} />
        )}

        <Textarea label="Notes" rows={2} placeholder="Anything you want to remember…" {...register('notes')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? 'Save changes' : 'Create goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default GoalForm

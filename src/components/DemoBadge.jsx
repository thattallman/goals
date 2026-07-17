import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import repo from '../data'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

/**
 * Honest signposting: in demo mode the data is seeded and local, and we say so rather
 * than letting someone believe their partner is real. Also the fastest way to get a
 * clean slate while exploring.
 */
export function DemoBadge() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
      >
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span>
          <span className="block text-xs font-semibold text-amber-900 dark:text-amber-200">
            Demo mode
          </span>
          <span className="block text-[11px] leading-snug text-amber-700 dark:text-amber-300/80">
            Sample data, stored locally. Connect Firebase to go live.
          </span>
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="You're in demo mode"
        description="TogetherGoals runs without a backend so you can explore it immediately."
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Everything you see — Riya, the streaks, a year of history — is seeded sample data
            living in your browser's local storage. Nothing is sent anywhere.
          </p>
          <p>
            To go live, create a Firebase project, paste <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">firestore.rules</code> into
            its console, and add your web app config to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">.env</code>. The app switches
            over on the next reload — see <strong>SETUP.md</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Got it
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await repo.resetDemo()
                window.location.reload()
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset demo data
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DemoBadge

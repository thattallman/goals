import { Component } from 'react'
import { Button } from '../components/ui/Button'

/**
 * Per-route error boundary. A chart blowing up on bad data should cost you that page,
 * not the whole app — and it should tell you what happened.
 */
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[TogetherGoals] render error', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 text-5xl" aria-hidden="true">
          🫠
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Something broke on this page
        </h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Your data is safe — this is just the screen. Reloading usually sorts it.
        </p>
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl bg-slate-100 p-3 text-left text-xs text-slate-500 dark:bg-white/5">
          {this.state.error.message}
        </pre>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    )
  }
}

export default ErrorBoundary

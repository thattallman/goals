import { useCallback, useEffect, useState } from 'react'

const KEY = 'tg.notifications'

const DEFAULTS = {
  dailyReminder: false,
  weeklySummary: true,
  partnerActivity: true,
  milestones: true,
  shareProgress: true,
  shareDetails: true,
}

const read = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

/**
 * Notification and privacy preferences.
 *
 * Stored per-device rather than per-account: they're about *this* browser's behaviour
 * (does it pop a notification?), and there's no push backend to sync them to.
 */
export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState(read)

  useEffect(() => {
    window.localStorage.setItem(KEY, JSON.stringify(prefs))
  }, [prefs])

  const setPref = useCallback((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }, [])

  /** Consent is asked for at the moment of enabling, never on page load. */
  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  return { prefs, setPref, requestBrowserPermission }
}

/** Fire a browser notification, but only if this preference is switched on. */
export function notify(prefKey, title, body) {
  const prefs = read()
  if (!prefs[prefKey]) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/favicon.svg' })
}

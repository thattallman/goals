import { useCallback, useEffect, useState } from 'react'

const KEY = 'tg.theme'

const systemPrefersDark = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

const resolve = (theme) => (theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme)

/** Applied before React mounts too (see index.html) so there's no flash of light mode. */
function apply(theme) {
  document.documentElement.classList.toggle('dark', resolve(theme) === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => window.localStorage.getItem(KEY) ?? 'system')

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return undefined

    // Follow the OS while the user hasn't made an explicit choice.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => apply('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  const setTheme = useCallback((next) => {
    window.localStorage.setItem(KEY, next)
    setThemeState(next)
  }, [])

  return { theme, resolved: resolve(theme), setTheme }
}

import { useTheme } from '../../hooks/useTheme'

/**
 * Chart colour system.
 *
 * Three fixed series — You, Partner, Combined — assigned in this order and never
 * recycled, so a colour always means the same person no matter which chart you're on.
 *
 * Both sets were run through the palette validator (lightness band, chroma floor,
 * colour-blind separation, contrast). Dark mode is a *selected* set, not a flipped one:
 * emerald has to go deeper on a dark surface to stay inside the lightness band.
 */
export const SERIES_LIGHT = {
  you: '#7C3AED',
  partner: '#EC4899',
  combined: '#10B981',
}

export const SERIES_DARK = {
  you: '#8B5CF6',
  partner: '#EC4899',
  combined: '#059669',
}

/** Sequential ramp for the heatmap: one hue, light → dark. Never a rainbow. */
export const HEAT_LIGHT = ['#EDE9FE', '#C4B5FD', '#A78BFA', '#7C3AED', '#5B21B6']
export const HEAT_DARK = ['#2E1065', '#4C1D95', '#6D28D9', '#8B5CF6', '#C4B5FD']

export function useChartTheme() {
  const { resolved } = useTheme()
  const dark = resolved === 'dark'
  return {
    dark,
    series: dark ? SERIES_DARK : SERIES_LIGHT,
    heat: dark ? HEAT_DARK : HEAT_LIGHT,
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
    axis: dark ? '#64748b' : '#94a3b8',
    surface: dark ? '#0f172a' : '#ffffff',
    empty: dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
  }
}

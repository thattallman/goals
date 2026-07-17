import { cn } from '../../lib/cn'
import { avatarGradient, initials } from '../../lib/format'

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-2xl',
}

/**
 * Falls back to a deterministic gradient + initials when there's no photo, so the app
 * never shows a grey silhouette. (Storage-backed uploads slot straight into `src`.)
 */
export function Avatar({ name = '', src, size = 'md', className, ring = false }) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white',
        'bg-gradient-to-br',
        avatarGradient(name),
        SIZES[size],
        ring && 'ring-2 ring-white shadow-soft dark:ring-slate-800',
        className,
      )}
      title={name}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name) || '💜'}</span>
      )}
      <span className="sr-only">{name}</span>
    </div>
  )
}

/** Two overlapping avatars — the couple, as one unit. */
export function AvatarPair({ you, partner, size = 'md' }) {
  return (
    <div className="flex -space-x-3">
      <Avatar name={you?.name} src={you?.avatar_url} size={size} ring />
      {partner ? (
        <Avatar name={partner.name} src={partner.avatar_url} size={size} ring />
      ) : (
        <div
          className={cn(
            'grid place-items-center rounded-full border-2 border-dashed border-slate-300 bg-white/60 text-slate-400 dark:border-white/20 dark:bg-white/5',
            SIZES[size],
          )}
          aria-label="No partner yet"
        >
          ?
        </div>
      )}
    </div>
  )
}

export default Avatar

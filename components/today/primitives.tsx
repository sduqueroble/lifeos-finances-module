import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AREA_COLOR, type Area } from '@/lib/today/types'

export function MoonPhase({ level, size = 20, className }: { level: number; size?: number; className?: string }) {
  const f = Math.min(Math.max((level - 1) / 4, 0), 1)
  const c = 10
  const r = 8.5
  const k = r * Math.abs(1 - 2 * f)
  const sweep = f > 0.5 ? 1 : 0

  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className={className}>
      <circle cx={c} cy={c} r={r} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
      {f === 1 ? (
        <circle cx={c} cy={c} r={r} fill="currentColor" />
      ) : f > 0 ? (
        <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${k} ${r} 0 0 ${sweep} ${c} ${c - r} Z`} fill="currentColor" />
      ) : null}
    </svg>
  )
}

export function ProgressRing({
  total,
  done,
  size = 76,
  stroke = 4,
  children,
}: {
  total: number
  done: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const segment = total > 0 ? circumference / total : circumference
  const gap = total > 1 ? Math.min(6, segment * 0.25) : 0
  const complete = total > 0 && done >= total

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {complete && <div aria-hidden className="absolute inset-2 rounded-full bg-primary/20 blur-xl" />}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        {total === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth={1}
            strokeDasharray="2 5"
            className="text-muted-foreground"
          />
        ) : (
          Array.from({ length: total }, (_, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(segment - gap, 0.01)} ${circumference}`}
              strokeDashoffset={-(i * segment + gap / 2)}
              className={cn(
                'transition-[stroke] duration-700 ease-out',
                i < done ? 'stroke-primary' : 'stroke-foreground/10',
              )}
            />
          ))
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  id,
  meta,
  action,
}: {
  eyebrow: string
  title: string
  id: string
  meta?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-2.5 font-serif text-[30px] leading-none tracking-[-0.01em] text-foreground">
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {meta && <div className="text-[13px] tabular-nums text-muted-foreground">{meta}</div>}
        {action}
      </div>
    </div>
  )
}

export function AreaTag({ area }: { area: Area }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-subtle">
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: AREA_COLOR[area] }} />
      {area}
    </span>
  )
}

export function RoundCheck({
  checked,
  onClick,
  label,
  className,
}: {
  checked: boolean
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'group/check relative grid size-[22px] shrink-0 place-items-center rounded-full border transition-all duration-300 ease-out',
        checked
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(70,199,183,0.12)]'
          : 'border-muted-foreground/40 text-transparent hover:border-primary/80 hover:text-primary/50',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" className={checked ? 'check-draw' : undefined} />
      </svg>
    </button>
  )
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

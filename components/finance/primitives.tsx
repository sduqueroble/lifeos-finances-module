'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { category } from '@/lib/finance/categories'
import { formatCOP, formatNumber, parseAmount } from '@/lib/finance/format'
import type { BudgetState } from '@/lib/finance/selectors'
import type { Account, CategoryId } from '@/lib/finance/types'

export function Money({
  value,
  sign,
  compact,
  tone = 'plain',
  className,
}: {
  value: number
  sign?: boolean
  compact?: boolean
  tone?: 'plain' | 'flow'
  className?: string
}) {
  return (
    <span
      className={cn(
        'tabular-nums',
        tone === 'flow' && value > 0 && 'text-primary',
        tone === 'flow' && value < 0 && 'text-foreground',
        className,
      )}
    >
      {formatCOP(value, { sign, compact })}
    </span>
  )
}

/** Serif figure with a quieter currency sign, used for headline amounts. */
export function Figure({ value, sign, className }: { value: number; sign?: boolean; className?: string }) {
  const text = formatCOP(value, { sign })
  const idx = text.indexOf('$')
  return (
    <span className={cn('font-serif tabular-nums tracking-[-0.02em]', className)}>
      {text.slice(0, idx)}
      <span className="mr-[0.04em] align-[0.32em] text-[0.52em] text-subtle">$</span>
      {text.slice(idx + 1)}
    </span>
  )
}

export function CategoryGlyph({ id, className }: { id: CategoryId; className?: string }) {
  const c = category(id)
  return (
    <span
      aria-hidden
      className={cn('grid size-9 shrink-0 place-items-center rounded-full', className)}
      style={{ backgroundColor: `${c.color}17`, boxShadow: `inset 0 0 0 1px ${c.color}2E` }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
    </span>
  )
}

export function CategoryTag({ id }: { id: CategoryId }) {
  const c = category(id)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </span>
  )
}

export function AccountMark({ account, className }: { account: Pick<Account, 'institution' | 'tone'>; className?: string }) {
  const initials = account.institution
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  return (
    <span
      aria-hidden
      className={cn('grid size-10 shrink-0 place-items-center rounded-2xl font-serif text-[17px] leading-none', className)}
      style={{ backgroundColor: `${account.tone}14`, color: account.tone, boxShadow: `inset 0 0 0 1px ${account.tone}2B` }}
    >
      {initials}
    </span>
  )
}

const STATE_FILL: Record<BudgetState, string> = {
  ok: 'bg-primary',
  near: 'bg-warm',
  over: 'bg-destructive',
}

export function ProgressLine({
  ratio,
  state = 'ok',
  pace,
  className,
  thick,
}: {
  ratio: number
  state?: BudgetState
  pace?: number
  className?: string
  thick?: boolean
}) {
  return (
    <div className={cn('relative', className)} aria-hidden>
      <div className={cn('overflow-hidden rounded-full bg-foreground/[0.07]', thick ? 'h-[5px]' : 'h-[3px]')}>
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', STATE_FILL[state])}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
      {pace !== undefined && (
        <span
          className="absolute -top-[3px] h-[calc(100%+6px)] w-px bg-foreground/40"
          style={{ left: `${Math.min(pace, 1) * 100}%` }}
        />
      )}
    </div>
  )
}

export function BudgetRing({
  ratio,
  state,
  size = 76,
  stroke = 4,
  children,
}: {
  ratio: number
  state: BudgetState
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = state === 'over' ? 'stroke-destructive' : state === 'near' ? 'stroke-warm' : 'stroke-primary'
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-foreground/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(Math.min(ratio, 1) * c, 0.01)} ${c}`}
          className={cn('transition-[stroke-dasharray] duration-1000 ease-out', color)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function Sparkline({ values, color, className }: { values: number[]; color: string; className?: string }) {
  const gid = useId()
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 100
  const h = 32
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 6)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('h-10 w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeOpacity="0.75" strokeWidth="1.25" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function PageIntro({
  id,
  kicker,
  title,
  italic,
  description,
  aside,
}: {
  id: string
  kicker: ReactNode
  title: string
  italic?: string
  description?: ReactNode
  aside?: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
      <div className="rise">
        <p className="flex items-center gap-2.5 text-[15px] text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(70,199,183,0.7)]" />
          {kicker}
        </p>
        <h1
          id={id}
          className="mt-5 font-serif text-[52px] leading-[0.92] tracking-[-0.025em] text-foreground sm:text-[68px] lg:text-[84px]"
        >
          <span className="block">{title}</span>
          {italic && <span className="block italic text-[#B4C4D3]">{italic}</span>}
        </h1>
        {description && (
          <p className="mt-6 max-w-[34rem] text-pretty text-[16px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {aside && (
        <div className="rise" style={{ '--d': '120ms' } as React.CSSProperties}>
          {aside}
        </div>
      )}
    </section>
  )
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string
  body: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative flex flex-col items-center px-4 py-14 text-center', className)}>
      <div aria-hidden className="relative mb-7 size-20">
        <span className="absolute inset-0 rounded-full border border-foreground/[0.08]" />
        <span className="absolute inset-[18px] rounded-full border border-dashed border-foreground/[0.12]" />
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70 shadow-[0_0_14px_3px_rgba(70,199,183,0.35)]" />
        <span className="orbit-spin absolute inset-0 [animation-duration:40s]">
          <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/50" />
        </span>
      </div>
      <p className="font-serif text-[28px] italic leading-tight text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-pretty text-[14px] leading-relaxed text-subtle">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function PrimaryButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground shadow-[0_8px_24px_-12px_rgba(70,199,183,0.7)] transition-[background-color,opacity] hover:bg-primary/90 disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function QuietButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--hairline)] transition-colors hover:bg-foreground/[0.05]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-background/40 p-1 shadow-[inset_0_0_0_1px_var(--hairline)]', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
            value === o.value ? 'bg-foreground/[0.09] text-foreground' : 'text-subtle hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export const fieldClass =
  'w-full rounded-xl bg-background/60 px-3.5 py-2.5 text-[14px] text-foreground outline-none shadow-[inset_0_0_0_1px_var(--hairline)] transition-shadow placeholder:text-subtle focus:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.5)] [color-scheme:dark]'

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-2 block text-[12px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-subtle">{hint}</p>}
    </div>
  )
}

export function SelectField({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select {...props} className={cn(fieldClass, 'cursor-pointer appearance-none pr-9')}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  )
}

export function MoneyInput({
  id,
  value,
  onChange,
  size = 'md',
  autoFocus,
  'aria-describedby': describedBy,
}: {
  id: string
  value: number
  onChange: (v: number) => void
  size?: 'md' | 'lg'
  autoFocus?: boolean
  'aria-describedby'?: string
}) {
  const large = size === 'lg'
  return (
    <div
      className={cn(
        'flex items-baseline gap-2 rounded-2xl bg-background/60 shadow-[inset_0_0_0_1px_var(--hairline)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.5),0_0_0_4px_rgba(70,199,183,0.06)]',
        large ? 'px-5 py-4' : 'px-3.5 py-2.5',
      )}
    >
      <span aria-hidden className={cn('text-subtle', large ? 'font-serif text-[26px]' : 'text-[14px]')}>
        $
      </span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-describedby={describedBy}
        value={value ? formatNumber(value) : ''}
        placeholder="0"
        onChange={(e) => onChange(parseAmount(e.target.value))}
        className={cn(
          'min-w-0 flex-1 bg-transparent tabular-nums text-foreground outline-none placeholder:text-subtle/60',
          large ? 'font-serif text-[40px] leading-none tracking-[-0.02em]' : 'text-[14px]',
        )}
      />
      <span aria-hidden className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
        COP
      </span>
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  eyebrow,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="sheet m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[540px] overflow-y-auto rounded-[28px] bg-transparent p-0 text-foreground"
    >
      {open && (
        <div className="surface-strong rounded-[28px] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 id={titleId} className="mt-2.5 font-serif text-[30px] leading-none tracking-[-0.01em]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 grid size-9 place-items-center rounded-full text-subtle transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-7">{children}</div>
        </div>
      )}
    </dialog>
  )
}

export function IconAction({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-foreground/[0.06] hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export const isComposing = (e: React.KeyboardEvent) => e.nativeEvent.isComposing || e.keyCode === 229

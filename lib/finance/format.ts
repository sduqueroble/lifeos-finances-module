import { DAY } from '@/lib/today/time'

const grouped = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

function trimDecimal(n: number) {
  const fixed = n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '')
  return fixed.replace('.', ',')
}

function compactBody(abs: number) {
  if (abs >= 1e9) return `${trimDecimal(abs / 1e9)}B`
  if (abs >= 1e6) return `${trimDecimal(abs / 1e6)}M`
  if (abs >= 1e4) return `${Math.round(abs / 1e3)}k`
  return grouped.format(abs)
}

/** Colombian peso, grouped with dots: $48.215.300. Compact: $48,2M. */
export function formatCOP(value: number, opts: { sign?: boolean; compact?: boolean } = {}) {
  const abs = Math.abs(Math.round(value))
  const body = opts.compact ? compactBody(abs) : grouped.format(abs)
  const prefix = value < 0 && abs !== 0 ? '−' : opts.sign && abs > 0 ? '+' : ''
  return `${prefix}$${body}`
}

export const formatNumber = (n: number) => grouped.format(Math.round(n))

export function parseAmount(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

export function startOfDay(ms: number) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfMonth(ms: number, offset = 0) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime()
}

export function daysInMonth(ms: number) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function addMonths(ms: number, months: number) {
  const d = new Date(ms)
  const day = d.getDate()
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1, d.getHours(), d.getMinutes())
  target.setDate(Math.min(day, daysInMonth(target.getTime())))
  return target.getTime()
}

export const monthName = (ms: number, style: 'long' | 'short' = 'long') =>
  new Date(ms).toLocaleDateString('en-US', { month: style })

export const shortDate = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export function dayDiff(ts: number, now: number) {
  return Math.round((startOfDay(ts) - startOfDay(now)) / DAY)
}

export function relativeDay(ts: number, now: number) {
  const diff = dayDiff(ts, now)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1 && diff < 7) return `In ${diff} days`
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function dayHeading(ts: number, now: number) {
  const diff = dayDiff(ts, now)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear()
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
}

export function dueLabel(ts: number, now: number) {
  const diff = dayDiff(ts, now)
  if (diff < -1) return `${-diff} days overdue`
  if (diff === -1) return 'Due yesterday'
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 14) return `In ${diff} days`
  return shortDate(ts)
}

export const toDateInput = (ms: number) => {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromDateInput(value: string, keepTimeFrom: number) {
  const [y, m, d] = value.split('-').map(Number)
  const t = new Date(keepTimeFrom)
  return new Date(y, (m ?? 1) - 1, d ?? 1, t.getHours(), t.getMinutes()).getTime()
}

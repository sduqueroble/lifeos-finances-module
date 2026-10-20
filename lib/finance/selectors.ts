import { DAY } from '@/lib/today/time'
import { category } from './categories'
import { addMonths, daysInMonth, startOfDay, startOfMonth } from './format'
import type { Account, Budget, CategoryId, FinanceData, Frequency, Recurring, Transaction } from './types'

/** Signed effect of a transaction on one account. */
export function effectOn(tx: Transaction, accountId: string) {
  if (tx.type === 'income') return tx.accountId === accountId ? tx.amount : 0
  if (tx.type === 'expense') return tx.accountId === accountId ? -tx.amount : 0
  let v = 0
  if (tx.accountId === accountId) v -= tx.amount
  if (tx.toAccountId === accountId) v += tx.amount
  return v
}

export function balanceOf(data: FinanceData, account: Account, at = Infinity) {
  let balance = account.openingBalance
  for (const tx of data.transactions) if (tx.date <= at) balance += effectOn(tx, account.id)
  return balance
}

export function balances(data: FinanceData) {
  return Object.fromEntries(data.accounts.map((a) => [a.id, balanceOf(data, a)])) as Record<string, number>
}

export const activeAccounts = (data: FinanceData) => data.accounts.filter((a) => !a.archived)

export function netWorth(data: FinanceData) {
  const b = balances(data)
  let assets = 0
  let owed = 0
  for (const a of activeAccounts(data)) {
    if (b[a.id] >= 0) assets += b[a.id]
    else owed += -b[a.id]
  }
  return { assets, owed, net: assets - owed }
}

export function totalsBetween(data: FinanceData, from: number, to: number) {
  let income = 0
  let expense = 0
  for (const tx of data.transactions) {
    if (tx.date < from || tx.date >= to) continue
    if (tx.type === 'income') income += tx.amount
    else if (tx.type === 'expense') expense += tx.amount
  }
  return { income, expense, net: income - expense }
}

export function monthBounds(now: number, offset = 0) {
  return { from: startOfMonth(now, offset), to: startOfMonth(now, offset + 1) }
}

export function monthTotals(data: FinanceData, now: number, offset = 0) {
  const { from, to } = monthBounds(now, offset)
  return totalsBetween(data, from, to)
}

export function spendingByCategory(data: FinanceData, from: number, to: number) {
  const map = new Map<CategoryId, number>()
  for (const tx of data.transactions) {
    if (tx.type !== 'expense' || tx.date < from || tx.date >= to) continue
    map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount)
  }
  return [...map.entries()].map(([id, amount]) => ({ id, amount })).sort((a, b) => b.amount - a.amount)
}

export interface FlowMonth {
  start: number
  income: number
  expense: number
  net: number
  current: boolean
}

export function cashFlowSeries(data: FinanceData, now: number, months = 6): FlowMonth[] {
  return Array.from({ length: months }, (_, i) => {
    const offset = i - (months - 1)
    const { from, to } = monthBounds(now, offset)
    return { start: from, ...totalsBetween(data, from, to), current: offset === 0 }
  })
}

export interface DayActivity {
  day: number
  date: number
  income: number
  expense: number
}

export function monthActivity(data: FinanceData, now: number): DayActivity[] {
  const from = startOfMonth(now)
  const length = daysInMonth(now)
  const days: DayActivity[] = Array.from({ length }, (_, i) => ({ day: i + 1, date: from + i * DAY, income: 0, expense: 0 }))
  for (const tx of data.transactions) {
    if (tx.type === 'transfer') continue
    const d = new Date(tx.date)
    const nd = new Date(now)
    if (d.getFullYear() !== nd.getFullYear() || d.getMonth() !== nd.getMonth()) continue
    const slot = days[d.getDate() - 1]
    if (tx.type === 'income') slot.income += tx.amount
    else slot.expense += tx.amount
  }
  return days
}

export function monthProgress(now: number) {
  const total = daysInMonth(now)
  const day = new Date(now).getDate()
  return { day, total, left: total - day, fraction: day / total }
}

export type BudgetState = 'ok' | 'near' | 'over'

export interface BudgetStatus {
  budget: Budget
  spent: number
  remaining: number
  ratio: number
  state: BudgetState
  perDay: number
}

export function budgetStatuses(data: FinanceData, now: number): BudgetStatus[] {
  const { from, to } = monthBounds(now)
  const spent = new Map(spendingByCategory(data, from, to).map((s) => [s.id, s.amount]))
  const { left } = monthProgress(now)
  return data.budgets
    .map((budget) => {
      const s = spent.get(budget.category) ?? 0
      const ratio = budget.limit > 0 ? s / budget.limit : 0
      const remaining = budget.limit - s
      const state: BudgetState = ratio > 1 ? 'over' : ratio >= 0.85 ? 'near' : 'ok'
      return { budget, spent: s, remaining, ratio, state, perDay: remaining > 0 ? remaining / Math.max(left + 1, 1) : 0 }
    })
    .sort((a, b) => b.ratio - a.ratio)
}

export function budgetSummary(statuses: BudgetStatus[]) {
  const limit = statuses.reduce((s, b) => s + b.budget.limit, 0)
  const spent = statuses.reduce((s, b) => s + b.spent, 0)
  return { limit, spent, remaining: limit - spent, ratio: limit > 0 ? spent / limit : 0, over: statuses.filter((s) => s.state === 'over') }
}

export function unbudgetedSpending(data: FinanceData, now: number) {
  const { from, to } = monthBounds(now)
  const budgeted = new Set(data.budgets.map((b) => b.category))
  return spendingByCategory(data, from, to).filter((s) => !budgeted.has(s.id))
}

const FREQ_PER_MONTH: Record<Frequency, number> = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }

export const monthlyEquivalent = (r: Pick<Recurring, 'amount' | 'frequency'>) => r.amount * FREQ_PER_MONTH[r.frequency]

export function advance(date: number, frequency: Frequency) {
  if (frequency === 'weekly') return date + 7 * DAY
  if (frequency === 'monthly') return addMonths(date, 1)
  if (frequency === 'quarterly') return addMonths(date, 3)
  return addMonths(date, 12)
}

export function upcoming(data: FinanceData, now: number, days: number) {
  const until = startOfDay(now) + (days + 1) * DAY
  const out: { recurring: Recurring; date: number }[] = []
  for (const r of data.recurring) {
    if (r.paused) continue
    let d = r.nextDate
    while (d < until) {
      out.push({ recurring: r, date: d })
      d = advance(d, r.frequency)
    }
  }
  return out.sort((a, b) => a.date - b.date)
}

export function recurringSummary(data: FinanceData) {
  const active = data.recurring.filter((r) => !r.paused)
  return {
    monthly: active.reduce((s, r) => s + monthlyEquivalent(r), 0),
    active: active.length,
    paused: data.recurring.length - active.length,
  }
}

/** Evenly spaced balance samples for a sparkline, oldest first. */
export function balanceHistory(data: FinanceData, account: Account, now: number, days = 90, points = 30) {
  const step = (days * DAY) / (points - 1)
  return Array.from({ length: points }, (_, i) => balanceOf(data, account, now - days * DAY + i * step))
}

export function lastActivity(data: FinanceData, accountId: string) {
  let latest = 0
  for (const tx of data.transactions) {
    if ((tx.accountId === accountId || tx.toAccountId === accountId) && tx.date > latest) latest = tx.date
  }
  return latest || null
}

export const categoryLabel = (id: CategoryId) => category(id).label

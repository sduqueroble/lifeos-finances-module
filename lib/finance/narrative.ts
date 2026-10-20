import { categoryLabel, budgetStatuses, budgetSummary, monthProgress, monthTotals, upcoming } from './selectors'
import { formatCOP } from './format'
import type { FinanceData } from './types'

/** One calm paragraph describing the month so far. */
export function composeFinanceMessage(data: FinanceData, now: number) {
  if (data.accounts.length === 0) {
    return 'Nothing to reconcile yet. Add the account you use most and LifeOS will start drawing the shape of your month.'
  }

  const month = monthTotals(data, now)
  const { left } = monthProgress(now)
  const statuses = budgetStatuses(data, now)
  const summary = budgetSummary(statuses)
  const next = upcoming(data, now, 7)
  const parts: string[] = []

  if (data.transactions.length < 10) {
    parts.push(`A quiet start: ${formatCOP(month.income, { compact: true })} in and ${formatCOP(month.expense, { compact: true })} out so far.`)
    parts.push('A few weeks of history will make the patterns here more useful.')
    return parts.join(' ')
  }

  if (month.net >= 0) {
    parts.push(`Income is ahead of spending by ${formatCOP(month.net, { compact: true })} this month, with ${left} ${left === 1 ? 'day' : 'days'} to go.`)
  } else {
    parts.push(`Spending is ${formatCOP(-month.net, { compact: true })} ahead of income so far, with ${left} ${left === 1 ? 'day' : 'days'} left to settle.`)
  }

  if (summary.over.length === 1) {
    parts.push(`${categoryLabel(summary.over[0].budget.category)} has run past its budget; everything else is holding.`)
  } else if (summary.over.length > 1) {
    parts.push(`${summary.over.length} budgets have run over, worth a look before the month closes.`)
  } else if (statuses.length > 0) {
    parts.push(`Every budget is within its limit.`)
  }

  if (next.length > 0) {
    parts.push(`${next[0].recurring.name} is the next payment out.`)
  }

  return parts.join(' ')
}

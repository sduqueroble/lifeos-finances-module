'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { buildFinanceScenario } from './data'
import { advance } from './selectors'
import type { Account, Budget, CategoryId, FinanceData, FinanceScenario, Recurring, Transaction } from './types'

export type TransactionInput = Omit<Transaction, 'id'>
export type AccountInput = Omit<Account, 'id' | 'openingBalance'> & { balance: number }
export type RecurringInput = Omit<Recurring, 'id'>

type Action =
  | { type: 'load'; data: FinanceData | null }
  | { type: 'addTransaction'; tx: TransactionInput }
  | { type: 'updateTransaction'; id: string; tx: TransactionInput }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'addAccount'; account: Omit<Account, 'id'> }
  | { type: 'updateAccount'; id: string; patch: Partial<Omit<Account, 'id'>>; balanceDelta: number }
  | { type: 'deleteAccount'; id: string }
  | { type: 'setBudget'; category: CategoryId; limit: number }
  | { type: 'deleteBudget'; id: string }
  | { type: 'addRecurring'; recurring: RecurringInput }
  | { type: 'updateRecurring'; id: string; recurring: RecurringInput }
  | { type: 'deleteRecurring'; id: string }
  | { type: 'togglePaused'; id: string }
  | { type: 'markPaid'; id: string; date: number }

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()))

const byDateDesc = (a: Transaction, b: Transaction) => b.date - a.date

function reducer(state: FinanceData | null, action: Action): FinanceData | null {
  if (action.type === 'load') return action.data
  if (!state) return state

  switch (action.type) {
    case 'addTransaction':
      return { ...state, transactions: [{ ...action.tx, id: uid() }, ...state.transactions].sort(byDateDesc) }
    case 'updateTransaction':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...action.tx, id: t.id } : t)).sort(byDateDesc),
      }
    case 'deleteTransaction':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }
    case 'addAccount':
      return { ...state, accounts: [...state.accounts, { ...action.account, id: uid() }] }
    case 'updateAccount':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.id ? { ...a, ...action.patch, openingBalance: a.openingBalance + action.balanceDelta } : a,
        ),
      }
    case 'deleteAccount':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
        recurring: state.recurring.filter((r) => r.accountId !== action.id),
      }
    case 'setBudget': {
      const exists = state.budgets.some((b) => b.category === action.category)
      const budgets: Budget[] = exists
        ? state.budgets.map((b) => (b.category === action.category ? { ...b, limit: action.limit } : b))
        : [...state.budgets, { id: uid(), category: action.category, limit: action.limit }]
      return { ...state, budgets }
    }
    case 'deleteBudget':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) }
    case 'addRecurring':
      return { ...state, recurring: [...state.recurring, { ...action.recurring, id: uid() }] }
    case 'updateRecurring':
      return { ...state, recurring: state.recurring.map((r) => (r.id === action.id ? { ...action.recurring, id: r.id } : r)) }
    case 'deleteRecurring':
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.id) }
    case 'togglePaused':
      return { ...state, recurring: state.recurring.map((r) => (r.id === action.id ? { ...r, paused: !r.paused || undefined } : r)) }
    case 'markPaid': {
      const r = state.recurring.find((x) => x.id === action.id)
      if (!r) return state
      const tx: Transaction = {
        id: uid(),
        date: action.date,
        description: r.name,
        amount: r.amount,
        type: 'expense',
        category: r.category,
        accountId: r.accountId,
        recurringId: r.id,
      }
      return {
        ...state,
        transactions: [tx, ...state.transactions].sort(byDateDesc),
        recurring: state.recurring.map((x) => (x.id === r.id ? { ...x, nextDate: advance(x.nextDate, x.frequency) } : x)),
      }
    }
  }
}

function useFinanceState() {
  const [scenario, setScenario] = useState<FinanceScenario>('populated')
  const [data, dispatch] = useReducer(reducer, null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  const load = useCallback((next: FinanceScenario) => {
    setScenario(next)
    setLoading(true)
    window.clearTimeout(timer.current)
    if (next === 'loading') return
    timer.current = window.setTimeout(() => {
      const at = Date.now()
      setNow(at)
      dispatch({ type: 'load', data: buildFinanceScenario(next, at) })
      setLoading(false)
    }, 650)
  }, [])

  useEffect(() => {
    load('populated')
    return () => window.clearTimeout(timer.current)
  }, [load])

  const actions = useMemo(
    () => ({
      addTransaction: (tx: TransactionInput) => dispatch({ type: 'addTransaction', tx }),
      updateTransaction: (id: string, tx: TransactionInput) => dispatch({ type: 'updateTransaction', id, tx }),
      deleteTransaction: (id: string) => dispatch({ type: 'deleteTransaction', id }),
      transfer: (input: { from: string; to: string; amount: number; date: number; note?: string }) =>
        dispatch({
          type: 'addTransaction',
          tx: {
            date: input.date,
            description: 'Transfer',
            amount: input.amount,
            type: 'transfer',
            category: 'transfer',
            accountId: input.from,
            toAccountId: input.to,
            note: input.note,
          },
        }),
      addAccount: ({ balance, ...account }: AccountInput) =>
        dispatch({ type: 'addAccount', account: { ...account, openingBalance: balance } }),
      updateAccount: (id: string, patch: Partial<Omit<Account, 'id'>>, balanceDelta = 0) =>
        dispatch({ type: 'updateAccount', id, patch, balanceDelta }),
      setArchived: (id: string, archived: boolean) =>
        dispatch({ type: 'updateAccount', id, patch: { archived: archived || undefined }, balanceDelta: 0 }),
      deleteAccount: (id: string) => dispatch({ type: 'deleteAccount', id }),
      setBudget: (category: CategoryId, limit: number) => dispatch({ type: 'setBudget', category, limit }),
      deleteBudget: (id: string) => dispatch({ type: 'deleteBudget', id }),
      addRecurring: (recurring: RecurringInput) => dispatch({ type: 'addRecurring', recurring }),
      updateRecurring: (id: string, recurring: RecurringInput) => dispatch({ type: 'updateRecurring', id, recurring }),
      deleteRecurring: (id: string) => dispatch({ type: 'deleteRecurring', id }),
      togglePaused: (id: string) => dispatch({ type: 'togglePaused', id }),
      markPaid: (id: string, date = Date.now()) => dispatch({ type: 'markPaid', id, date }),
    }),
    [],
  )

  return { scenario, setScenario: load, data, loading, now, actions }
}

type FinanceContextValue = ReturnType<typeof useFinanceState>
export type FinanceActions = FinanceContextValue['actions']

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const value = useFinanceState()
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>')
  return ctx
}

/** For section content, which the shell only renders once data has loaded. */
export function useFinanceData() {
  const { data, now, actions } = useFinance()
  if (!data) throw new Error('Finance data is not loaded yet')
  return { data, now, actions }
}

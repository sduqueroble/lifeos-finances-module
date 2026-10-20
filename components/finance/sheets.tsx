'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useFinance, type TransactionInput } from '@/lib/finance/store'
import { balanceOf, lastActivity, spendingByCategory } from '@/lib/finance/selectors'
import { startOfMonth } from '@/lib/finance/format'
import type { Account, Budget, CategoryId, FinanceData, Recurring, Transaction } from '@/lib/finance/types'
import { PrimaryButton, Sheet } from './primitives'
import { TransactionForm } from './forms/transaction-form'
import { AccountForm } from './forms/account-form'
import { BudgetForm } from './forms/budget-form'
import { RecurringForm } from './forms/recurring-form'

export type SheetRequest =
  | { kind: 'transaction'; tx?: Transaction; defaults?: Partial<TransactionInput> }
  | { kind: 'account'; account?: Account }
  | { kind: 'budget'; budget?: Budget; category?: CategoryId }
  | { kind: 'recurring'; recurring?: Recurring }

interface SheetsValue {
  open: (req: SheetRequest) => void
  notify: (message: string) => void
}

const SheetsContext = createContext<SheetsValue | null>(null)

export function useSheets() {
  const ctx = useContext(SheetsContext)
  if (!ctx) throw new Error('useSheets must be used inside <FinanceSheets>')
  return ctx
}

const TITLES: Record<SheetRequest['kind'], [string, string, string]> = {
  transaction: ['Ledger', 'New transaction', 'Edit transaction'],
  account: ['Accounts', 'New account', 'Edit account'],
  budget: ['Budgets', 'New budget', 'Edit budget'],
  recurring: ['Recurring', 'New recurring payment', 'Edit payment'],
}

function isEditing(req: SheetRequest) {
  if (req.kind === 'transaction') return !!req.tx
  if (req.kind === 'account') return !!req.account
  if (req.kind === 'budget') return !!req.budget
  return !!req.recurring
}

function threeMonthAverage(data: FinanceData, now: number, cat: CategoryId) {
  const spent = spendingByCategory(data, startOfMonth(now, -3), startOfMonth(now)).find((s) => s.id === cat)?.amount ?? 0
  return spent / 3
}

export function FinanceSheets({ children }: { children: ReactNode }) {
  const { data, now, actions } = useFinance()
  const [req, setReq] = useState<SheetRequest | null>(null)
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const close = useCallback(() => setReq(null), [])
  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const done = (message: string) => {
    close()
    notify(message)
  }

  const [eyebrow, createTitle, editTitle] = req ? TITLES[req.kind] : ['', '', '']
  const title =
    req?.kind === 'transaction' && !req.tx && req.defaults?.type === 'transfer' ? 'Move money' : req && isEditing(req) ? editTitle : createTitle

  return (
    <SheetsContext.Provider value={{ open: setReq, notify }}>
      {children}
      <Sheet open={!!req && !!data} onClose={close} eyebrow={eyebrow} title={title}>
        {req && data && <SheetBody req={req} data={data} now={now} actions={actions} done={done} close={close} open={setReq} />}
      </Sheet>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
        {toast && (
          <p
            key={toast.id}
            className="rise flex items-center gap-2 rounded-full bg-popover px-4 py-2.5 text-[13px] text-foreground shadow-[inset_0_0_0_1px_var(--hairline),0_16px_40px_-16px_rgba(0,0,0,0.8)]"
          >
            <Check className="size-3.5 text-primary" aria-hidden />
            {toast.message}
          </p>
        )}
      </div>
    </SheetsContext.Provider>
  )
}

function SheetBody({
  req,
  data,
  now,
  actions,
  done,
  close,
  open,
}: {
  req: SheetRequest
  data: FinanceData
  now: number
  actions: ReturnType<typeof useFinance>['actions']
  done: (message: string) => void
  close: () => void
  open: (req: SheetRequest) => void
}) {
  if ((req.kind === 'transaction' || req.kind === 'recurring') && data.accounts.every((a) => a.archived)) {
    return (
      <div className="flex flex-col items-start gap-5">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Every peso needs a home. Add the account you use most, then come back to record this.
        </p>
        <PrimaryButton onClick={() => open({ kind: 'account' })}>Add an account</PrimaryButton>
      </div>
    )
  }

  if (req.kind === 'transaction') {
    const { tx } = req
    return (
      <TransactionForm
        data={data}
        now={now}
        initial={tx}
        defaults={req.defaults}
        onCancel={close}
        onSubmit={(input) => {
          if (tx) actions.updateTransaction(tx.id, input)
          else actions.addTransaction(input)
          done(tx ? 'Transaction updated' : input.type === 'transfer' ? 'Transfer recorded' : 'Transaction added')
        }}
        onDelete={
          tx
            ? () => {
                actions.deleteTransaction(tx.id)
                done('Transaction deleted')
              }
            : undefined
        }
      />
    )
  }

  if (req.kind === 'account') {
    const { account } = req
    const current = account ? balanceOf(data, account) : 0
    return (
      <AccountForm
        initial={account}
        currentBalance={account ? current : undefined}
        hasHistory={account ? lastActivity(data, account.id) !== null : false}
        onCancel={close}
        onSubmit={({ balance, ...input }) => {
          if (account) actions.updateAccount(account.id, input, balance - current)
          else actions.addAccount({ ...input, balance })
          done(account ? 'Account saved' : `${input.name} added`)
        }}
        onArchive={
          account
            ? () => {
                actions.setArchived(account.id, !account.archived)
                done(account.archived ? 'Account restored' : 'Account archived')
              }
            : undefined
        }
        onDelete={
          account
            ? () => {
                actions.deleteAccount(account.id)
                done('Account deleted')
              }
            : undefined
        }
      />
    )
  }

  if (req.kind === 'budget') {
    const { budget } = req
    return (
      <BudgetForm
        initial={budget}
        category={req.category}
        taken={data.budgets.map((b) => b.category)}
        averageFor={(c) => threeMonthAverage(data, now, c)}
        onCancel={close}
        onSubmit={(cat, limit) => {
          actions.setBudget(cat, limit)
          done(budget ? 'Budget updated' : 'Budget set')
        }}
        onDelete={
          budget
            ? () => {
                actions.deleteBudget(budget.id)
                done('Budget removed')
              }
            : undefined
        }
      />
    )
  }

  const { recurring } = req
  return (
    <RecurringForm
      data={data}
      now={now}
      initial={recurring}
      onCancel={close}
      onSubmit={(input) => {
        if (recurring) actions.updateRecurring(recurring.id, input)
        else actions.addRecurring(input)
        done(recurring ? 'Payment saved' : 'Recurring payment added')
      }}
      onDelete={
        recurring
          ? () => {
              actions.deleteRecurring(recurring.id)
              done('Payment removed')
            }
          : undefined
      }
    />
  )
}

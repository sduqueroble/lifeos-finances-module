'use client'

import { useId, useState } from 'react'
import { categoriesFor } from '@/lib/finance/categories'
import { fromDateInput, toDateInput } from '@/lib/finance/format'
import { activeAccounts } from '@/lib/finance/selectors'
import type { TransactionInput } from '@/lib/finance/store'
import type { CategoryId, FinanceData, Transaction, TxType } from '@/lib/finance/types'
import { Field, MoneyInput, PrimaryButton, QuietButton, Segmented, SelectField, fieldClass } from '../primitives'
import { FormFooter } from './form-footer'

const TYPES: { value: TxType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
]

const DEFAULT_CATEGORY: Record<TxType, CategoryId> = { expense: 'groceries', income: 'salary', transfer: 'transfer' }

export function TransactionForm({
  data,
  now,
  initial,
  defaults,
  onSubmit,
  onDelete,
  onCancel,
}: {
  data: FinanceData
  now: number
  initial?: Transaction
  defaults?: Partial<TransactionInput>
  onSubmit: (tx: TransactionInput) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const accounts = activeAccounts(data)
  const seed = { ...defaults, ...initial }
  const [type, setType] = useState<TxType>(seed.type ?? 'expense')
  const [amount, setAmount] = useState(seed.amount ?? 0)
  const [description, setDescription] = useState(seed.description ?? '')
  const [cat, setCat] = useState<CategoryId>(seed.category ?? DEFAULT_CATEGORY[type])
  const [accountId, setAccountId] = useState(seed.accountId ?? accounts[0]?.id ?? '')
  const [toAccountId, setToAccountId] = useState(seed.toAccountId ?? accounts.find((a) => a.id !== accountId)?.id ?? '')
  const [date, setDate] = useState(toDateInput(seed.date ?? now))
  const [note, setNote] = useState(seed.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const changeType = (next: TxType) => {
    setType(next)
    if (!categoriesFor(next).some((c) => c.id === cat)) setCat(DEFAULT_CATEGORY[next])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0) return setError('Enter an amount above zero.')
    if (type !== 'transfer' && !description.trim()) return setError('Add a short description.')
    if (type === 'transfer' && accountId === toAccountId) return setError('Choose two different accounts.')
    onSubmit({
      type,
      amount,
      description: description.trim() || 'Transfer',
      category: type === 'transfer' ? 'transfer' : cat,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      date: fromDateInput(date, seed.date ?? now),
      note: note.trim() || undefined,
      recurringId: initial?.recurringId,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Segmented label="Transaction type" options={TYPES} value={type} onChange={changeType} className="self-start" />

      <Field label="Amount" htmlFor={`${id}-amount`}>
        <MoneyInput id={`${id}-amount`} value={amount} onChange={setAmount} size="lg" autoFocus />
      </Field>

      <Field label={type === 'transfer' ? 'Description (optional)' : 'Description'} htmlFor={`${id}-desc`}>
        <input
          id={`${id}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === 'income' ? 'Quincena, invoice, refund…' : type === 'transfer' ? 'Monthly saving' : 'Carulla, Uber, Juan Valdez…'}
          className={fieldClass}
          maxLength={80}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        {type === 'transfer' ? (
          <>
            <Field label="From" htmlFor={`${id}-from`}>
              <AccountSelect id={`${id}-from`} data={data} value={accountId} onChange={setAccountId} />
            </Field>
            <Field label="To" htmlFor={`${id}-to`}>
              <AccountSelect id={`${id}-to`} data={data} value={toAccountId} onChange={setToAccountId} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Category" htmlFor={`${id}-cat`}>
              <SelectField id={`${id}-cat`} value={cat} onChange={(e) => setCat(e.target.value as CategoryId)}>
                {categoriesFor(type).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field label="Account" htmlFor={`${id}-acct`}>
              <AccountSelect id={`${id}-acct`} data={data} value={accountId} onChange={setAccountId} />
            </Field>
          </>
        )}
        <Field label="Date" htmlFor={`${id}-date`}>
          <input id={`${id}-date`} type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Note" htmlFor={`${id}-note`}>
          <input id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className={fieldClass} maxLength={120} />
        </Field>
      </div>

      <FormFooter error={error} onDelete={onDelete} deleteLabel="Delete transaction">
        <QuietButton onClick={onCancel}>Cancel</QuietButton>
        <PrimaryButton type="submit">{initial ? 'Save changes' : 'Add transaction'}</PrimaryButton>
      </FormFooter>
    </form>
  )
}

export function AccountSelect({
  id,
  data,
  value,
  onChange,
}: {
  id: string
  data: FinanceData
  value: string
  onChange: (id: string) => void
}) {
  return (
    <SelectField id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {activeAccounts(data).map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} · {a.institution}
        </option>
      ))}
    </SelectField>
  )
}

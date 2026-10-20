'use client'

import { useId, useState } from 'react'
import { EXPENSE_CATEGORIES } from '@/lib/finance/categories'
import { fromDateInput, toDateInput } from '@/lib/finance/format'
import { activeAccounts } from '@/lib/finance/selectors'
import type { RecurringInput } from '@/lib/finance/store'
import { FREQUENCY_LABEL, type CategoryId, type FinanceData, type Frequency, type Recurring } from '@/lib/finance/types'
import { Field, MoneyInput, PrimaryButton, QuietButton, Segmented, SelectField, fieldClass } from '../primitives'
import { FormFooter } from './form-footer'
import { AccountSelect } from './transaction-form'

export function RecurringForm({
  data,
  now,
  initial,
  onSubmit,
  onDelete,
  onCancel,
}: {
  data: FinanceData
  now: number
  initial?: Recurring
  onSubmit: (r: RecurringInput) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const [kind, setKind] = useState<Recurring['kind']>(initial?.kind ?? 'subscription')
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [cat, setCat] = useState<CategoryId>(initial?.category ?? 'subscriptions')
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? 'monthly')
  const [accountId, setAccountId] = useState(initial?.accountId ?? activeAccounts(data)[0]?.id ?? '')
  const [date, setDate] = useState(toDateInput(initial?.nextDate ?? now))
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return setError('Name the payment.')
        if (amount <= 0) return setError('Enter an amount above zero.')
        onSubmit({
          kind,
          name: name.trim(),
          amount,
          category: cat,
          frequency,
          accountId,
          nextDate: fromDateInput(date, initial?.nextDate ?? new Date(now).setHours(9, 0, 0, 0)),
          paused: initial?.paused,
        })
      }}
    >
      <Segmented
        label="Payment kind"
        value={kind}
        onChange={setKind}
        className="self-start"
        options={[
          { value: 'subscription', label: 'Subscription' },
          { value: 'bill', label: 'Bill' },
        ]}
      />
      <Field label="Name" htmlFor={`${id}-name`}>
        <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, Arriendo, EPM…" className={fieldClass} autoFocus maxLength={60} />
      </Field>
      <Field label="Amount" htmlFor={`${id}-amount`}>
        <MoneyInput id={`${id}-amount`} value={amount} onChange={setAmount} size="lg" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Repeats" htmlFor={`${id}-freq`}>
          <SelectField id={`${id}-freq`} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Next payment" htmlFor={`${id}-date`}>
          <input id={`${id}-date`} type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Category" htmlFor={`${id}-cat`}>
          <SelectField id={`${id}-cat`} value={cat} onChange={(e) => setCat(e.target.value as CategoryId)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Paid from" htmlFor={`${id}-acct`}>
          <AccountSelect id={`${id}-acct`} data={data} value={accountId} onChange={setAccountId} />
        </Field>
      </div>
      <FormFooter error={error} onDelete={onDelete} deleteLabel="Remove">
        <QuietButton onClick={onCancel}>Cancel</QuietButton>
        <PrimaryButton type="submit">{initial ? 'Save' : 'Add payment'}</PrimaryButton>
      </FormFooter>
    </form>
  )
}

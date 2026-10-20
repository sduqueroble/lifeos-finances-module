'use client'

import { useId, useState } from 'react'
import { EXPENSE_CATEGORIES } from '@/lib/finance/categories'
import { formatCOP } from '@/lib/finance/format'
import type { Budget, CategoryId } from '@/lib/finance/types'
import { Field, MoneyInput, PrimaryButton, QuietButton, SelectField } from '../primitives'
import { FormFooter } from './form-footer'

export function BudgetForm({
  initial,
  category: presetCategory,
  taken,
  averageFor,
  onSubmit,
  onDelete,
  onCancel,
}: {
  initial?: Budget
  category?: CategoryId
  taken: CategoryId[]
  averageFor: (c: CategoryId) => number
  onSubmit: (category: CategoryId, limit: number) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const available = EXPENSE_CATEGORIES.filter((c) => c.id === initial?.category || !taken.includes(c.id))
  const [cat, setCat] = useState<CategoryId>(initial?.category ?? presetCategory ?? available[0]?.id ?? 'groceries')
  const [limit, setLimit] = useState(initial?.limit ?? Math.round(averageFor(cat) / 10_000) * 10_000)
  const [error, setError] = useState<string | null>(null)
  const id = useId()
  const avg = averageFor(cat)

  if (available.length === 0) {
    return <p className="text-[14px] text-muted-foreground">Every expense category already has a budget.</p>
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (limit <= 0) return setError('Set a monthly limit above zero.')
        onSubmit(cat, limit)
      }}
    >
      <Field label="Category" htmlFor={`${id}-cat`}>
        <SelectField id={`${id}-cat`} value={cat} disabled={!!initial} onChange={(e) => setCat(e.target.value as CategoryId)}>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectField>
      </Field>
      <Field
        label="Monthly limit"
        htmlFor={`${id}-limit`}
        hint={avg > 0 ? `You've averaged ${formatCOP(avg)} a month here over the last three months.` : 'No spending recorded here yet.'}
      >
        <MoneyInput id={`${id}-limit`} value={limit} onChange={setLimit} size="lg" autoFocus />
      </Field>
      <FormFooter error={error} onDelete={onDelete} deleteLabel="Remove budget">
        <QuietButton onClick={onCancel}>Cancel</QuietButton>
        <PrimaryButton type="submit">{initial ? 'Save' : 'Set budget'}</PrimaryButton>
      </FormFooter>
    </form>
  )
}

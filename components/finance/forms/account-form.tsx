'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AccountInput } from '@/lib/finance/store'
import { ACCOUNT_KIND_LABEL, ACCOUNT_TONES, type Account, type AccountKind } from '@/lib/finance/types'
import { AccountMark, Field, MoneyInput, PrimaryButton, QuietButton, Segmented, SelectField, fieldClass } from '../primitives'
import { FormFooter } from './form-footer'

export function AccountForm({
  initial,
  currentBalance,
  hasHistory,
  onSubmit,
  onArchive,
  onDelete,
  onCancel,
}: {
  initial?: Account
  currentBalance?: number
  hasHistory?: boolean
  onSubmit: (input: AccountInput) => void
  onArchive?: () => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'checking')
  const [direction, setDirection] = useState<'have' | 'owe'>((currentBalance ?? 0) < 0 || initial?.kind === 'credit' ? 'owe' : 'have')
  const [balance, setBalance] = useState(Math.abs(currentBalance ?? 0))
  const [limit, setLimit] = useState(initial?.creditLimit ?? 0)
  const [last4, setLast4] = useState(initial?.last4 ?? '')
  const [tone, setTone] = useState(initial?.tone ?? ACCOUNT_TONES[0])
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Give the account a name.')
    onSubmit({
      name: name.trim(),
      institution: institution.trim() || name.trim(),
      kind,
      balance: direction === 'owe' ? -balance : balance,
      creditLimit: kind === 'credit' && limit > 0 ? limit : undefined,
      last4: last4.trim() || undefined,
      tone,
      archived: initial?.archived,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-2xl bg-background/40 p-4 shadow-[inset_0_0_0_1px_var(--hairline)]">
        <AccountMark account={{ institution: institution || name || 'New', tone }} />
        <div className="min-w-0">
          <p className="truncate font-serif text-[22px] leading-tight">{name || 'New account'}</p>
          <p className="truncate text-[12px] text-subtle">
            {ACCOUNT_KIND_LABEL[kind]}
            {institution && ` · ${institution}`}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor={`${id}-name`}>
          <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Everyday" className={fieldClass} autoFocus maxLength={40} />
        </Field>
        <Field label="Institution" htmlFor={`${id}-inst`}>
          <input id={`${id}-inst`} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Bancolombia" className={fieldClass} maxLength={40} />
        </Field>
        <Field label="Type" htmlFor={`${id}-kind`}>
          <SelectField
            id={`${id}-kind`}
            value={kind}
            onChange={(e) => {
              const next = e.target.value as AccountKind
              setKind(next)
              if (next === 'credit') setDirection('owe')
            }}
          >
            {(Object.keys(ACCOUNT_KIND_LABEL) as AccountKind[]).map((k) => (
              <option key={k} value={k}>
                {ACCOUNT_KIND_LABEL[k]}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Last four digits" htmlFor={`${id}-last4`}>
          <input
            id={`${id}-last4`}
            value={last4}
            inputMode="numeric"
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Optional"
            className={fieldClass}
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor={`${id}-bal`} className="text-[12px] font-medium text-muted-foreground">
            {initial ? 'Current balance' : 'Starting balance'}
          </label>
          <Segmented
            label="Balance direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'have', label: 'I have' },
              { value: 'owe', label: 'I owe' },
            ]}
          />
        </div>
        <MoneyInput id={`${id}-bal`} value={balance} onChange={setBalance} />
        {initial && hasHistory && <p className="mt-1.5 text-[12px] text-subtle">Adjusting this keeps your history and corrects the balance.</p>}
      </div>

      {kind === 'credit' && (
        <Field label="Credit limit" htmlFor={`${id}-limit`}>
          <MoneyInput id={`${id}-limit`} value={limit} onChange={setLimit} />
        </Field>
      )}

      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-muted-foreground">Tone</legend>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Tone ${t}`}
              aria-pressed={tone === t}
              onClick={() => setTone(t)}
              className={cn(
                'size-8 rounded-full transition-transform hover:scale-110',
                tone === t && 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-[#162331]',
              )}
              style={{ backgroundColor: t }}
            />
          ))}
        </div>
      </fieldset>

      <FormFooter error={error} onDelete={!hasHistory ? onDelete : undefined} deleteLabel="Delete account">
        {initial && hasHistory && onArchive && (
          <QuietButton onClick={onArchive} className="mr-auto sm:mr-0">
            {initial.archived ? 'Restore' : 'Archive'}
          </QuietButton>
        )}
        <QuietButton onClick={onCancel}>Cancel</QuietButton>
        <PrimaryButton type="submit">{initial ? 'Save' : 'Add account'}</PrimaryButton>
      </FormFooter>
    </form>
  )
}

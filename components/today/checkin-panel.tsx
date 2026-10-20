'use client'

import { useState } from 'react'
import { ArrowRight, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/today/time'
import { ENERGY_LABELS, MOOD_LABELS, type CheckIn, type Level } from '@/lib/today/types'
import type { TodayActions } from '@/lib/today/use-today'
import { GhostButton, MoonPhase } from './primitives'

const LEVELS: Level[] = [1, 2, 3, 4, 5]

export function CheckInPanel({
  checkIn,
  actions,
  className,
}: {
  checkIn: CheckIn | null
  actions: TodayActions
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <section
      aria-labelledby="checkin-heading"
      className={cn('rise relative overflow-hidden rounded-[32px] bg-[#111D2A] p-6 shadow-[inset_0_0_0_1px_var(--hairline)] sm:p-8', className)}
      style={{ '--d': '480ms' } as React.CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/[0.08] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full border border-foreground/[0.05]" />

      <div className="relative">
        <p className="eyebrow">Reflection</p>
        {open ? (
          <CheckInForm
            initial={checkIn}
            onCancel={() => setOpen(false)}
            onSave={(c) => {
              actions.saveCheckIn(c)
              setOpen(false)
            }}
          />
        ) : checkIn ? (
          <CheckInSummary checkIn={checkIn} onEdit={() => setOpen(true)} />
        ) : (
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <h2 id="checkin-heading" className="font-serif text-[30px] leading-[1.05] text-foreground">
                How are you <span className="italic text-[#B4C4D3]">arriving</span> today?
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-subtle">
                A quiet moment to notice how you feel. Entirely optional — it&apos;s here whenever you want it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-foreground/[0.06] px-4 py-2.5 text-[14px] text-foreground shadow-[inset_0_0_0_1px_var(--hairline)] transition-colors hover:bg-primary/[0.12] hover:text-primary sm:self-auto"
            >
              Check in
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function CheckInSummary({ checkIn, onEdit }: { checkIn: CheckIn; onEdit: () => void }) {
  return (
    <div className="mt-4 flex items-start gap-5">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/[0.1] text-primary">
        <MoonPhase level={checkIn.mood} size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="checkin-heading" className="font-serif text-[26px] leading-tight text-foreground">
          Feeling {MOOD_LABELS[checkIn.mood].toLowerCase()}
          <span className="text-subtle"> · </span>
          <span className="italic text-[#B4C4D3]">{ENERGY_LABELS[checkIn.energy].toLowerCase()} energy</span>
        </h2>
        {checkIn.note && <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted-foreground">{`“${checkIn.note}”`}</p>}
        <p className="mt-3 text-[12px] tabular-nums text-subtle">Checked in at {formatTime(checkIn.savedAt)}</p>
      </div>
      <GhostButton onClick={onEdit} className="-mr-2 -mt-1 shrink-0">
        <Pencil className="size-3.5" aria-hidden /> Edit
      </GhostButton>
    </div>
  )
}

function CheckInForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CheckIn | null
  onSave: (c: CheckIn) => void
  onCancel: () => void
}) {
  const [mood, setMood] = useState<Level | null>(initial?.mood ?? null)
  const [energy, setEnergy] = useState<Level | null>(initial?.energy ?? null)
  const [note, setNote] = useState(initial?.note ?? '')

  return (
    <form
      className="@container mt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!mood || !energy) return
        onSave({ mood, energy, note: note.trim(), savedAt: Date.now() })
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <h2 id="checkin-heading" className="font-serif text-[30px] leading-[1.05] text-foreground">
        Daily check-in
      </h2>

      <div className="mt-7 grid gap-7 @xl:grid-cols-2 @xl:gap-8">
        <fieldset>
          <legend className="flex w-full items-baseline justify-between text-[13px] text-muted-foreground">
            Mood
            <span className="font-serif text-[17px] italic text-foreground">{mood ? MOOD_LABELS[mood] : '—'}</span>
          </legend>
          <div className="mt-4 grid grid-cols-5 justify-items-center gap-2">
            {LEVELS.map((n) => (
              <label key={n} className="flex cursor-pointer">
                <input
                  type="radio"
                  name="mood"
                  value={n}
                  checked={mood === n}
                  onChange={() => setMood(n)}
                  className="peer sr-only"
                />
                <span className="grid size-11 place-items-center rounded-full text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)] transition-all duration-300 hover:bg-foreground/[0.04] hover:text-foreground peer-checked:scale-105 peer-checked:bg-primary/[0.12] peer-checked:text-primary peer-checked:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.45)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                  <MoonPhase level={n} size={22} />
                </span>
                <span className="sr-only">{MOOD_LABELS[n]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex w-full items-baseline justify-between text-[13px] text-muted-foreground">
            Energy
            <span className="font-serif text-[17px] italic text-foreground">{energy ? ENERGY_LABELS[energy] : '—'}</span>
          </legend>
          <div className="mt-4 grid grid-cols-5 justify-items-center gap-2">
            {LEVELS.map((n) => (
              <label key={n} className="flex cursor-pointer">
                <input
                  type="radio"
                  name="energy"
                  value={n}
                  checked={energy === n}
                  onChange={() => setEnergy(n)}
                  className="peer sr-only"
                />
                <span className="flex size-11 items-end justify-center gap-[3px] rounded-full pb-[13px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)] transition-all duration-300 hover:bg-foreground/[0.04] hover:text-foreground peer-checked:scale-105 peer-checked:bg-primary/[0.12] peer-checked:text-primary peer-checked:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.45)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                  {LEVELS.map((b) => (
                    <span
                      key={b}
                      aria-hidden
                      className={cn('w-[3px] rounded-full bg-current', b > n && 'opacity-20')}
                      style={{ height: 4 + b * 3 }}
                    />
                  ))}
                </span>
                <span className="sr-only">{ENERGY_LABELS[n]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <label htmlFor="checkin-note" className="mt-8 block text-[13px] text-muted-foreground">
        Anything worth remembering? <span className="text-subtle">Optional</span>
      </label>
      <textarea
        id="checkin-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="A thought, a small win, something on your mind…"
        className="mt-2.5 w-full resize-none rounded-2xl bg-background/50 px-4 py-3 font-serif text-[18px] leading-relaxed text-foreground outline-none shadow-[inset_0_0_0_1px_var(--hairline)] transition-shadow placeholder:font-sans placeholder:text-[14px] placeholder:text-subtle focus:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.45)]"
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[12px] text-subtle">{!mood || !energy ? 'Choose a mood and energy to save.' : 'Only you can see this.'}</p>
        <div className="flex items-center gap-2">
          <GhostButton onClick={onCancel}>Not now</GhostButton>
          <button
            type="submit"
            disabled={!mood || !energy}
            className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

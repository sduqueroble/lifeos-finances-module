import { cn } from '@/lib/utils'
import { startOfDay } from '@/lib/today/time'
import { MOOD_LABELS, type CheckIn, type Habit, type WeekDay } from '@/lib/today/types'
import { MoonPhase, SectionHeader } from './primitives'

export function WeekPanel({
  week,
  habits,
  checkIn,
  now,
  className,
}: {
  week: WeekDay[]
  habits: Habit[]
  checkIn: CheckIn | null
  now: number
  className?: string
}) {
  const today = startOfDay(now)
  const days = week.map((d) =>
    d.date === today
      ? { ...d, scheduled: habits.length, done: habits.filter((h) => h.done).length, mood: checkIn?.mood }
      : d,
  )
  const elapsed = days.filter((d) => d.date <= today && d.scheduled > 0)
  const keptDays = elapsed.filter((d) => d.done > 0).length
  const hasHistory = elapsed.length > 0

  return (
    <section
      aria-labelledby="week-heading"
      className={cn('rise px-1 sm:px-2', className)}
      style={{ '--d': '540ms' } as React.CSSProperties}
    >
      <SectionHeader
        eyebrow="Perspective"
        title="Your week"
        id="week-heading"
        meta={hasHistory ? `Showed up ${keptDays} of ${elapsed.length} days` : undefined}
      />

      <ol className="mt-6 grid grid-cols-7 gap-2">
        {days.map((d) => {
          const date = new Date(d.date)
          const isToday = d.date === today
          const isFuture = d.date > today
          const ratio = d.scheduled > 0 ? d.done / d.scheduled : 0
          const name = date.toLocaleDateString('en-US', { weekday: 'long' })

          return (
            <li key={d.date} className="flex flex-col items-center gap-2.5">
              <span className="sr-only">
                {name}: {isFuture ? 'upcoming' : d.scheduled > 0 ? `${d.done} of ${d.scheduled} habits` : 'no habits'}
                {d.mood ? `, mood ${MOOD_LABELS[d.mood].toLowerCase()}` : ''}
              </span>
              <span
                aria-hidden
                className={cn(
                  'relative flex h-20 w-full max-w-[30px] items-end overflow-hidden rounded-full',
                  isFuture ? 'border border-dashed border-foreground/10' : 'bg-foreground/[0.05]',
                  isToday && 'shadow-[0_0_0_1px_rgba(70,199,183,0.5)]',
                )}
              >
                {!isFuture && (
                  <span
                    className={cn('w-full rounded-full transition-[height] duration-700 ease-out', isToday ? 'bg-primary' : 'bg-primary/45')}
                    style={{ height: `${Math.max(ratio * 100, d.scheduled > 0 && ratio > 0 ? 14 : 0)}%` }}
                  />
                )}
              </span>
              <span aria-hidden className="flex h-3.5 items-center text-primary/80">
                {d.mood && <MoonPhase level={d.mood} size={12} />}
              </span>
              <span
                aria-hidden
                className={cn('text-[11px] font-medium uppercase tracking-[0.12em]', isToday ? 'text-primary' : 'text-subtle')}
              >
                {name.slice(0, 1)}
              </span>
            </li>
          )
        })}
      </ol>
      {!hasHistory && (
        <p className="mt-4 text-[13px] text-subtle">Your week will take shape as you go — no catching up required.</p>
      )}
    </section>
  )
}

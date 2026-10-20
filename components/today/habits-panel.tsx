import { BookOpen, Check, Droplets, Leaf, Moon, PenLine, PersonStanding, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { numberWord } from '@/lib/today/time'
import type { Habit, HabitIcon } from '@/lib/today/types'
import type { TodayActions } from '@/lib/today/use-today'
import { SectionHeader } from './primitives'

const ICONS: Record<HabitIcon, LucideIcon> = {
  pen: PenLine,
  water: Droplets,
  stretch: PersonStanding,
  book: BookOpen,
  moon: Moon,
  leaf: Leaf,
}

export function HabitsPanel({ habits, actions, className }: { habits: Habit[]; actions: TodayActions; className?: string }) {
  const done = habits.filter((h) => h.done).length
  const left = habits.length - done

  return (
    <section
      aria-labelledby="habits-heading"
      className={cn('rise surface rounded-[28px] p-6 sm:p-7', className)}
      style={{ '--d': '420ms' } as React.CSSProperties}
    >
      <SectionHeader
        eyebrow="Rhythm"
        title="Habits"
        id="habits-heading"
        meta={habits.length > 0 && <span><span className="text-foreground">{done}</span> of {habits.length} kept</span>}
      />

      {habits.length === 0 ? (
        <div className="mt-6 flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/[0.04] text-subtle">
            <Leaf className="size-[18px]" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="text-[15px] text-foreground">No habits scheduled today.</p>
            <p className="mt-1 text-[14px] leading-relaxed text-subtle">Rest days are part of the rhythm too.</p>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-1">
            {habits.map((h) => (
              <HabitRow key={h.id} habit={h} onToggle={() => actions.toggleHabit(h.id)} />
            ))}
          </ul>
          <p className="mt-4 border-t border-hairline pt-4 text-[13px] text-subtle">
            {left === 0
              ? 'Every habit kept today. Nicely done.'
              : `No rush — ${numberWord(left)} left for later in the day.`}
          </p>
        </>
      )}
    </section>
  )
}

function HabitRow({ habit, onToggle }: { habit: Habit; onToggle: () => void }) {
  const Icon = ICONS[habit.icon]
  const days = [...habit.history, habit.done]
  const kept = days.filter(Boolean).length

  return (
    <li>
      <button
        type="button"
        aria-pressed={habit.done}
        onClick={onToggle}
        className="group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.035]"
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl transition-colors duration-500',
            habit.done ? 'bg-primary/[0.12] text-primary' : 'bg-foreground/[0.04] text-muted-foreground group-hover:text-foreground',
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-foreground">{habit.name}</span>
          <span className="mt-1 flex items-center gap-2.5 text-[12px] text-subtle">
            {habit.window}
            <span aria-hidden className="flex items-center gap-[3px]">
              {days.map((d, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-[5px] rounded-full transition-colors duration-500',
                    d ? 'bg-primary/70' : 'bg-foreground/[0.12]',
                    i === days.length - 1 && 'ring-1 ring-foreground/25 ring-offset-1 ring-offset-transparent',
                  )}
                />
              ))}
            </span>
            <span className="sr-only">
              Kept {kept} of the last 7 days. {habit.done ? 'Done today.' : 'Not yet done today.'}
            </span>
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full border transition-all duration-300',
            habit.done
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/35 text-transparent group-hover:border-primary/70 group-hover:text-primary/50',
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </button>
    </li>
  )
}

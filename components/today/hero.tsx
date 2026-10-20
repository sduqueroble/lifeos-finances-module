import { MapPin, Moon, Sunrise } from 'lucide-react'
import { cn } from '@/lib/utils'
import { composeMessage } from '@/lib/today/narrative'
import {
  HOUR,
  dayOfYear,
  eventStatus,
  formatDuration,
  formatRange,
  formatTime,
  greetingFor,
  isoWeek,
  MINUTE,
  numberWord,
  startOfDay,
} from '@/lib/today/time'
import type { CalendarEvent, Habit, TodayData } from '@/lib/today/types'
import { ProgressRing } from './primitives'

const USER_NAME = 'Santiago'

export function Hero({ data, now }: { data: TodayData; now: number }) {
  const date = new Date(now)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <section aria-labelledby="today-heading" className="relative">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div className="rise">
          <p className="flex items-center gap-2.5 text-[15px] text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(70,199,183,0.7)]" />
            {greetingFor(date.getHours())}, {USER_NAME}
          </p>
          <h1
            id="today-heading"
            className="mt-6 font-serif text-[58px] leading-[0.9] tracking-[-0.025em] text-foreground sm:text-[80px] lg:text-[104px]"
          >
            <span className="block">{weekday},</span>
            <span className="block italic text-[#B4C4D3]">{monthDay}</span>
          </h1>
          <p className="mt-7 max-w-[36rem] text-pretty text-[17px] leading-relaxed text-muted-foreground">
            {composeMessage(data, now)}
          </p>
          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.2em] tabular-nums text-subtle">
            Week {isoWeek(now)} <span aria-hidden className="mx-2 text-hairline">/</span> Day {dayOfYear(now)}
            <span aria-hidden className="mx-2 text-hairline">/</span> {formatTime(now)}
          </p>
        </div>
        <Glance events={data.events} habits={data.habits} now={now} />
      </div>
      <DayHorizon events={data.events} now={now} />
    </section>
  )
}

function Glance({ events, habits, now }: { events: CalendarEvent[]; habits: Habit[]; now: number }) {
  return (
    <div
      className="rise surface grid overflow-hidden rounded-[28px] sm:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
      style={{ '--d': '120ms' } as React.CSSProperties}
    >
      <NextUp events={events} now={now} />
      <HabitsGlance habits={habits} />
    </div>
  )
}

function NextUp({ events, now }: { events: CalendarEvent[]; now: number }) {
  const current = events.find((e) => eventStatus(e, now) === 'now')
  const next = events.filter((e) => eventStatus(e, now) === 'upcoming').sort((a, b) => a.start - b.start)[0]
  const event = current ?? next

  return (
    <div className="flex min-h-[184px] flex-col p-6">
      {current ? (
        <p className="flex items-center gap-2 text-[12px] font-medium text-primary">
          <span className="relative flex size-2" aria-hidden>
            <span className="halo absolute inset-0 rounded-full bg-primary" />
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          Happening now
        </p>
      ) : (
        <p className="eyebrow">{next ? `Up next · in ${formatDuration((next.start - now) / MINUTE)}` : 'Next up'}</p>
      )}

      {event ? (
        <>
          <p className="mt-4 text-balance font-serif text-[26px] leading-[1.1] text-foreground">{event.title}</p>
          <div className="mt-auto space-y-1.5 pt-4 text-[13px] text-muted-foreground">
            <p className="tabular-nums">
              {formatRange(event.start, event.end)}
              {current && (
                <span className="text-subtle"> · {formatDuration((current.end - now) / MINUTE)} left</span>
              )}
            </p>
            {event.location && (
              <p className="flex items-center gap-1.5 text-subtle">
                <MapPin className="size-3.5" aria-hidden /> {event.location}
              </p>
            )}
          </div>
          {current && (
            <div
              className="mt-4 h-[3px] overflow-hidden rounded-full bg-foreground/[0.07]"
              role="progressbar"
              aria-label="Event progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(((now - current.start) / (current.end - current.start)) * 100)}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-1000"
                style={{ width: `${((now - current.start) / (current.end - current.start)) * 100}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-4 font-serif text-[26px] italic leading-[1.1] text-foreground">The rest of today is yours.</p>
          <p className="mt-auto pt-4 text-[13px] leading-relaxed text-subtle">
            {events.length > 0
              ? 'That was your last event. Enjoy the open space.'
              : 'Nothing on the calendar — room to think, move, or rest.'}
          </p>
        </>
      )}
    </div>
  )
}

function HabitsGlance({ habits }: { habits: Habit[] }) {
  const total = habits.length
  const done = habits.filter((h) => h.done).length
  const complete = total > 0 && done === total

  return (
    <div className="flex items-center gap-5 border-t border-hairline p-6 sm:flex-col sm:items-start sm:justify-between sm:border-l sm:border-t-0">
      <p className="eyebrow hidden sm:block">Habits</p>
      <ProgressRing total={total} done={done}>
        {total > 0 ? (
          <span className="font-serif text-[22px] leading-none tabular-nums text-foreground">
            {done}
            <span className="text-subtle">/{total}</span>
          </span>
        ) : (
          <span className="font-serif text-[22px] italic leading-none text-subtle">—</span>
        )}
      </ProgressRing>
      <div className="min-w-0">
        <p className="eyebrow sm:hidden">Habits</p>
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground sm:mt-0">
          {total === 0
            ? 'None scheduled — a rest day for routines.'
            : complete
              ? 'All kept today.'
              : `${capitalizeWord(numberWord(total - done))} still open, whenever suits you.`}
        </p>
      </div>
    </div>
  )
}

const capitalizeWord = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const DAY_START_HOUR = 6
const DAY_END_HOUR = 24
const HOUR_MARKS = [6, 9, 12, 15, 18, 21, 24]

function hourLabel(h: number) {
  const hour = h % 24
  const suffix = hour < 12 ? 'AM' : 'PM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return h === 6 || h === 12 || h === 24 ? `${display} ${suffix}` : String(display)
}

function DayHorizon({ events, now }: { events: CalendarEvent[]; now: number }) {
  const dayStart = startOfDay(now)
  const span = (DAY_END_HOUR - DAY_START_HOUR) * HOUR
  const pos = (ms: number) => Math.min(Math.max((ms - dayStart - DAY_START_HOUR * HOUR) / span, 0), 1) * 100
  const nowPct = pos(now)
  const nowVisible = now >= dayStart + DAY_START_HOUR * HOUR

  return (
    <div className="rise mt-12 lg:mt-16" style={{ '--d': '220ms' } as React.CSSProperties}>
      <div className="flex items-center gap-4">
        <Sunrise className="size-4 shrink-0 text-subtle" aria-hidden />
        <div
          className="relative h-12 flex-1"
          role="img"
          aria-label={`Day timeline from 6 AM to midnight with ${events.length} event${events.length === 1 ? '' : 's'}. It is now ${formatTime(now)}.`}
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/[0.09]" />
          {nowVisible && (
            <div
              className="absolute left-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/70"
              style={{ width: `${nowPct}%` }}
            />
          )}
          {HOUR_MARKS.map((h) => (
            <span
              key={h}
              aria-hidden
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/15"
              style={{ left: `${((h - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)) * 100}%` }}
            />
          ))}
          {events.map((e) => {
            const status = eventStatus(e, now)
            const left = pos(e.start)
            const width = Math.max(pos(e.end) - left, 0.8)
            return (
              <span
                key={e.id}
                aria-hidden
                title={`${e.title} · ${formatRange(e.start, e.end)}`}
                className={cn(
                  'absolute top-1/2 h-[7px] -translate-y-1/2 rounded-full transition-colors',
                  status === 'past' && 'bg-foreground/20',
                  status === 'now' && 'bg-primary shadow-[0_0_14px_rgba(70,199,183,0.55)]',
                  status === 'upcoming' && 'bg-[#4F6B85]',
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            )
          })}
          {nowVisible && (
            <div aria-hidden className="absolute inset-y-0 w-0" style={{ left: `${nowPct}%` }}>
              <span className="absolute bottom-[calc(50%+10px)] left-0 -translate-x-1/2 text-[10px] font-medium uppercase leading-none tracking-[0.16em] text-primary">
                Now
              </span>
              <span className="absolute left-0 top-1/2 flex size-3 -translate-x-1/2 -translate-y-1/2">
                <span className="halo absolute inset-0 rounded-full bg-primary" />
                <span className="relative size-3 rounded-full border-2 border-background bg-primary" />
              </span>
            </div>
          )}
        </div>
        <Moon className="size-4 shrink-0 text-subtle" aria-hidden />
      </div>
      <div aria-hidden className="relative mx-8 mt-1 h-4 text-[11px] tabular-nums text-subtle">
        {HOUR_MARKS.map((h, i) => (
          <span
            key={h}
            className={cn(
              'absolute top-0 whitespace-nowrap',
              i === 0 ? '' : i === HOUR_MARKS.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
              i % 2 === 1 && 'hidden sm:inline',
            )}
            style={{ left: `${((h - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)) * 100}%` }}
          >
            {hourLabel(h)}
          </span>
        ))}
      </div>
    </div>
  )
}

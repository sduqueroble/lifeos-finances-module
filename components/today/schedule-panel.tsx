'use client'

import { Fragment, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DAY,
  HOUR,
  MINUTE,
  eventStatus,
  formatDuration,
  formatTime,
  fromTimeInput,
  startOfDay,
  toTimeInput,
} from '@/lib/today/time'
import type { CalendarEvent } from '@/lib/today/types'
import type { TodayActions } from '@/lib/today/use-today'
import { GhostButton, SectionHeader } from './primitives'

export function SchedulePanel({
  events,
  now,
  actions,
  className,
}: {
  events: CalendarEvent[]
  now: number
  actions: TodayActions
  className?: string
}) {
  const [adding, setAdding] = useState(false)
  const remaining = events.filter((e) => eventStatus(e, now) !== 'past').length
  const hasCurrent = events.some((e) => eventStatus(e, now) === 'now')
  const nowIndex = hasCurrent ? -1 : events.findIndex((e) => e.start > now)
  const markerIndex = hasCurrent || events.length === 0 ? -1 : nowIndex === -1 ? events.length : nowIndex

  return (
    <section
      aria-labelledby="schedule-heading"
      className={cn('rise px-1 sm:px-2', className)}
      style={{ '--d': '360ms' } as React.CSSProperties}
    >
      <SectionHeader
        eyebrow="Calendar"
        title="Schedule"
        id="schedule-heading"
        meta={events.length > 0 ? `${remaining} ahead` : undefined}
        action={
          !adding && (
            <GhostButton onClick={() => setAdding(true)} aria-label="Add event" className="-mr-2">
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Add</span>
            </GhostButton>
          )
        }
      />

      {adding && <AddEventForm now={now} onCancel={() => setAdding(false)} onAdd={(e) => (actions.addEvent(e), setAdding(false))} />}

      {events.length === 0 ? (
        !adding && (
          <div className="mt-6 rounded-2xl border border-dashed border-foreground/10 px-5 py-6">
            <p className="font-serif text-[22px] italic leading-tight text-foreground">An open calendar.</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-subtle">
              No events today. Block out time for something that matters, or leave it wide open.
            </p>
          </div>
        )
      ) : (
        <ol className="mt-7" aria-label="Today's events">
          {events.map((event, i) => (
            <Fragment key={event.id}>
              {i === markerIndex && <NowMarker now={now} />}
              <TimelineItem event={event} now={now} isLast={i === events.length - 1 && markerIndex !== events.length} />
            </Fragment>
          ))}
          {markerIndex === events.length && <NowMarker now={now} isLast />}
        </ol>
      )}
    </section>
  )
}

function NowMarker({ now, isLast }: { now: number; isLast?: boolean }) {
  return (
    <li className="grid grid-cols-[60px_16px_1fr] items-center gap-x-4" aria-label={`Now, ${formatTime(now)}`}>
      <span className="text-right text-[12px] font-medium tabular-nums text-primary">{formatTime(now)}</span>
      <span className="relative flex h-8 justify-center">
        <span className={cn('absolute top-0 w-px bg-foreground/10', isLast ? 'h-1/2' : 'h-full')} />
        <span className="relative mt-[13px] size-[7px] rounded-full bg-primary shadow-[0_0_10px_rgba(70,199,183,0.8)]" />
      </span>
      <span className="h-px bg-gradient-to-r from-primary/60 to-transparent" />
    </li>
  )
}

function TimelineItem({ event, now, isLast }: { event: CalendarEvent; now: number; isLast: boolean }) {
  const status = eventStatus(event, now)
  const duration = (event.end - event.start) / MINUTE

  return (
    <li className="grid grid-cols-[60px_16px_1fr] gap-x-4">
      <time
        dateTime={new Date(event.start).toISOString()}
        className={cn(
          'pt-[3px] text-right text-[13px] tabular-nums',
          status === 'past' ? 'text-subtle/70' : status === 'now' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {formatTime(event.start)}
      </time>
      <div className="relative flex justify-center">
        {!isLast && <span aria-hidden className="absolute bottom-0 top-0 w-px bg-foreground/10" />}
        {isLast && <span aria-hidden className="absolute top-0 h-3 w-px bg-foreground/10" />}
        <span
          aria-hidden
          className={cn(
            'relative mt-[7px] rounded-full',
            status === 'past' && 'size-[7px] bg-[#2A3B4D]',
            status === 'now' && 'mt-[5px] size-[11px] bg-primary shadow-[0_0_0_4px_rgba(70,199,183,0.15)]',
            status === 'upcoming' && 'size-[9px] border border-muted-foreground/60 bg-background',
          )}
        />
      </div>
      <div className={cn('min-w-0 pb-7', isLast && 'pb-1')}>
        <div
          className={cn(
            'rounded-2xl transition-colors',
            status === 'now' && '-mx-3 -mt-2 bg-primary/[0.07] px-3 pb-3 pt-2 shadow-[inset_0_0_0_1px_rgba(70,199,183,0.16)]',
          )}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p
              className={cn(
                'text-[15px] leading-snug',
                status === 'past' ? 'text-subtle' : 'text-foreground',
                status === 'now' && 'font-medium',
              )}
            >
              {event.title}
            </p>
            {status === 'now' && (
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">Now</span>
            )}
          </div>
          <p className={cn('mt-1 flex flex-wrap items-center gap-x-2 text-[12px] tabular-nums', status === 'past' ? 'text-subtle/70' : 'text-subtle')}>
            <span>
              {status === 'now' ? `Until ${formatTime(event.end)} · ${formatDuration((event.end - now) / MINUTE)} left` : `${formatDuration(duration)} · ends ${formatTime(event.end)}`}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {event.location}
              </span>
            )}
          </p>
          {status === 'now' && (
            <div className="mt-2.5 h-[2px] overflow-hidden rounded-full bg-foreground/[0.08]" aria-hidden>
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${((now - event.start) / (event.end - event.start)) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function AddEventForm({
  now,
  onAdd,
  onCancel,
}: {
  now: number
  onAdd: (e: Omit<CalendarEvent, 'id'>) => void
  onCancel: () => void
}) {
  const dayStart = startOfDay(now)
  const latest = dayStart + DAY - MINUTE
  const defaultStart = Math.min(Math.ceil(now / (30 * MINUTE)) * 30 * MINUTE, dayStart + 23 * HOUR)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(toTimeInput(defaultStart))
  const [end, setEnd] = useState(toTimeInput(Math.min(defaultStart + HOUR, latest)))
  const [error, setError] = useState('')

  const field =
    'w-full rounded-xl bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none shadow-[inset_0_0_0_1px_var(--hairline)] transition-shadow placeholder:text-subtle focus:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.5)]'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const startMs = fromTimeInput(start, dayStart)
        const endMs = fromTimeInput(end, dayStart)
        if (!title.trim()) return setError('Give the event a name.')
        if (!start || !end || endMs <= startMs) return setError('The end time should come after the start.')
        onAdd({ title: title.trim(), start: startMs, end: endMs })
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="surface mt-6 rounded-2xl p-4"
    >
      <label htmlFor="event-title" className="sr-only">
        Event name
      </label>
      <input
        id="event-title"
        autoFocus
        value={title}
        onChange={(e) => (setTitle(e.target.value), setError(''))}
        onKeyDown={(e) => e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229) && e.preventDefault()}
        placeholder="What's happening?"
        className={field}
      />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="event-start" className="eyebrow mb-2 block">
            Starts
          </label>
          <input id="event-start" type="time" value={start} onChange={(e) => (setStart(e.target.value), setError(''))} className={cn(field, 'tabular-nums')} />
        </div>
        <div>
          <label htmlFor="event-end" className="eyebrow mb-2 block">
            Ends
          </label>
          <input id="event-end" type="time" value={end} onChange={(e) => (setEnd(e.target.value), setError(''))} className={cn(field, 'tabular-nums')} />
        </div>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-[18px] text-[12px] text-warm">
        {error}
      </p>
      <div className="flex justify-end gap-2">
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
        >
          Add event
        </button>
      </div>
    </form>
  )
}

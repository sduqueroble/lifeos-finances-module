'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import {
  ArrowUpToLine,
  Check,
  ChevronDown,
  CornerDownLeft,
  EyeOff,
  History,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { capitalize, numberWord } from '@/lib/today/time'
import type { Area, Task } from '@/lib/today/types'
import type { TodayActions } from '@/lib/today/use-today'
import { AreaTag, GhostButton, RoundCheck, SectionHeader } from './primitives'

const TAG_RE = /(^|\s)#(work|study|health|home|finance|personal)\b/i

function parseTask(raw: string): { title: string; area?: Area } {
  const match = raw.match(TAG_RE)
  const area = match ? (capitalize(match[2].toLowerCase()) as Area) : undefined
  const title = raw.replace(TAG_RE, ' ').replace(/\s+/g, ' ').trim()
  return { title, area }
}

const isComposing = (e: KeyboardEvent) => e.nativeEvent.isComposing || e.keyCode === 229

export function TasksPanel({ tasks, actions, className }: { tasks: Task[]; actions: TodayActions; className?: string }) {
  const todays = tasks.filter((t) => !t.overdueSince)
  const open = todays.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const overdue = tasks.filter((t) => t.overdueSince && !t.done && !t.hiddenFromToday)
  const setAside = tasks.filter((t) => t.hiddenFromToday && !t.done)
  const [showDone, setShowDone] = useState(false)
  const [showOverdue, setShowOverdue] = useState(false)
  const [showSetAside, setShowSetAside] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openCount = open.length + overdue.length

  return (
    <section
      aria-labelledby="tasks-heading"
      className={cn('rise surface-strong rounded-[32px] p-6 sm:p-8', className)}
      style={{ '--d': '300ms' } as React.CSSProperties}
    >
      <SectionHeader
        eyebrow="Focus"
        title="Today's tasks"
        id="tasks-heading"
        meta={
          tasks.length > 0 && (
            <span>
              <span className="text-foreground">{openCount}</span> open
              <span aria-hidden className="mx-1.5 text-subtle">·</span>
              {done.length} done
            </span>
          )
        }
      />

      {tasks.length > 0 && <CompletionLine total={todays.length} done={todays.filter((t) => t.done).length} />}

      {overdue.length > 0 && (
        <div className="mt-6 rounded-2xl bg-warm/[0.06] shadow-[inset_0_0_0_1px_rgba(226,184,122,0.14)]">
          <button
            type="button"
            onClick={() => setShowOverdue((v) => !v)}
            aria-expanded={showOverdue}
            aria-controls="overdue-list"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <History className="size-4 shrink-0 text-warm" aria-hidden />
            <span className="flex-1 text-[14px] text-foreground/90">
              {capitalize(numberWord(overdue.length))} {overdue.length === 1 ? 'task' : 'tasks'} carried over from earlier
            </span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-warm">
              {showOverdue ? 'Hide' : 'Review'}
              <ChevronDown className={cn('size-3.5 transition-transform duration-300', showOverdue && 'rotate-180')} aria-hidden />
            </span>
          </button>
          {showOverdue && (
            <div id="overdue-list" className="px-4 pb-3">
              <ul className="border-t border-warm/10 pt-1">
                {overdue.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    actions={actions}
                    onBringToToday={() => actions.bringToToday(t.id)}
                    onHide={() => actions.hideFromToday(t.id)}
                  />
                ))}
              </ul>
              {overdue.length > 1 && (
                <GhostButton onClick={() => actions.bringToToday()} className="mt-1 text-warm hover:text-warm">
                  <ArrowUpToLine className="size-3.5" aria-hidden /> Bring all into today
                </GhostButton>
              )}
            </div>
          )}
        </div>
      )}

      <AddTaskForm inputRef={inputRef} onAdd={actions.addTask} className="mt-6" />

      {tasks.length === 0 ? (
        <div className="px-1 pb-2 pt-10 text-center sm:pt-14">
          <p className="font-serif text-[28px] italic leading-tight text-foreground">Nothing on your list yet.</p>
          <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-subtle">
            {"What's one thing that would make today feel well spent?"}
          </p>
        </div>
      ) : open.length === 0 ? (
        <div className="flex items-center gap-4 px-1 pb-1 pt-8">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="size-[18px]" aria-hidden />
          </span>
          <div>
            <p className="font-serif text-[24px] italic leading-tight text-foreground">All clear.</p>
            <p className="text-[14px] text-subtle">
              {overdue.length > 0
                ? 'Today’s list is done. The carried-over ones can wait if they need to.'
                : 'Anything else can wait for tomorrow.'}
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-3" aria-label="Open tasks">
          {open.map((t) => (
            <TaskRow key={t.id} task={t} actions={actions} />
          ))}
        </ul>
      )}

      {setAside.length > 0 && (
        <div className="mt-5 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={() => setShowSetAside((v) => !v)}
            aria-expanded={showSetAside}
            aria-controls="set-aside-list"
            className="-mx-2 flex items-center gap-2 rounded-full px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={cn('size-3.5 transition-transform duration-300', !showSetAside && '-rotate-90')} aria-hidden />
            Set aside
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] tabular-nums">{setAside.length}</span>
          </button>
          {showSetAside && (
            <div id="set-aside-list">
              <p className="mt-2 text-[12px] leading-relaxed text-subtle">
                Hidden from today, still kept. Bring one back whenever it fits.
              </p>
              <ul className="mt-1">
                {setAside.map((t) => (
                  <TaskRow key={t.id} task={t} actions={actions} onRestore={() => actions.restoreToToday(t.id)} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-5 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            aria-controls="done-list"
            className="-mx-2 flex items-center gap-2 rounded-full px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={cn('size-3.5 transition-transform duration-300', !showDone && '-rotate-90')} aria-hidden />
            Completed today
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] tabular-nums">{done.length}</span>
          </button>
          {showDone && (
            <ul id="done-list" className="mt-2">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} actions={actions} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function CompletionLine({ total, done }: { total: number; done: number }) {
  if (total === 0) return null
  return (
    <div className="mt-6 flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn('h-[3px] flex-1 rounded-full transition-colors duration-700', i < done ? 'bg-primary' : 'bg-foreground/[0.07]')}
        />
      ))}
    </div>
  )
}

function AddTaskForm({
  inputRef,
  onAdd,
  className,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onAdd: (title: string, area?: Area) => void
  className?: string
}) {
  const [value, setValue] = useState('')
  const parsed = parseTask(value)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!parsed.title) return
        onAdd(parsed.title, parsed.area)
        setValue('')
      }}
      className={cn(
        'group/add flex items-center gap-3.5 rounded-2xl bg-background/40 px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--hairline)] transition-[background-color,box-shadow] duration-300 focus-within:bg-background/60 focus-within:shadow-[inset_0_0_0_1px_rgba(70,199,183,0.45),0_0_0_4px_rgba(70,199,183,0.06)]',
        className,
      )}
    >
      <Plus className="size-[18px] shrink-0 text-subtle transition-colors group-focus-within/add:text-primary" aria-hidden />
      <label htmlFor="new-task" className="sr-only">
        Add a task. Use a hashtag like #study to tag an area.
      </label>
      <input
        id="new-task"
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && isComposing(e)) e.preventDefault()
          if (e.key === 'Escape') {
            setValue('')
            e.currentTarget.blur()
          }
        }}
        placeholder="Add a task  ·  #tag to file it"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle"
      />
      {parsed.area && <AreaTag area={parsed.area} />}
      {value ? (
        <button
          type="submit"
          disabled={!parsed.title}
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <CornerDownLeft className="size-3.5" aria-hidden />
          <span className="sr-only">Add task</span>
        </button>
      ) : (
        <kbd
          aria-hidden
          className="hidden h-6 min-w-6 place-items-center rounded-md px-1.5 font-sans text-[11px] text-subtle shadow-[inset_0_0_0_1px_var(--hairline)] group-focus-within/add:hidden sm:grid"
        >
          N
        </kbd>
      )}
    </form>
  )
}

function TaskRow({
  task,
  actions,
  onBringToToday,
  onHide,
  onRestore,
}: {
  task: Task
  actions: TodayActions
  onBringToToday?: () => void
  onHide?: () => void
  onRestore?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const [completing, setCompleting] = useState(false)
  const checked = task.done || completing

  function toggle() {
    if (task.done) return actions.toggleTask(task.id)
    setCompleting(true)
    window.setTimeout(() => actions.toggleTask(task.id), 420)
  }

  function commit() {
    const title = draft.trim()
    if (title) actions.editTask(task.id, title)
    else setDraft(task.title)
    setEditing(false)
  }

  return (
    <li
      className={cn(
        'group relative -mx-3 flex items-start gap-4 rounded-2xl px-3 py-3.5 transition-[background-color,opacity] duration-300 hover:bg-foreground/[0.03] focus-within:bg-foreground/[0.03]',
        completing && 'opacity-60',
      )}
    >
      <RoundCheck
        checked={checked}
        onClick={toggle}
        label={`${task.title}: mark as ${task.done ? 'not done' : 'done'}`}
        className="mt-px"
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              commit()
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor={`edit-${task.id}`} className="sr-only">
              Edit task
            </label>
            <input
              id={`edit-${task.id}`}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isComposing(e)) e.preventDefault()
                if (e.key === 'Escape') {
                  setDraft(task.title)
                  setEditing(false)
                }
              }}
              className="-my-1 min-w-0 flex-1 rounded-lg bg-background/60 px-2 py-1 text-[15px] text-foreground outline-none shadow-[inset_0_0_0_1px_rgba(70,199,183,0.45)]"
            />
          </form>
        ) : (
          <p
            onDoubleClick={() => !task.done && setEditing(true)}
            className={cn(
              'text-pretty text-[15px] leading-snug transition-colors duration-300',
              checked ? 'text-subtle line-through decoration-subtle/50' : 'text-foreground',
            )}
          >
            {task.title}
          </p>
        )}
        {task.overdueSince && !editing && (
          <p className="mt-1.5 text-[12px] text-warm/80">From {task.overdueSince.toLowerCase()}</p>
        )}
      </div>

      {!editing && (
        <div className="-my-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          {onBringToToday && (
            <button
              type="button"
              onClick={onBringToToday}
              className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-warm transition-colors hover:bg-warm/10"
            >
              Today
              <span className="sr-only">: move {task.title} to today</span>
            </button>
          )}
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              title="Hide from Today — it stays in Set aside"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-subtle transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <EyeOff className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Hide</span>
              <span className="sr-only">
                <span className="sm:hidden">Hide</span> {task.title} from Today
              </span>
            </button>
          )}
          {onRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Undo2 className="size-3.5" aria-hidden />
              Restore
              <span className="sr-only">: show {task.title} in Today again</span>
            </button>
          )}
          {!task.done && (
            <IconAction label={`Edit ${task.title}`} onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" aria-hidden />
            </IconAction>
          )}
          <IconAction label={`Delete ${task.title}`} onClick={() => actions.deleteTask(task.id)}>
            {task.done ? <X className="size-3.5" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />}
          </IconAction>
        </div>
      )}
    </li>
  )
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      {children}
    </button>
  )
}

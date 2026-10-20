import { DAY, HOUR, MINUTE, startOfDay } from './time'
import type { CalendarEvent, Habit, Level, Scenario, Task, TodayData, WeekDay } from './types'

const PAST_SCHEDULED = [5, 5, 4, 5, 5, 3, 3]
const PAST_DONE = [4, 5, 2, 3, 5, 2, 3]
const PAST_MOOD: (Level | undefined)[] = [4, 3, undefined, 2, 4, 5, 4]

function buildWeek(now: number, withHistory: boolean): WeekDay[] {
  const today = startOfDay(now)
  return Array.from({ length: 7 }, (_, i) => {
    const date = today + (i - 6) * DAY
    if (i === 6 || !withHistory) return { date, scheduled: 0, done: 0 }
    return { date, scheduled: PAST_SCHEDULED[i], done: PAST_DONE[i], mood: PAST_MOOD[i] }
  })
}

function buildEvents(now: number): CalendarEvent[] {
  const dayStart = startOfDay(now)
  const hourOfDay = (now - dayStart) / HOUR
  const anchorHour = Math.min(Math.max(hourOfDay, 9.5), 18)
  const anchor = dayStart + Math.floor((anchorHour * HOUR) / (15 * MINUTE)) * 15 * MINUTE
  const dayEnd = dayStart + DAY - MINUTE
  const at = (offsetHours: number) => Math.min(anchor + offsetHours * HOUR, dayEnd)

  return [
    { id: 'e1', title: 'Morning run', start: at(-3), end: at(-2.25), location: 'Riverside loop' },
    { id: 'e2', title: 'Design review with Maya', start: at(-0.25), end: at(0.75), location: 'Studio · Room 2' },
    { id: 'e3', title: 'Spanish — lesson 14', start: at(1.75), end: at(2.5), location: 'Online' },
    { id: 'e4', title: 'Dinner with Jonah', start: at(4.5), end: at(6), location: 'Osteria Lucca' },
  ]
}

const POPULATED_TASKS: Task[] = [
  { id: 't1', title: 'Finalize the Q4 budget draft', done: false, area: 'Finance' },
  { id: 't2', title: 'Outline chapter three of the thesis', done: false, area: 'Study' },
  { id: 't3', title: 'Reply to Maya about the offsite', done: true, area: 'Work' },
  { id: 't4', title: 'Pick up prescription', done: false, area: 'Health' },
  { id: 't5', title: 'Book flights for December', done: false, area: 'Personal' },
  { id: 't6', title: 'Submit expense report', done: false, area: 'Work', overdueSince: 'Yesterday' },
  { id: 't7', title: 'Call the landlord about the heater', done: false, area: 'Home', overdueSince: '3 days ago' },
]

const HABITS: Habit[] = [
  { id: 'h1', name: 'Morning pages', icon: 'pen', window: 'Morning', done: true, history: [true, true, false, true, true, true] },
  { id: 'h2', name: 'Two litres of water', icon: 'water', window: 'Anytime', done: false, history: [true, true, true, false, true, true] },
  { id: 'h3', name: 'Stretch for ten minutes', icon: 'stretch', window: 'Morning', done: true, history: [false, true, false, true, true, false] },
  { id: 'h4', name: 'Read twenty pages', icon: 'book', window: 'Evening', done: false, history: [true, false, true, true, false, true] },
  { id: 'h5', name: 'Screens off by 10:30', icon: 'moon', window: 'Evening', done: false, history: [false, true, false, false, true, false] },
]

export function buildScenario(scenario: Exclude<Scenario, 'loading'>, nowDate: Date): TodayData {
  const now = nowDate.getTime()

  if (scenario === 'empty') {
    return { tasks: [], events: [], habits: [], checkIn: null, week: buildWeek(now, false) }
  }

  if (scenario === 'complete') {
    return {
      tasks: POPULATED_TASKS.filter((t) => !t.overdueSince).map((t) => ({ ...t, done: true })),
      events: buildEvents(now),
      habits: HABITS.map((h) => ({ ...h, done: true })),
      checkIn: {
        mood: 4,
        energy: 3,
        note: 'A long walk at lunch helped more than I expected.',
        savedAt: now - 2 * HOUR,
      },
      week: buildWeek(now, true),
    }
  }

  return {
    tasks: POPULATED_TASKS.map((t) => ({ ...t })),
    events: buildEvents(now),
    habits: HABITS.map((h) => ({ ...h, history: [...h.history] })),
    checkIn: null,
    week: buildWeek(now, true),
  }
}

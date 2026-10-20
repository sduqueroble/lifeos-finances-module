import type { CalendarEvent, EventStatus } from './types'

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export function formatTime(ms: number) {
  return timeFormatter.format(ms)
}

export function formatRange(start: number, end: number) {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function formatDuration(minutes: number) {
  const m = Math.max(1, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

export function startOfDay(ms: number) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function greetingFor(hour: number) {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Good night'
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function numberWord(n: number) {
  return n >= 0 && n <= 10 ? WORDS[n] : String(n)
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function isoWeek(ms: number) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / DAY - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

export function dayOfYear(ms: number) {
  const d = new Date(ms)
  const start = new Date(d.getFullYear(), 0, 0).getTime()
  return Math.floor((startOfDay(ms) - start) / DAY)
}

export function eventStatus(event: CalendarEvent, now: number): EventStatus {
  if (now >= event.end) return 'past'
  if (now >= event.start) return 'now'
  return 'upcoming'
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toTimeInput(ms: number) {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromTimeInput(value: string, dayStart: number) {
  const [h, m] = value.split(':').map(Number)
  return dayStart + h * HOUR + m * MINUTE
}

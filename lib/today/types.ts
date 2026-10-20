export type Area = 'Work' | 'Study' | 'Health' | 'Home' | 'Finance' | 'Personal'

export const AREAS: Area[] = ['Work', 'Study', 'Health', 'Home', 'Finance', 'Personal']

export const AREA_COLOR: Record<Area, string> = {
  Work: '#7FA6D9',
  Study: '#A7A2DA',
  Health: '#46C7B7',
  Home: '#E2B87A',
  Finance: '#8FC4A0',
  Personal: '#D49DB0',
}

export interface Task {
  id: string
  title: string
  done: boolean
  area?: Area
  /** Human label for when the task was originally due, e.g. "Yesterday". Present only for carried-over tasks. */
  overdueSince?: string
  /** Set aside from the Today view without completing or deleting it. */
  hiddenFromToday?: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  start: number
  end: number
  location?: string
}

export type HabitIcon = 'pen' | 'water' | 'stretch' | 'book' | 'moon' | 'leaf'

export interface Habit {
  id: string
  name: string
  icon: HabitIcon
  window: 'Morning' | 'Afternoon' | 'Evening' | 'Anytime'
  done: boolean
  /** Completion for the previous six days, oldest first. */
  history: boolean[]
}

export type Level = 1 | 2 | 3 | 4 | 5

export interface CheckIn {
  mood: Level
  energy: Level
  note: string
  savedAt: number
}

export interface WeekDay {
  date: number
  scheduled: number
  done: number
  mood?: Level
}

export interface TodayData {
  tasks: Task[]
  events: CalendarEvent[]
  habits: Habit[]
  checkIn: CheckIn | null
  week: WeekDay[]
}

export type Scenario = 'populated' | 'empty' | 'complete' | 'loading'

export type EventStatus = 'past' | 'now' | 'upcoming'

export const MOOD_LABELS: Record<Level, string> = {
  1: 'Heavy',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Bright',
}

export const ENERGY_LABELS: Record<Level, string> = {
  1: 'Drained',
  2: 'Low',
  3: 'Steady',
  4: 'Good',
  5: 'Full',
}

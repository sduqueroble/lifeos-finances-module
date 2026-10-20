'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { buildScenario } from './data'
import type { Area, CalendarEvent, CheckIn, Scenario, TodayData } from './types'

type Action =
  | { type: 'load'; data: TodayData | null }
  | { type: 'toggleTask'; id: string }
  | { type: 'addTask'; title: string; area?: Area }
  | { type: 'editTask'; id: string; title: string }
  | { type: 'deleteTask'; id: string }
  | { type: 'bringToToday'; id?: string }
  | { type: 'setHiddenFromToday'; id: string; hidden: boolean }
  | { type: 'toggleHabit'; id: string }
  | { type: 'addEvent'; event: Omit<CalendarEvent, 'id'> }
  | { type: 'updateEvent'; id: string; event: Omit<CalendarEvent, 'id'> }
  | { type: 'saveCheckIn'; checkIn: CheckIn }

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()))

function reducer(state: TodayData | null, action: Action): TodayData | null {
  if (action.type === 'load') return action.data
  if (!state) return state

  switch (action.type) {
    case 'toggleTask':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)) }
    case 'addTask':
      return { ...state, tasks: [...state.tasks, { id: uid(), title: action.title, area: action.area, done: false }] }
    case 'editTask':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, title: action.title } : t)) }
    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'bringToToday':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          (!action.id && !t.hiddenFromToday) || t.id === action.id
            ? { ...t, overdueSince: undefined, hiddenFromToday: undefined }
            : t,
        ),
      }
    case 'setHiddenFromToday':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, hiddenFromToday: action.hidden || undefined } : t)),
      }
    case 'updateEvent':
      return {
        ...state,
        events: state.events
          .map((e) => (e.id === action.id ? { ...action.event, id: e.id } : e))
          .sort((a, b) => a.start - b.start),
      }
    case 'toggleHabit':
      return { ...state, habits: state.habits.map((h) => (h.id === action.id ? { ...h, done: !h.done } : h)) }
    case 'addEvent':
      return {
        ...state,
        events: [...state.events, { ...action.event, id: uid() }].sort((a, b) => a.start - b.start),
      }
    case 'saveCheckIn':
      return { ...state, checkIn: action.checkIn }
  }
}

export function useToday() {
  const [scenario, setScenario] = useState<Scenario>('populated')
  const [data, dispatch] = useReducer(reducer, null)
  const [loading, setLoading] = useState(true)
  const timer = useRef<number | undefined>(undefined)

  const load = useCallback((next: Scenario) => {
    setScenario(next)
    setLoading(true)
    window.clearTimeout(timer.current)
    if (next === 'loading') return
    timer.current = window.setTimeout(() => {
      dispatch({ type: 'load', data: buildScenario(next, new Date()) })
      setLoading(false)
    }, 650)
  }, [])

  useEffect(() => {
    load('populated')
    return () => window.clearTimeout(timer.current)
  }, [load])

  const actions = useMemo(
    () => ({
      toggleTask: (id: string) => dispatch({ type: 'toggleTask', id }),
      addTask: (title: string, area?: Area) => dispatch({ type: 'addTask', title, area }),
      editTask: (id: string, title: string) => dispatch({ type: 'editTask', id, title }),
      deleteTask: (id: string) => dispatch({ type: 'deleteTask', id }),
      bringToToday: (id?: string) => dispatch({ type: 'bringToToday', id }),
      hideFromToday: (id: string) => dispatch({ type: 'setHiddenFromToday', id, hidden: true }),
      restoreToToday: (id: string) => dispatch({ type: 'setHiddenFromToday', id, hidden: false }),
      toggleHabit: (id: string) => dispatch({ type: 'toggleHabit', id }),
      addEvent: (event: Omit<CalendarEvent, 'id'>) => dispatch({ type: 'addEvent', event }),
      updateEvent: (id: string, event: Omit<CalendarEvent, 'id'>) => dispatch({ type: 'updateEvent', id, event }),
      saveCheckIn: (checkIn: CheckIn) => dispatch({ type: 'saveCheckIn', checkIn }),
    }),
    [],
  )

  return { scenario, setScenario: load, data, loading, actions }
}

export type TodayActions = ReturnType<typeof useToday>['actions']

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

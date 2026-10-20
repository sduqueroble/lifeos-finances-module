import { capitalize, eventStatus, formatTime, numberWord } from './time'
import type { TodayData } from './types'

export function composeMessage(data: TodayData, now: number) {
  const { tasks, events, habits } = data
  const openTasks = tasks.filter((t) => !t.done && !t.hiddenFromToday)
  const carried = openTasks.filter((t) => t.overdueSince).length
  const habitsLeft = habits.filter((h) => !h.done).length

  const current = events.find((e) => eventStatus(e, now) === 'now')
  const upcoming = events.filter((e) => eventStatus(e, now) === 'upcoming').sort((a, b) => a.start - b.start)
  const next = upcoming[0]

  if (tasks.length === 0 && events.length === 0 && habits.length === 0) {
    return 'A clear page. Nothing is asking for your attention yet — shape the day however you like.'
  }

  if (openTasks.length === 0 && habitsLeft === 0 && tasks.length + habits.length > 0) {
    if (current) return `Everything you set out to do is done. You're in ${current.title} until ${formatTime(current.end)}, then the day is yours.`
    if (next) return `Everything you set out to do is done. ${next.title} at ${formatTime(next.start)} is all that's left.`
    return 'Everything you set out to do is done. The rest of the day is unhurried.'
  }

  let calendar: string
  if (current) {
    calendar = `You're in ${current.title} until ${formatTime(current.end)}.`
  } else if (next) {
    calendar =
      upcoming.length === 1
        ? `${next.title} at ${formatTime(next.start)} is the last thing on your calendar.`
        : `${next.title} at ${formatTime(next.start)} is next, with ${numberWord(upcoming.length - 1)} more after.`
  } else if (events.length > 0) {
    calendar = 'Your calendar is clear from here.'
  } else {
    calendar = 'No meetings today.'
  }

  let list = ''
  if (openTasks.length > 0) {
    const n = openTasks.length
    list = `${capitalize(numberWord(n))} task${n === 1 ? ' is' : 's are'} open`
    if (carried > 0) list += `, ${numberWord(carried)} carried over`
    list += n >= 5 ? ' — choose the one that matters most.' : ' — plenty of room for them.'
  } else if (tasks.length > 0) {
    list = 'Your list is clear.'
  }

  return [calendar, list].filter(Boolean).join(' ')
}

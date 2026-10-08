import type { YouthEvent } from './types'

export const WARD_TIMEZONE = 'America/Chicago'

export type DayGroup = {
  key: string
  label: string
  events: Array<YouthEvent>
}

function wardParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: WARD_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0'

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    second: Number(value('second')),
  }
}

function wardOffsetMs(date: Date): number {
  const wall = wardParts(date)
  const asUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  )
  return asUtc - date.getTime()
}

function startOfWardDay(date: Date): Date {
  const offset = wardOffsetMs(date)
  const wall = new Date(date.getTime() + offset)
  const startAsUtc = Date.UTC(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
  )
  return new Date(startAsUtc - offset)
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: WARD_TIMEZONE,
  })
}

export function formatTimeRange(event: YouthEvent): string {
  const start = formatClock(event.starts_at)
  const end = formatClock(event.ends_at)
  const startMeridiem = start.slice(-2)
  const endMeridiem = end.slice(-2)
  if (startMeridiem === endMeridiem) {
    return `${start.slice(0, -3)}–${end}`
  }
  return `${start}–${end}`
}

export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WARD_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function formatDayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: WARD_TIMEZONE,
  })
}

export function isUpcoming(event: YouthEvent, now = new Date()): boolean {
  return new Date(event.ends_at).getTime() >= startOfWardDay(now).getTime()
}

export function sortByStart(events: Array<YouthEvent>): Array<YouthEvent> {
  return [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  )
}

export function groupByDay(events: Array<YouthEvent>): Array<DayGroup> {
  const groups = new Map<string, DayGroup>()

  for (const event of sortByStart(events)) {
    const key = dayKey(event.starts_at)
    const existing = groups.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(key, {
        key,
        label: formatDayHeading(event.starts_at),
        events: [event],
      })
    }
  }

  return [...groups.values()]
}

export type WeekGroup = {
  key: string
  label: string
  days: Array<DayGroup>
}

function wardWeekday(date: Date): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: WARD_TIMEZONE,
    weekday: 'short',
  }).format(date)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

function startOfWardWeek(date: Date): Date {
  const day = startOfWardDay(date)
  const weekday = Math.max(0, wardWeekday(day))
  const wall = wardParts(day)
  const sundayNoonUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day - weekday,
    12,
    0,
    0,
  )
  return startOfWardDay(new Date(sundayNoonUtc))
}

function weekStartForEvent(iso: string): Date {
  return startOfWardWeek(new Date(iso))
}

function formatWeekOf(weekStart: Date): string {
  return weekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: WARD_TIMEZONE,
  })
}

function weekLabel(weekStart: Date, now: Date): string {
  const thisWeek = startOfWardWeek(now)
  const thisKey = dayKey(thisWeek.toISOString())
  const key = dayKey(weekStart.toISOString())
  if (key === thisKey) {
    return 'This week'
  }
  const nextWall = wardParts(thisWeek)
  const nextSundayNoon = Date.UTC(
    nextWall.year,
    nextWall.month - 1,
    nextWall.day + 7,
    12,
    0,
    0,
  )
  const nextKey = dayKey(startOfWardDay(new Date(nextSundayNoon)).toISOString())
  if (key === nextKey) {
    return 'Next week'
  }
  return `Week of ${formatWeekOf(weekStart)}`
}

export function groupByWeek(
  events: Array<YouthEvent>,
  now = new Date(),
): Array<WeekGroup> {
  const weeks = new Map<string, { start: Date; events: Array<YouthEvent> }>()

  for (const event of sortByStart(events)) {
    const start = weekStartForEvent(event.starts_at)
    const key = dayKey(start.toISOString())
    const existing = weeks.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      weeks.set(key, { start, events: [event] })
    }
  }

  return [...weeks.entries()].map(([key, group]) => ({
    key,
    label: weekLabel(group.start, now),
    days: groupByDay(group.events),
  }))
}

export function formatParticipantNames(names: Array<string>): string {
  if (names.length === 0) {
    return 'Youth TBD'
  }
  if (names.length === 1) {
    return names[0]
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`
  }
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function localDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`)
}

export function formatPlace(
  event: Pick<YouthEvent, 'location_name' | 'address'>,
  separator = ' · ',
): string {
  return [event.location_name, event.address].filter(Boolean).join(separator)
}

export function formatContact(
  event: Pick<YouthEvent, 'contact_name' | 'contact_email' | 'contact_phone'>,
): string {
  return [event.contact_name, event.contact_email, event.contact_phone]
    .filter(Boolean)
    .join(' · ')
}

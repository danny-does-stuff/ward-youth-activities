import {
  formatContact,
  formatParticipantNames,
  formatPlace,
} from './schedule'
import type { YouthEvent } from './types'

function icsStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function icsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function description(event: YouthEvent): string {
  const lines = [formatParticipantNames(event.participant_names)]
  if (event.notes) lines.push(event.notes)
  const contact = formatContact(event)
  if (contact) {
    lines.push(`Contact: ${contact}`)
  }
  return lines.join('\n')
}

export function eventToIcs(event: YouthEvent): string {
  const uid = `ward-youth-${event.id}@celina-youth-activities`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Celina Ward//Youth Activities//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(event.starts_at)}`,
    `DTEND:${icsStamp(event.ends_at)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(description(event))}`,
  ]
  const location = formatPlace(event, ', ')
  if (location) {
    lines.push(`LOCATION:${icsText(location)}`)
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadEventIcs(event: YouthEvent): void {
  const blob = new Blob([eventToIcs(event)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'event'}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(event: YouthEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsStamp(event.starts_at)}/${icsStamp(event.ends_at)}`,
    details: description(event),
  })
  const location = formatPlace(event, ', ')
  if (location) {
    params.set('location', location)
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

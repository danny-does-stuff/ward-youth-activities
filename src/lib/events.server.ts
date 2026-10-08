import {
  addYouthToEvent,
  deleteEvent,
  insertEvent,
  listEvents,
  listYouthNames,
  updateEventTimes,
} from './db.server'
import { isUpcoming, localDateTime, sortByStart } from './schedule'
import type { YouthEvent } from './types'

export type CreateEventOccurrence = {
  date: string
  start_time: string
  end_time?: string
  location_name?: string
  address?: string
}

export type CreateEventInput = {
  title: string
  participant_names: Array<string>
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  occurrences: Array<CreateEventOccurrence>
}

export async function getUpcomingEvents(): Promise<Array<YouthEvent>> {
  const events = await listEvents()
  return sortByStart(events.filter((event) => isUpcoming(event)))
}

export async function getKnownYouthNames(): Promise<Array<string>> {
  return listYouthNames()
}

export async function getAdminEvents(): Promise<Array<YouthEvent>> {
  return listEvents()
}

function toUTCTimestamp(date: string, time: string): string {
  return localDateTime(date, time).toISOString()
}

function occurrenceTimes(occurrence: CreateEventOccurrence) {
  const starts_at = toUTCTimestamp(occurrence.date, occurrence.start_time)
  const end = occurrence.end_time?.trim()
  return {
    starts_at,
    ends_at: end ? toUTCTimestamp(occurrence.date, end) : starts_at,
  }
}

export async function createEvent(
  input: CreateEventInput,
): Promise<YouthEvent> {
  const created: Array<YouthEvent> = []
  for (const occurrence of input.occurrences) {
    const { starts_at, ends_at } = occurrenceTimes(occurrence)
    created.push(
      await insertEvent({
        title: input.title.trim(),
        participant_names: input.participant_names,
        starts_at,
        ends_at,
        location_name: occurrence.location_name?.trim(),
        address: occurrence.address?.trim(),
        contact_name: input.contact_name?.trim(),
        contact_email: input.contact_email?.trim(),
        contact_phone: input.contact_phone?.trim(),
        notes: input.notes?.trim(),
        approved: true,
      }),
    )
  }
  if (created.length === 0) {
    throw new Error('At least one date is required')
  }
  return created[0]
}

export async function addYouth(
  eventId: number,
  name: string,
): Promise<YouthEvent | null> {
  return addYouthToEvent(eventId, name)
}

export async function removeEvent(id: number): Promise<boolean> {
  return deleteEvent(id)
}

export async function updateEventWhen(
  eventId: number,
  occurrence: CreateEventOccurrence,
): Promise<YouthEvent | null> {
  const { starts_at, ends_at } = occurrenceTimes(occurrence)
  return updateEventTimes(eventId, starts_at, ends_at)
}

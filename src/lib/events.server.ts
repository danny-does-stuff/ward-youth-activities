import {
  addYouthToEvent,
  deleteEvent,
  insertEvent,
  listEvents,
  listEventsNewestFirst,
  listYouthNames,
  setEventApproved,
} from './db.server'
import type { YouthEvent } from './types'

export type CreateEventInput = {
  title: string
  participant_names: Array<string>
  date: string
  start_time: string
  end_time: string
  location_name?: string
  address?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

export async function getApprovedEvents(): Promise<Array<YouthEvent>> {
  const events = await listEvents()
  return events
    .filter((event) => event.approved)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
}

export async function getKnownYouthNames(): Promise<Array<string>> {
  return listYouthNames()
}

export async function getAdminEvents(): Promise<Array<YouthEvent>> {
  return listEventsNewestFirst()
}

function toUTCTimestamp(date: string, time: string): string {
  const localDateTime = new Date(`${date}T${time}:00`)
  return localDateTime.toISOString()
}

export async function createEvent(
  input: CreateEventInput,
): Promise<YouthEvent> {
  return insertEvent({
    title: input.title.trim(),
    participant_names: input.participant_names,
    starts_at: toUTCTimestamp(input.date, input.start_time),
    ends_at: toUTCTimestamp(input.date, input.end_time),
    location_name: input.location_name?.trim(),
    address: input.address?.trim(),
    contact_name: input.contact_name?.trim(),
    contact_email: input.contact_email?.trim(),
    contact_phone: input.contact_phone?.trim(),
    notes: input.notes?.trim(),
    approved: false,
  })
}

export async function addYouth(
  eventId: number,
  name: string,
): Promise<YouthEvent | null> {
  return addYouthToEvent(eventId, name)
}

export async function approveEvent(id: number): Promise<YouthEvent | null> {
  return setEventApproved(id, true)
}

export async function unpublishEvent(id: number): Promise<YouthEvent | null> {
  return setEventApproved(id, false)
}

export async function rejectEvent(id: number): Promise<boolean> {
  return deleteEvent(id)
}

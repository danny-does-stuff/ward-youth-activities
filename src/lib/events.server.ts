import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  addYouthToEvent,
  deleteEvent,
  insertEvent,
  listEvents,
  listYouthNames,
} from './db.server'
import { isUpcoming, localDateTime, sortByStart } from './schedule'
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
    approved: true,
  })
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

export const addYouthFn = createServerFn({ method: 'POST' })
  .validator((data: { eventId: number; name: string }) => {
    return z
      .object({
        eventId: z.number(),
        name: z.string().trim().min(1, 'Youth name is required'),
      })
      .parse(data)
  })
  .handler(async ({ data }) => {
    const event = await addYouth(data.eventId, data.name)
    if (!event) {
      throw new Error('Event not found')
    }
    return event
  })

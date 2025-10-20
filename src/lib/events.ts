import { db, type YouthEvent } from './db'

export type CreateEventInput = {
  title: string
  youth_name: string
  date: string // YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string // HH:mm
  location_name?: string
  address?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

/**
 * Get all approved events, sorted by start date (ascending)
 */
export async function getApprovedEvents(): Promise<YouthEvent[]> {
  const events = await db.getEvents()
  return events
    .filter((event) => event.approved)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
}

/**
 * Convert local date/time to UTC ISO timestamp
 */
function toUTCTimestamp(date: string, time: string): string {
  // Combine date and time, treat as local time
  const localDateTime = new Date(`${date}T${time}:00`)
  return localDateTime.toISOString()
}

/**
 * Create a new event submission (unapproved by default)
 */
export async function createEvent(
  input: CreateEventInput,
): Promise<YouthEvent> {
  const starts_at = toUTCTimestamp(input.date, input.start_time)
  const ends_at = toUTCTimestamp(input.date, input.end_time)

  const event = await db.addEvent({
    title: input.title.trim(),
    youth_name: input.youth_name.trim(),
    starts_at,
    ends_at,
    location_name: input.location_name?.trim(),
    address: input.address?.trim(),
    contact_name: input.contact_name?.trim(),
    contact_email: input.contact_email?.trim(),
    contact_phone: input.contact_phone?.trim(),
    notes: input.notes?.trim(),
    approved: false,
  })

  return event
}


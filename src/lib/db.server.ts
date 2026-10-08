import { eq, inArray, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import { eventYouth, events, youths } from '../db/schema'
import type { YouthEvent } from './types'

function getDb() {
  return drizzle(env.DB)
}

function optional(value: string | null | undefined): string | undefined {
  return value ?? undefined
}

export function normalizeYouthName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function uniqueYouthNames(names: Array<string>): Array<string> {
  const seen = new Set<string>()
  const unique: Array<string> = []
  for (const name of names) {
    const normalized = normalizeYouthName(name)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(normalized)
  }
  return unique
}

function toYouthEvent(
  row: typeof events.$inferSelect,
  participant_names: Array<string>,
): YouthEvent {
  return {
    id: row.id,
    title: row.title,
    participant_names,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    location_name: optional(row.location_name),
    address: optional(row.address),
    contact_name: optional(row.contact_name),
    contact_email: optional(row.contact_email),
    contact_phone: optional(row.contact_phone),
    notes: optional(row.notes),
    approved: row.approved,
    created_at: row.created_at,
  }
}

async function namesByEventId(
  eventIds: Array<number>,
): Promise<Map<number, Array<string>>> {
  const names = new Map<number, Array<string>>()
  if (eventIds.length === 0) {
    return names
  }

  const rows = await getDb()
    .select({
      event_id: eventYouth.event_id,
      name: youths.name,
    })
    .from(eventYouth)
    .innerJoin(youths, eq(eventYouth.youth_id, youths.id))
    .where(inArray(eventYouth.event_id, eventIds))
    .orderBy(youths.name)

  for (const row of rows) {
    const list = names.get(row.event_id) ?? []
    list.push(row.name)
    names.set(row.event_id, list)
  }

  return names
}

async function withYouthNames(
  rows: Array<typeof events.$inferSelect>,
): Promise<Array<YouthEvent>> {
  const names = await namesByEventId(rows.map((row) => row.id))
  return rows.map((row) => toYouthEvent(row, names.get(row.id) ?? []))
}

export async function listYouthNames(): Promise<Array<string>> {
  const rows = await getDb().select({ name: youths.name }).from(youths).orderBy(youths.name)
  return rows.map((row) => row.name)
}

async function findOrCreateYouth(name: string) {
  const normalized = normalizeYouthName(name)
  const db = getDb()
  const [existing] = await db
    .select()
    .from(youths)
    .where(sql`lower(${youths.name}) = ${normalized.toLowerCase()}`)
    .limit(1)

  if (existing) {
    return existing
  }

  try {
    const [created] = await db
      .insert(youths)
      .values({ name: normalized })
      .returning()
    return created
  } catch {
    const [retry] = await db
      .select()
      .from(youths)
      .where(sql`lower(${youths.name}) = ${normalized.toLowerCase()}`)
      .limit(1)
    if (!retry) {
      throw new Error('Could not save youth name')
    }
    return retry
  }
}

async function attachYouth(eventId: number, youthId: number): Promise<boolean> {
  const inserted = await getDb()
    .insert(eventYouth)
    .values({ event_id: eventId, youth_id: youthId })
    .onConflictDoNothing()
    .returning({ event_id: eventYouth.event_id })

  return inserted.length > 0
}

export async function listEvents(): Promise<Array<YouthEvent>> {
  const rows = await getDb().select().from(events)
  return withYouthNames(rows)
}

export async function getEventById(id: number): Promise<YouthEvent | null> {
  const rows = await getDb().select().from(events).where(eq(events.id, id)).limit(1)
  if (rows.length === 0) {
    return null
  }
  const [event] = await withYouthNames(rows)
  return event
}

export async function insertEvent(
  event: Omit<YouthEvent, 'id' | 'created_at' | 'participant_names'> & {
    participant_names: Array<string>
  },
): Promise<YouthEvent> {
  const created_at = new Date().toISOString()
  const names = uniqueYouthNames(event.participant_names)
  if (names.length === 0) {
    throw new Error('At least one youth is required')
  }

  const db = getDb()
  const [row] = await db
    .insert(events)
    .values({
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      location_name: event.location_name,
      address: event.address,
      contact_name: event.contact_name,
      contact_email: event.contact_email,
      contact_phone: event.contact_phone,
      notes: event.notes,
      approved: event.approved,
      created_at,
    })
    .returning()

  for (const name of names) {
    const youth = await findOrCreateYouth(name)
    await attachYouth(row.id, youth.id)
  }

  const created = await getEventById(row.id)
  if (!created) {
    throw new Error('Failed to load created event')
  }
  return created
}

export async function addYouthToEvent(
  eventId: number,
  name: string,
): Promise<YouthEvent | null> {
  const existing = await getEventById(eventId)
  if (!existing) {
    return null
  }

  const youth = await findOrCreateYouth(name)
  await attachYouth(eventId, youth.id)
  return getEventById(eventId)
}

export async function deleteEvent(id: number): Promise<boolean> {
  await getDb().delete(eventYouth).where(eq(eventYouth.event_id, id))
  const deleted = await getDb()
    .delete(events)
    .where(eq(events.id, id))
    .returning({ id: events.id })

  return deleted.length > 0
}

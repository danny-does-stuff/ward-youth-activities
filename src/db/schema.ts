import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  starts_at: text('starts_at').notNull(),
  ends_at: text('ends_at').notNull(),
  location_name: text('location_name'),
  address: text('address'),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  contact_phone: text('contact_phone'),
  notes: text('notes'),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull(),
  tz_version: integer('tz_version').notNull().default(0),
})

export const youths = sqliteTable('youths', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
})

export const eventYouth = sqliteTable(
  'event_youth',
  {
    event_id: integer('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    youth_id: integer('youth_id')
      .notNull()
      .references(() => youths.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.event_id, table.youth_id] })],
)

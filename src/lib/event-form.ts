import { z } from 'zod'
import { localDateTime } from './schedule'

export type EventOccurrence = {
  id: string
  date: string
  start_time: string
  end_time: string
  location_name: string
  address: string
}

export function newOccurrenceId(): string {
  return crypto.randomUUID()
}

export function emptyOccurrence(): EventOccurrence {
  return {
    id: 'first',
    date: '',
    start_time: '',
    end_time: '',
    location_name: '',
    address: '',
  }
}

export function occurrenceFromPrevious(previous: EventOccurrence): EventOccurrence {
  return {
    id: newOccurrenceId(),
    date: '',
    start_time: previous.start_time,
    end_time: previous.end_time,
    location_name: previous.location_name,
    address: previous.address,
  }
}

const occurrenceSchema = z
  .object({
    date: z.string().min(1, 'Choose a date'),
    start_time: z.string().min(1, 'Choose a start time'),
    end_time: z.string().optional(),
    location_name: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .superRefine((occurrence, ctx) => {
    const end = occurrence.end_time?.trim()
    if (!end) return
    if (
      localDateTime(occurrence.date, end) <=
      localDateTime(occurrence.date, occurrence.start_time)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'End time needs to be after the start time',
        path: ['end_time'],
      })
    }
  })

export const submitEventSchema = z.object({
  title: z.string().trim().min(1, 'Add an event title'),
  participant_names: z
    .array(z.string().trim().min(1, 'Add at least one youth'))
    .min(1, 'Add at least one youth'),
  contact_name: z.string().trim().optional(),
  contact_email: z
    .string()
    .trim()
    .email('Email needs an @ — try name@example.com')
    .optional()
    .or(z.literal('')),
  contact_phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  occurrences: z.array(occurrenceSchema).min(1, 'Add at least one date'),
})

export type SubmitEventInput = z.infer<typeof submitEventSchema>

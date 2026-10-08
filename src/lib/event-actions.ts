import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { addYouth } from './events.server'

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

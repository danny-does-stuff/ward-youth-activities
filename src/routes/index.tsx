import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { EventCard } from '../components/EventCard'
import { getWardName } from '../lib/auth.server'
import {
  addYouth,
  getApprovedEvents,
  getKnownYouthNames,
} from '../lib/events.server'
import { PageShell } from '../lib/page'

const getHomeData = createServerFn({
  method: 'GET',
}).handler(async () => ({
  events: await getApprovedEvents(),
  knownYouthNames: await getKnownYouthNames(),
  wardName: getWardName(),
}))

const addYouthFn = createServerFn({ method: 'POST' })
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

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getHomeData(),
})

function Home() {
  const router = useRouter()
  const { events, knownYouthNames, wardName } = Route.useLoaderData()

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{wardName}</h1>
            <p className="text-white/70">
              Discover upcoming activities and performances
            </p>
          </div>
          <Link
            to="/submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
          >
            Add Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-white/10 border border-white/20 rounded-lg p-8 text-center backdrop-blur-sm">
            <p className="text-xl text-white/80 mb-4">
              No events scheduled yet.
            </p>
            <p className="text-white/60 mb-6">
              Be the first to submit an event!
            </p>
            <Link
              to="/submit"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Add Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                knownYouthNames={knownYouthNames}
                onAddYouth={async (name) => {
                  await addYouthFn({ data: { eventId: event.id, name } })
                  await router.invalidate()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

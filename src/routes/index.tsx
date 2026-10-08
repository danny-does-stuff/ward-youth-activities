import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { EventDayPad } from '../components/EventDayPad'
import { SiteChrome } from '../components/SiteChrome'
import { getWardName } from '../lib/auth.server'
import {
  addYouthFn,
  getKnownYouthNames,
  getUpcomingEvents,
} from '../lib/events.server'
import { groupByWeek } from '../lib/schedule'

const homeSearch = z.object({
  event: z.coerce.number().optional(),
})

const getHomeData = createServerFn({
  method: 'GET',
}).handler(async () => {
  const [events, knownYouthNames] = await Promise.all([
    getUpcomingEvents(),
    getKnownYouthNames(),
  ])
  return {
    events,
    knownYouthNames,
    wardName: getWardName(),
    now: new Date().toISOString(),
  }
})

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: (search) => homeSearch.parse(search),
  loader: async () => await getHomeData(),
})

function Home() {
  const router = useRouter()
  const { event: highlightId } = Route.useSearch()
  const { events, knownYouthNames, wardName, now } = Route.useLoaderData()
  const weeks = groupByWeek(events, new Date(now))

  async function handleAddYouth(eventId: number, name: string) {
    await addYouthFn({ data: { eventId, name } })
    await router.invalidate()
  }

  return (
    <SiteChrome wardName={wardName} current="home">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-prose">
            <p className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Come cheer on our youth!
            </p>
            <p className="mt-2 text-[var(--muted)]">
              Games, concerts, and performances, with times and places so you
              know where to be. Tap an event to add it to your calendar.
            </p>
          </div>
          <Link to="/submit" className="sticky-btn shrink-0 self-start sm:self-end">
            Add event
          </Link>
        </div>

        {weeks.length === 0 ? (
          <div className="pad px-4 py-6">
            <p className="font-extrabold">The schedule is waiting on you.</p>
            <p className="mt-1 text-[var(--muted)]">
              Post the next game or concert so families know where to be.
            </p>
            <Link to="/submit" className="sticky-btn mt-4">
              Add event
            </Link>
          </div>
        ) : (
          weeks.map((week) => (
            <section key={week.key} className="space-y-3">
              <h2 className="font-display text-3xl text-[var(--magnet)]">
                {week.label}
              </h2>
              {week.days.map((group) => (
                <EventDayPad
                  key={group.key}
                  group={group}
                  highlightId={highlightId}
                  knownYouthNames={knownYouthNames}
                  onAddYouth={handleAddYouth}
                />
              ))}
            </section>
          ))
        )}
      </div>
    </SiteChrome>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getApprovedEvents } from '../lib/events'
import { EventCard } from '../components/EventCard'

const getEvents = createServerFn({
  method: 'GET',
}).handler(async () => await getApprovedEvents())

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getEvents(),
})

function Home() {
  const events = Route.useLoaderData()

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Crossroads Ward Youth Events
            </h1>
            <p className="text-white/70">
              Discover upcoming activities and performances
            </p>
          </div>
          <Link
            to="/submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
          >
            Submit Event
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
              Submit Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

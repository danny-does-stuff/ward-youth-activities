import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { EventCard } from '../components/EventCard'
import {
  getWardName,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
} from '../lib/auth.server'
import {
  addYouth,
  approveEvent,
  getAdminEvents,
  getKnownYouthNames,
  rejectEvent,
  unpublishEvent,
} from '../lib/events.server'
import { PageShell } from '../lib/page'
import type { YouthEvent } from '../lib/types'

const getAdminPage = createServerFn({ method: 'GET' }).handler(async () => {
  const authenticated = await isAdminAuthenticated()
  return {
    authenticated,
    wardName: getWardName(),
    events: authenticated ? await getAdminEvents() : [],
    knownYouthNames: authenticated ? await getKnownYouthNames() : [],
  }
})

const loginFn = createServerFn({ method: 'POST' })
  .validator((data: { password: string }) => {
    return z.object({ password: z.string().min(1) }).parse(data)
  })
  .handler(async ({ data }) => {
    const ok = await loginAdmin(data.password)
    if (!ok) {
      throw new Error('Invalid password')
    }
    return { ok: true }
  })

const logoutFn = createServerFn({ method: 'POST' }).handler(() => {
  logoutAdmin()
  return { ok: true }
})

const approveFn = createServerFn({ method: 'POST' })
  .validator((data: { id: number }) => {
    return z.object({ id: z.number() }).parse(data)
  })
  .handler(async ({ data }) => {
    await requireAdmin()
    return approveEvent(data.id)
  })

const unpublishFn = createServerFn({ method: 'POST' })
  .validator((data: { id: number }) => {
    return z.object({ id: z.number() }).parse(data)
  })
  .handler(async ({ data }) => {
    await requireAdmin()
    return unpublishEvent(data.id)
  })

const rejectFn = createServerFn({ method: 'POST' })
  .validator((data: { id: number }) => {
    return z.object({ id: z.number() }).parse(data)
  })
  .handler(async ({ data }) => {
    await requireAdmin()
    return rejectEvent(data.id)
  })

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
    await requireAdmin()
    const event = await addYouth(data.eventId, data.name)
    if (!event) {
      throw new Error('Event not found')
    }
    return event
  })

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  loader: async () => await getAdminPage(),
})

function AdminPage() {
  const router = useRouter()
  const { authenticated, events, knownYouthNames, wardName } =
    Route.useLoaderData()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pending = events.filter((event) => !event.approved)
  const published = events.filter((event) => event.approved)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await loginFn({ data: { password } })
      setPassword('')
      await router.invalidate()
    } catch {
      setError('Invalid password')
    }
  }

  async function handleLogout() {
    await logoutFn()
    await router.invalidate()
  }

  async function handleApprove(id: number) {
    await approveFn({ data: { id } })
    await router.invalidate()
  }

  async function handleUnpublish(id: number) {
    await unpublishFn({ data: { id } })
    await router.invalidate()
  }

  async function handleReject(id: number) {
    await rejectFn({ data: { id } })
    await router.invalidate()
  }

  async function handleAddYouth(eventId: number, name: string) {
    await addYouthFn({ data: { eventId, name } })
    await router.invalidate()
  }

  if (!authenticated) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto py-16">
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Events
          </Link>
          <div className="mt-6 p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
            <h1 className="text-3xl font-bold mb-2">Admin</h1>
            <p className="text-white/70 mb-6">
              Sign in to review {wardName} event submissions.
            </p>
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{wardName} Admin</h1>
            <p className="text-white/70">Review and publish submitted events</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              View site
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-white/60">No submissions waiting for review.</p>
          ) : (
            <div className="grid gap-4">
              {pending.map((event) => (
                <AdminEventCard
                  key={event.id}
                  event={event}
                  knownYouthNames={knownYouthNames}
                  onAddYouth={(name) => handleAddYouth(event.id, name)}
                  onApprove={() => handleApprove(event.id)}
                  onReject={() => handleReject(event.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Published ({published.length})
          </h2>
          {published.length === 0 ? (
            <p className="text-white/60">No published events yet.</p>
          ) : (
            <div className="grid gap-4">
              {published.map((event) => (
                <AdminEventCard
                  key={event.id}
                  event={event}
                  knownYouthNames={knownYouthNames}
                  onAddYouth={(name) => handleAddYouth(event.id, name)}
                  onUnpublish={() => handleUnpublish(event.id)}
                  onReject={() => handleReject(event.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  )
}

function AdminEventCard({
  event,
  knownYouthNames,
  onAddYouth,
  onApprove,
  onUnpublish,
  onReject,
}: {
  event: YouthEvent
  knownYouthNames: Array<string>
  onAddYouth: (name: string) => Promise<void>
  onApprove?: () => void
  onUnpublish?: () => void
  onReject?: () => void
}) {
  return (
    <div className="space-y-3">
      <EventCard
        event={event}
        knownYouthNames={knownYouthNames}
        onAddYouth={onAddYouth}
      />
      <div className="flex flex-wrap gap-3">
        {onApprove && (
          <button
            onClick={onApprove}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Approve
          </button>
        )}
        {onUnpublish && (
          <button
            onClick={onUnpublish}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Unpublish
          </button>
        )}
        {onReject && (
          <button
            onClick={onReject}
            className="bg-red-500/80 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

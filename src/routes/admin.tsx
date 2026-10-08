import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { EventDayPad } from '../components/EventDayPad'
import { SiteChrome } from '../components/SiteChrome'
import {
  getWardName,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
} from '../lib/auth.server'
import {
  addYouthFn,
  getAdminEvents,
  getKnownYouthNames,
  removeEvent,
} from '../lib/events.server'
import { groupByDay, isUpcoming } from '../lib/schedule'

const getAdminPage = createServerFn({ method: 'GET' }).handler(async () => {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) {
    return {
      authenticated,
      wardName: getWardName(),
      events: [],
      knownYouthNames: [],
    }
  }
  const [events, knownYouthNames] = await Promise.all([
    getAdminEvents(),
    getKnownYouthNames(),
  ])
  return {
    authenticated,
    wardName: getWardName(),
    events,
    knownYouthNames,
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

const deleteFn = createServerFn({ method: 'POST' })
  .validator((data: { id: number }) => {
    return z.object({ id: z.number() }).parse(data)
  })
  .handler(async ({ data }) => {
    await requireAdmin()
    return removeEvent(data.id)
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

  const upcoming = groupByDay(events.filter((event) => isUpcoming(event)))
  const past = groupByDay(
    events.filter((event) => !isUpcoming(event)),
  ).reverse()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await loginFn({ data: { password } })
      setPassword('')
      await router.invalidate()
    } catch {
      setError('That password did not match. Try again.')
    }
  }

  async function handleLogout() {
    await logoutFn()
    await router.invalidate()
  }

  async function handleDelete(id: number) {
    await deleteFn({ data: { id } })
    await router.invalidate()
  }

  async function handleAddYouth(eventId: number, name: string) {
    await addYouthFn({ data: { eventId, name } })
    await router.invalidate()
  }

  if (!authenticated) {
    return (
      <SiteChrome wardName={wardName} current="admin">
        <div className="mx-auto max-w-md">
          <Link to="/" className="marker-link">
            Schedule
          </Link>
          <h1 className="mt-6 font-display text-4xl text-[var(--magnet)]">
            Leaders
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Sign in to take down an event that shouldn’t be here.
          </p>
          {error && (
            <p className="mt-4 text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label htmlFor="password" className="block text-sm font-extrabold">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
            <button type="submit" className="sticky-btn w-full">
              Sign in
            </button>
          </form>
        </div>
      </SiteChrome>
    )
  }

  return (
    <SiteChrome wardName={wardName} current="admin">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-[var(--magnet)]">
              Leaders
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              New posts already show on the schedule. Delete only what was a mistake.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 font-extrabold"
          >
            Sign out
          </button>
        </div>

        <Link to="/" className="marker-link">
          View the schedule
        </Link>

        <section className="space-y-4">
          <h2 className="font-display text-3xl">On the schedule</h2>
          {upcoming.length === 0 ? (
            <p className="text-[var(--muted)]">
              Nothing upcoming. The public schedule is empty too.
            </p>
          ) : (
            upcoming.map((group) => (
              <EventDayPad
                key={group.key}
                group={group}
                knownYouthNames={knownYouthNames}
                onAddYouth={handleAddYouth}
                onDelete={handleDelete}
              />
            ))
          )}
        </section>

        {past.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-3xl">Past</h2>
            {past.map((group) => (
              <EventDayPad
                key={group.key}
                group={group}
                knownYouthNames={knownYouthNames}
                onAddYouth={handleAddYouth}
                onDelete={handleDelete}
              />
            ))}
          </section>
        )}
      </div>
    </SiteChrome>
  )
}

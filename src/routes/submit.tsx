import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { EventDateSlips } from '../components/EventDateSlips'
import { SiteChrome } from '../components/SiteChrome'
import { YouthNameInput } from '../components/YouthNameInput'
import { getWardName } from '../lib/auth.server'
import {
  emptyOccurrence,
  occurrenceFromPrevious,
  submitEventSchema,
  type EventOccurrence,
  type SubmitEventInput,
} from '../lib/event-form'
import { createEvent, getKnownYouthNames } from '../lib/events.server'

const submitEvent = createServerFn({ method: 'POST' })
  .validator((data: SubmitEventInput) => {
    return submitEventSchema.parse(data)
  })
  .handler(async ({ data }) => {
    return createEvent(data)
  })

const getSubmitPage = createServerFn({ method: 'GET' }).handler(async () => ({
  knownYouthNames: await getKnownYouthNames(),
  wardName: getWardName(),
}))

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
  loader: async () => await getSubmitPage(),
})

type EventFormState = {
  title: string
  participant_names: Array<string>
  contact_name: string
  contact_email: string
  contact_phone: string
  notes: string
  occurrences: Array<EventOccurrence>
}

const emptyForm: EventFormState = {
  title: '',
  participant_names: [''],
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
  occurrences: [emptyOccurrence()],
}

function SubmitPage() {
  const navigate = useNavigate()
  const { knownYouthNames, wardName } = Route.useLoaderData()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [multiple, setMultiple] = useState(false)
  const [formData, setFormData] = useState<EventFormState>(emptyForm)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const occurrences = multiple
        ? formData.occurrences
        : formData.occurrences.slice(0, 1)
      const created = await submitEvent({
        data: {
          title: formData.title,
          participant_names: formData.participant_names.filter(
            (name) => name.trim().length > 0,
          ),
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          notes: formData.notes,
          occurrences: occurrences.map(
            ({ date, start_time, end_time, location_name, address }) => ({
              date,
              start_time,
              end_time: end_time.trim() || undefined,
              location_name,
              address,
            }),
          ),
        },
      })
      await navigate({ to: '/', search: { event: created.id } })
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Fill in the missing pieces and try again')
      } else {
        setError('Could not post the event. Check your connection and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const dateCount = multiple ? formData.occurrences.length : 1
  const postLabel =
    dateCount === 1
      ? 'Post it for the ward'
      : `Post ${dateCount} dates for the ward`

  return (
    <SiteChrome wardName={wardName} current="submit">
      <div>
        <h1 className="font-display text-4xl text-[var(--magnet)]">Add event</h1>
        <p className="mt-2 max-w-prose text-[var(--muted)]">
          Got a game, recital, or concert coming up? Post it here so the ward
          can come support you!
        </p>

        {error && (
          <p
            className="mt-4 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-3 text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-extrabold">
              Event title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="field"
              placeholder="Football game, Choir concert, etc."
            />
          </div>

          <div className="space-y-3">
            {formData.participant_names.map((name, index) => (
              <div key={index}>
                <label
                  htmlFor={`youth-name-${index}`}
                  className="block text-sm font-extrabold"
                >
                  {index === 0 ? 'Youth name' : `Youth #${index + 1}`}
                </label>
                <div className="flex gap-2">
                  <YouthNameInput
                    id={`youth-name-${index}`}
                    value={name}
                    knownNames={knownYouthNames}
                    required={index === 0}
                    onChange={(value) => {
                      setFormData((prev) => {
                        const participant_names = [...prev.participant_names]
                        participant_names[index] = value
                        return { ...prev, participant_names }
                      })
                      setError(null)
                    }}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          participant_names: prev.participant_names.filter(
                            (_, i) => i !== index,
                          ),
                        }))
                      }}
                      className="min-h-11 shrink-0 px-3 font-extrabold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  participant_names: [...prev.participant_names, ''],
                }))
              }}
              className="text-sm font-extrabold text-[var(--marker)]"
            >
              Add another youth
            </button>
          </div>

          <EventDateSlips
            occurrences={formData.occurrences}
            multiple={multiple}
            onChange={(id, patch) => {
              setFormData((prev) => ({
                ...prev,
                occurrences: prev.occurrences.map((occurrence) =>
                  occurrence.id === id ? { ...occurrence, ...patch } : occurrence,
                ),
              }))
              setError(null)
            }}
            onAdd={() => {
              setMultiple(true)
              setFormData((prev) => ({
                ...prev,
                occurrences: [
                  ...prev.occurrences,
                  occurrenceFromPrevious(
                    prev.occurrences[prev.occurrences.length - 1],
                  ),
                ],
              }))
            }}
            onRemove={(id) => {
              setFormData((prev) => {
                const next = prev.occurrences.filter(
                  (occurrence) => occurrence.id !== id,
                )
                return {
                  ...prev,
                  occurrences: next.length > 0 ? next : [emptyOccurrence()],
                }
              })
            }}
          />

          <fieldset className="space-y-4">
            <legend className="font-display text-2xl">Who to call</legend>
            <p className="text-sm text-[var(--muted)]">
              Someone families can contact about this event.
            </p>
            <div>
              <label
                htmlFor="contact_name"
                className="block text-sm font-extrabold"
              >
                Name
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="field"
                placeholder="First and last name"
              />
            </div>
            <div>
              <label
                htmlFor="contact_phone"
                className="block text-sm font-extrabold"
              >
                Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="field"
                placeholder="555-123-4567"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div>
              <label
                htmlFor="contact_email"
                className="block text-sm font-extrabold"
              >
                Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="field"
                placeholder="name@example.com"
              />
            </div>
          </fieldset>

          <div>
            <label htmlFor="notes" className="block text-sm font-extrabold">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="field resize-none"
              placeholder="Bring water. $5 entry fee."
            />
          </div>

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={saving} className="sticky-btn flex-1">
              {saving ? 'Posting…' : postLabel}
            </button>
            <Link to="/" className="inline-flex min-h-12 items-center px-3 font-extrabold">
              Back to schedule
            </Link>
          </div>
        </form>
      </div>
    </SiteChrome>
  )
}

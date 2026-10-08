import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { SiteChrome } from '../components/SiteChrome'
import { YouthNameInput } from '../components/YouthNameInput'
import { getWardName } from '../lib/auth.server'
import { createEvent, getKnownYouthNames } from '../lib/events.server'
import { localDateTime } from '../lib/schedule'

const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Add an event title'),
    participant_names: z
      .array(z.string().trim().min(1, 'Add at least one youth'))
      .min(1, 'Add at least one youth'),
    date: z.string().min(1, 'Choose a date'),
    start_time: z.string().min(1, 'Choose a start time'),
    end_time: z.string().min(1, 'Choose an end time'),
    location_name: z.string().trim().optional(),
    address: z.string().trim().optional(),
    contact_name: z.string().trim().optional(),
    contact_email: z
      .string()
      .trim()
      .email('Email needs an @ — try name@example.com')
      .optional()
      .or(z.literal('')),
    contact_phone: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const startDateTime = localDateTime(data.date, data.start_time)
      const endDateTime = localDateTime(data.date, data.end_time)
      return endDateTime > startDateTime
    },
    {
      message: 'End time needs to be after the start time',
      path: ['end_time'],
    },
  )

type EventFormData = z.infer<typeof eventSchema>

const submitEvent = createServerFn({ method: 'POST' })
  .validator((data: EventFormData) => {
    return eventSchema.parse(data)
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

const emptyForm: EventFormData = {
  title: '',
  participant_names: [''],
  date: '',
  start_time: '',
  end_time: '',
  location_name: '',
  address: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
}

function SubmitPage() {
  const navigate = useNavigate()
  const { knownYouthNames, wardName } = Route.useLoaderData()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<EventFormData>(emptyForm)

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
      const created = await submitEvent({
        data: {
          ...formData,
          participant_names: formData.participant_names.filter(
            (name) => name.trim().length > 0,
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
            className="mt-4 border-l-0 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-3 text-[var(--danger)]"
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
              Add another name
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-extrabold">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start_time"
                  className="block text-sm font-extrabold"
                >
                  Starts
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="field"
                />
              </div>
              <div>
                <label
                  htmlFor="end_time"
                  className="block text-sm font-extrabold"
                >
                  Ends
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="field"
                />
              </div>
            </div>
          </div>

          <fieldset className="space-y-4">
            <legend className="font-display text-2xl">Where it’s happening</legend>
            <div>
              <label
                htmlFor="location_name"
                className="block text-sm font-extrabold"
              >
                Place
              </label>
              <input
                type="text"
                id="location_name"
                name="location_name"
                value={formData.location_name}
                onChange={handleChange}
                className="field"
                placeholder="Acorn Park Soccer Fields"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-extrabold">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="field"
                placeholder="123 Main St"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-display text-2xl">Who to call</legend>
            <p className="text-sm text-[var(--muted)]">
              Someone families can contact for more information about this
              event.
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
              {saving ? 'Posting…' : 'Post it for the ward'}
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

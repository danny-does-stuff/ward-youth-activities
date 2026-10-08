import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { YouthNameInput } from '../components/YouthNameInput'
import { createEvent, getKnownYouthNames } from '../lib/events.server'

const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    participant_names: z
      .array(z.string().trim().min(1, 'Youth name is required'))
      .min(1, 'At least one youth is required'),
    date: z.string().min(1, 'Date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    location_name: z.string().trim().optional(),
    address: z.string().trim().optional(),
    contact_name: z.string().trim().optional(),
    contact_email: z
      .string()
      .trim()
      .email('Invalid email')
      .optional()
      .or(z.literal('')),
    contact_phone: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const startDateTime = new Date(`${data.date}T${data.start_time}:00`)
      const endDateTime = new Date(`${data.date}T${data.end_time}:00`)
      return endDateTime > startDateTime
    },
    {
      message: 'End time must be after start time',
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
  const router = useRouter()
  const { knownYouthNames } = Route.useLoaderData()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    try {
      await submitEvent({
        data: {
          ...formData,
          participant_names: formData.participant_names.filter(
            (name) => name.trim().length > 0,
          ),
        },
      })
      setSubmitted(true)
      setFormData(emptyForm)
      router.invalidate()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Validation error')
      } else {
        setError('Failed to submit event. Please try again.')
      }
    }
  }

  if (submitted) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
        style={{
          backgroundImage:
            'radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)',
        }}
      >
        <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">Event Submitted!</h1>
            <p className="text-white/70 mb-6">
              Thank you for submitting your event. It will be reviewed and
              approved soon.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              View All Events
            </Link>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Submit Another Event
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)',
      }}
    >
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Events
          </Link>
        </div>

        <div className="p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
          <h1 className="text-3xl font-bold mb-2">Submit Youth Event</h1>
          <p className="text-white/70 mb-6">
            Fill out the form below to submit a youth activity, game, concert,
            or performance.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required fields */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Event Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="e.g., Basketball Tournament, Music Concert"
              />
            </div>

            <div className="space-y-3">
              {formData.participant_names.map((name, index) => (
                <div key={index}>
                  <label
                    htmlFor={`youth-name-${index}`}
                    className="block text-sm font-medium mb-2"
                  >
                    {index === 0 ? 'Youth name' : `Additional youth`}{' '}
                    {index === 0 && <span className="text-red-400">*</span>}
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
                        className="shrink-0 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
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
                className="text-sm text-blue-300 hover:text-blue-200 font-medium"
              >
                Add additional youth
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium mb-2"
                >
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="start_time"
                  className="block text-sm font-medium mb-2"
                >
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="end_time"
                  className="block text-sm font-medium mb-2"
                >
                  End Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Optional fields */}
            <div className="pt-4 border-t border-white/10">
              <h2 className="text-lg font-semibold mb-4">
                Location (Optional)
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="location_name"
                    className="block text-sm font-medium mb-2"
                  >
                    Location Name
                  </label>
                  <input
                    type="text"
                    id="location_name"
                    name="location_name"
                    value={formData.location_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="e.g., Church Gym, Community Center"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium mb-2"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h2 className="text-lg font-semibold mb-4">
                Contact Information (Optional)
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="contact_name"
                    className="block text-sm font-medium mb-2"
                  >
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact_email"
                    className="block text-sm font-medium mb-2"
                  >
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact_phone"
                    className="block text-sm font-medium mb-2"
                  >
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="555-1234"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder="Any additional information about the event..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Add Event
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-lg transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { YouthEvent } from '../lib/types'
import { YouthNameInput } from './YouthNameInput'

export function formatParticipantNames(names: Array<string>): string {
  if (names.length === 0) {
    return 'Youth TBD'
  }
  if (names.length === 1) {
    return names[0]
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`
  }
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function EventCard({
  event,
  knownYouthNames = [],
  onAddYouth,
}: {
  event: YouthEvent
  knownYouthNames?: Array<string>
  onAddYouth?: (name: string) => Promise<void>
}) {
  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)
  const [addingYouth, setAddingYouth] = useState(false)
  const [youthName, setYouthName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const dateString = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  async function handleAddYouth(e: React.FormEvent) {
    e.preventDefault()
    if (!onAddYouth) return
    setAddError(null)
    setAdding(true)
    try {
      await onAddYouth(youthName)
      setYouthName('')
      setAddingYouth(false)
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Could not add youth. Try again.',
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm shadow-md hover:bg-white/15 transition-colors">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-xl font-bold text-white">{event.title}</h3>
          <p className="text-sm text-white/70">
            {formatParticipantNames(event.participant_names)}
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/60">📅</span>
            <span className="text-white">{dateString}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">⏰</span>
            <span className="text-white">
              {startTime} - {endTime}
            </span>
          </div>

          {event.location_name && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">📍</span>
              <span className="text-white">{event.location_name}</span>
            </div>
          )}

          {event.address && (
            <div className="flex items-center gap-2 ml-6">
              <span className="text-white/80 text-xs">{event.address}</span>
            </div>
          )}
        </div>

        {event.notes && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-sm text-white/80">{event.notes}</p>
          </div>
        )}

        {(event.contact_name || event.contact_email || event.contact_phone) && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-white/60 mb-1">Contact:</p>
            {event.contact_name && (
              <p className="text-sm text-white/80">{event.contact_name}</p>
            )}
            {event.contact_email && (
              <p className="text-sm text-white/80">{event.contact_email}</p>
            )}
            {event.contact_phone && (
              <p className="text-sm text-white/80">{event.contact_phone}</p>
            )}
          </div>
        )}

        {onAddYouth && (
          <div className="mt-2 pt-2 border-t border-white/10">
            {addingYouth ? (
              <form onSubmit={handleAddYouth} className="space-y-2">
                <label
                  htmlFor={`add-youth-${event.id}`}
                  className="block text-sm font-medium"
                >
                  New youth
                </label>
                <YouthNameInput
                  id={`add-youth-${event.id}`}
                  value={youthName}
                  knownNames={knownYouthNames}
                  required
                  onChange={(value) => {
                    setYouthName(value)
                    setAddError(null)
                  }}
                />
                {addError && (
                  <p className="text-sm text-red-200">{addError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    {adding ? 'Adding…' : 'Add youth'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingYouth(false)
                      setYouthName('')
                      setAddError(null)
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAddingYouth(true)}
                  className="text-sm text-blue-300 hover:text-blue-200 font-medium"
                >
                  + Add youth to this event
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

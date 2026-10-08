import { CalendarPlus, ChevronDown, MapPin, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { downloadEventIcs, googleCalendarUrl } from '../lib/calendar'
import {
  formatContact,
  formatParticipantNames,
  formatPlace,
  formatTimeRange,
} from '../lib/schedule'
import type { YouthEvent } from '../lib/types'
import { YouthNameInput } from './YouthNameInput'

const openById = new Map<number, boolean>()

export function EventCard({
  event,
  knownYouthNames = [],
  defaultOpen = false,
  onAddYouth,
  onDelete,
}: {
  event: YouthEvent
  knownYouthNames?: Array<string>
  defaultOpen?: boolean
  onAddYouth?: (name: string) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const [open, setOpen] = useState(
    () => openById.get(event.id) ?? defaultOpen,
  )

  function setOpenAndRemember(next: boolean) {
    openById.set(event.id, next)
    setOpen(next)
  }
  const [addingYouth, setAddingYouth] = useState(false)
  const [youthName, setYouthName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleAddYouth(e: React.FormEvent) {
    e.preventDefault()
    if (!onAddYouth) return
    setAddError(null)
    setAdding(true)
    try {
      await onAddYouth(youthName)
      setYouthName('')
      setAddingYouth(false)
    } catch {
      setAddError('Could not add youth. Try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  const detailsId = `event-details-${event.id}`
  const place = formatPlace(event)
  const contact = formatContact(event)

  return (
    <article
      id={`event-${event.id}`}
      className="border-b border-[var(--rule)] last:border-b-0"
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 py-2 text-left"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpenAndRemember(!open)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-[var(--marker)]">
            {formatTimeRange(event)}
          </span>
          <span className="mt-0.5 block text-lg font-extrabold leading-tight">
            {event.title}
          </span>
          <span className="mt-0.5 block text-sm text-[var(--muted)]">
            {formatParticipantNames(event.participant_names)}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={`mt-1 h-5 w-5 shrink-0 text-[var(--muted)] transition-transform duration-200 ease-out ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id={detailsId}
        hidden={!open}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5 pb-2">
            {place && (
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{place}</span>
              </p>
            )}
            {event.notes && <p className="text-sm">{event.notes}</p>}
            {contact && (
              <p className="text-sm text-[var(--muted)]">{contact}</p>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-0">
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1.5 text-sm font-extrabold text-[var(--marker)]"
                onClick={() => downloadEventIcs(event)}
              >
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Apple Calendar
              </button>
              <a
                className="inline-flex min-h-9 items-center gap-1.5 text-sm font-extrabold text-[var(--marker)]"
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Google Calendar
              </a>
            </div>

            {onAddYouth && (
              <div>
                {addingYouth ? (
                  <form onSubmit={handleAddYouth} className="space-y-1.5">
                    <label
                      htmlFor={`add-youth-${event.id}`}
                      className="block text-sm font-extrabold"
                    >
                      Youth name
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
                      <p className="text-sm text-[var(--danger)]">{addError}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={adding}
                        className="sticky-btn text-base"
                      >
                        {adding ? 'Adding…' : 'Add this youth'}
                      </button>
                      <button
                        type="button"
                        className="min-h-11 px-3 font-extrabold"
                        onClick={() => {
                          setAddingYouth(false)
                          setYouthName('')
                          setAddError(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-extrabold text-[var(--marker)]"
                    onClick={() => setAddingYouth(true)}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Add a youth
                  </button>
                )}
              </div>
            )}

            {onDelete && (
              <div>
                {confirmDelete ? (
                  <div className="space-y-2 rounded-sm bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3">
                    <p className="text-sm font-extrabold">
                      Delete {event.title}? This can’t be undone.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={deleting}
                        className="min-h-11 bg-[var(--danger)] px-4 font-extrabold text-[var(--magnet-ink)]"
                        onClick={handleDelete}
                      >
                        {deleting ? 'Deleting…' : 'Delete event'}
                      </button>
                      <button
                        type="button"
                        className="min-h-11 px-3 font-extrabold"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Keep it
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-extrabold text-[var(--danger)]"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </article>
  )
}

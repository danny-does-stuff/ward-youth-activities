import { CalendarPlus, ChevronDown, MapPin, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { downloadEventIcs, googleCalendarUrl } from '../lib/calendar'
import { eventWhenSchema, type EventWhenInput } from '../lib/event-form'
import {
  formatContact,
  formatParticipantNames,
  formatPlace,
  formatTimeRange,
  wallDateTime,
} from '../lib/schedule'
import type { YouthEvent } from '../lib/types'
import { YouthNameInput } from './YouthNameInput'

function whenFromEvent(event: YouthEvent): EventWhenInput {
  const start = wallDateTime(event.starts_at)
  const end = wallDateTime(event.ends_at)
  const sameTime =
    new Date(event.starts_at).getTime() === new Date(event.ends_at).getTime()
  return {
    date: start.date,
    start_time: start.time,
    end_time: sameTime ? '' : end.time,
  }
}

const openById = new Map<number, boolean>()

export function EventCard({
  event,
  knownYouthNames = [],
  defaultOpen = false,
  onAddYouth,
  onDelete,
  onEditWhen,
}: {
  event: YouthEvent
  knownYouthNames?: Array<string>
  defaultOpen?: boolean
  onAddYouth?: (name: string) => Promise<void>
  onDelete?: () => Promise<void>
  onEditWhen?: (when: EventWhenInput) => Promise<void>
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
  const [editingWhen, setEditingWhen] = useState(false)
  const [when, setWhen] = useState(() => whenFromEvent(event))
  const [savingWhen, setSavingWhen] = useState(false)
  const [whenError, setWhenError] = useState<string | null>(null)

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
            {editingWhen && onEditWhen ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setWhenError(null)
                  setSavingWhen(true)
                  try {
                    const parsed = eventWhenSchema.parse({
                      ...when,
                      end_time: when.end_time?.trim() || undefined,
                    })
                    await onEditWhen(parsed)
                    setEditingWhen(false)
                  } catch (err) {
                    if (err instanceof z.ZodError) {
                      setWhenError(
                        err.issues[0]?.message || 'Check the date and times',
                      )
                    } else {
                      setWhenError('Could not save the time. Try again.')
                    }
                  } finally {
                    setSavingWhen(false)
                  }
                }}
              >
                <div>
                  <label
                    htmlFor={`edit-date-${event.id}`}
                    className="block text-sm font-extrabold"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id={`edit-date-${event.id}`}
                    required
                    value={when.date}
                    onChange={(e) =>
                      setWhen((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`edit-start-${event.id}`}
                      className="block text-sm font-extrabold"
                    >
                      Starts
                    </label>
                    <input
                      type="time"
                      id={`edit-start-${event.id}`}
                      required
                      value={when.start_time}
                      onChange={(e) =>
                        setWhen((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                      className="field"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`edit-end-${event.id}`}
                      className="block text-sm font-extrabold"
                    >
                      Ends
                      <span className="font-normal text-[var(--muted)]">
                        {' '}
                        (optional)
                      </span>
                    </label>
                    <input
                      type="time"
                      id={`edit-end-${event.id}`}
                      value={when.end_time ?? ''}
                      onChange={(e) =>
                        setWhen((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                      className="field"
                    />
                  </div>
                </div>
                {whenError && (
                  <p className="text-sm text-[var(--danger)]">{whenError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={savingWhen}
                    className="sticky-btn text-base"
                  >
                    {savingWhen ? 'Saving…' : 'Save time'}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 px-3 font-extrabold"
                    onClick={() => {
                      setEditingWhen(false)
                      setWhen(whenFromEvent(event))
                      setWhenError(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
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

            {(onDelete || onEditWhen) && (
              <div className="flex items-end justify-between gap-2">
                <div>
                  {onDelete &&
                    (confirmDelete ? (
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
                    ))}
                </div>
                {onEditWhen && (
                  <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--marker)]"
                    aria-label="Edit time"
                    onClick={() => {
                      setWhen(whenFromEvent(event))
                      setWhenError(null)
                      setConfirmDelete(false)
                      setEditingWhen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            )}
              </>
            )}
        </div>
      </div>
    </article>
  )
}

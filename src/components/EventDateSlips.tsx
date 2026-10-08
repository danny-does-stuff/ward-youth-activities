import type { EventOccurrence } from '../lib/event-form'

function OccurrenceFields({
  occurrence,
  index,
  multiple,
  onChange,
}: {
  occurrence: EventOccurrence
  index: number
  multiple: boolean
  onChange: (patch: Partial<EventOccurrence>) => void
}) {
  const prefix = `occ-${occurrence.id}`
  const copied = multiple && index > 0

  return (
    <div className="space-y-4">
      {copied && (
        <p className="text-sm text-[var(--muted)]">
          Times and place filled from date {index}. Change them if this one’s
          different.
        </p>
      )}
      <div>
        <label htmlFor={`${prefix}-date`} className="block text-sm font-extrabold">
          Date
        </label>
        <input
          type="date"
          id={`${prefix}-date`}
          value={occurrence.date}
          onChange={(e) => onChange({ date: e.target.value })}
          required
          className="field"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`${prefix}-start`}
            className="block text-sm font-extrabold"
          >
            Starts
          </label>
          <input
            type="time"
            id={`${prefix}-start`}
            value={occurrence.start_time}
            onChange={(e) => onChange({ start_time: e.target.value })}
            required
            className="field"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-end`} className="block text-sm font-extrabold">
            Ends
            <span className="font-normal text-[var(--muted)]"> (optional)</span>
          </label>
          <input
            type="time"
            id={`${prefix}-end`}
            value={occurrence.end_time}
            onChange={(e) => onChange({ end_time: e.target.value })}
            className="field"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={`${prefix}-place`}
          className="block text-sm font-extrabold"
        >
          Place
        </label>
        <input
          type="text"
          id={`${prefix}-place`}
          value={occurrence.location_name}
          onChange={(e) => onChange({ location_name: e.target.value })}
          className="field"
          placeholder="Acorn Park Soccer Fields"
        />
      </div>
      <div>
        <label
          htmlFor={`${prefix}-address`}
          className="block text-sm font-extrabold"
        >
          Address
        </label>
        <input
          type="text"
          id={`${prefix}-address`}
          value={occurrence.address}
          onChange={(e) => onChange({ address: e.target.value })}
          className="field"
          placeholder="123 Main St"
        />
      </div>
    </div>
  )
}

export function EventDateSlips({
  occurrences,
  multiple,
  onChange,
  onAdd,
  onRemove,
}: {
  occurrences: Array<EventOccurrence>
  multiple: boolean
  onChange: (id: string, patch: Partial<EventOccurrence>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">When and where</h2>

      {multiple
        ? occurrences.map((occurrence, index) => (
            <div
              key={occurrence.id}
              className="pad space-y-4 rounded-sm px-4 py-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-extrabold">Date {index + 1}</h3>
                {occurrences.length > 1 && (
                  <button
                    type="button"
                    className="text-sm font-extrabold text-[var(--danger)]"
                    onClick={() => onRemove(occurrence.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <OccurrenceFields
                occurrence={occurrence}
                index={index}
                multiple
                onChange={(patch) => onChange(occurrence.id, patch)}
              />
            </div>
          ))
        : occurrences[0] && (
            <OccurrenceFields
              occurrence={occurrences[0]}
              index={0}
              multiple={false}
              onChange={(patch) => onChange(occurrences[0].id, patch)}
            />
          )}

      <button
        type="button"
        onClick={onAdd}
        className="text-sm font-extrabold text-[var(--marker)]"
      >
        Add date
      </button>
    </div>
  )
}

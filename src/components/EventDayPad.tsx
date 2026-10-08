import { EventCard } from './EventCard'
import type { DayGroup } from '../lib/schedule'

export function EventDayPad({
  group,
  highlightId,
  knownYouthNames,
  onAddYouth,
  onDelete,
}: {
  group: DayGroup
  highlightId?: number
  knownYouthNames: Array<string>
  onAddYouth: (eventId: number, name: string) => Promise<void>
  onDelete?: (eventId: number) => Promise<void>
}) {
  return (
    <div className="pad overflow-hidden rounded-sm">
      <h3 className="font-display bg-[color-mix(in_srgb,var(--marker)_12%,transparent)] px-4 py-2 text-xl tracking-wide">
        {group.label}
      </h3>
      <div className="px-4">
        {group.events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            defaultOpen={event.id === highlightId}
            knownYouthNames={knownYouthNames}
            onAddYouth={(name) => onAddYouth(event.id, name)}
            onDelete={onDelete ? () => onDelete(event.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

import type { YouthEvent } from '../lib/db'

export function EventCard({ event }: { event: YouthEvent }) {
  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)

  // Format date: "Mon, Oct 25, 2025"
  const dateString = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Format time: "6:00 PM - 8:00 PM"
  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm shadow-md hover:bg-white/15 transition-colors">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-xl font-bold text-white">{event.title}</h3>
          <p className="text-sm text-white/70">{event.participant_name}</p>
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
      </div>
    </div>
  )
}

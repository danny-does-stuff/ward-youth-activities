// Placeholder for Supabase server client (service role)
// This will be implemented when Supabase integration is added

export type YouthEvent = {
  id: number
  title: string
  participant_name: string
  starts_at: string // UTC ISO timestamp
  ends_at: string // UTC ISO timestamp
  location_name?: string
  address?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  approved: boolean
  created_at: string
}

// Temporary in-memory storage (will be replaced with Supabase)
const events: Array<YouthEvent> = [
  {
    id: 1,
    title: 'Basketball Tournament',
    participant_name: 'John Smith',
    starts_at: new Date('2025-10-25T18:00:00Z').toISOString(),
    ends_at: new Date('2025-10-25T20:00:00Z').toISOString(),
    location_name: 'Church Gym',
    address: '123 Main St',
    contact_name: 'Jane Doe',
    contact_email: 'jane@example.com',
    contact_phone: '555-1234',
    notes: 'Bring your own water bottle',
    approved: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Music Concert',
    participant_name: 'Emily Johnson',
    starts_at: new Date('2025-11-01T19:00:00Z').toISOString(),
    ends_at: new Date('2025-11-01T21:00:00Z').toISOString(),
    location_name: 'Community Center',
    approved: true,
    created_at: new Date().toISOString(),
  },
]

export const db = {
  // Placeholder functions - will use Supabase client later
  getEvents: async () => events,
  addEvent: async (event: Omit<YouthEvent, 'id' | 'created_at'>) => {
    const newEvent: YouthEvent = {
      ...event,
      id: events.length + 1,
      created_at: new Date().toISOString(),
    }
    events.push(newEvent)
    return newEvent
  },
}

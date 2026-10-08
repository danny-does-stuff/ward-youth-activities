export type YouthEvent = {
  id: number
  title: string
  participant_names: Array<string>
  starts_at: string
  ends_at: string
  location_name?: string
  address?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  approved: boolean
  created_at: string
}

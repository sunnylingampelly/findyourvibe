export interface User {
  id: string
  name: string
  display_name?: string
  email: string
  role: 'user' | 'super_admin'
  account_status: 'active' | 'suspended' | 'deleted'
  email_verified_at?: string
  onboarding_completed_at?: string
  profile?: UserProfile
  preferences?: UserPreferences
  interests?: Interest[]
  languages?: Language[]
  services?: Service[]
}

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  date_of_birth: string
  gender: string
  bio?: string
  introduction?: string
  country?: Country
  city?: City
  profile_photo_url?: string
  is_companion: boolean
  companion_verification_status: CompanionStatus
  avg_rating?: number
  rating_count: number
}

export type CompanionStatus =
  'not_started' | 'draft' | 'submitted' | 'under_review' |
  'additional_info_required' | 'approved' | 'rejected' | 'suspended'

export interface UserPreferences {
  preferred_min_age?: number
  preferred_max_age?: number
  preferred_discovery_radius_km: number
  discovery_enabled: boolean
  show_online_status: boolean
}

export interface Interest { id: string; name: string; icon?: string; color?: string }
export interface Language { id: string; name: string; code: string }
export interface Service {
  id: string; name: string; slug: string; description?: string; icon?: string; color?: string
  price_per_session?: number | null
  price_currency?: string | null
  price_unit?: string | null
}
export interface Country { id: string; name: string; code: string; phone_code: string }
export interface City { id: string; name: string; country_id: string }

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

export interface Booking {
  id: string
  status: BookingStatus
  proposed_date: string
  proposed_time: string
  duration_hours?: string
  notes?: string
  location_notes?: string
  agreed_rate?: number
  companion_response_note?: string
  requester?: { id: string; display_name: string; profile_photo_url?: string }
  companion?: { id: string; display_name: string; profile_photo_url?: string }
  service?: { id: string; name: string; slug: string }
  created_at: string
}

export interface PublicProfile {
  id: string
  display_name: string
  age?: number
  // API returns nested location object: { city, country }
  location?: { city?: City; country?: Country }
  city?: City
  country?: Country
  bio?: string
  introduction?: string
  profile_photo_url?: string
  is_companion: boolean
  companion_verification_status?: CompanionStatus
  avg_rating?: number
  rating_count?: number
  interests?: Interest[]
  languages?: Language[]
  services?: Service[]
}

export interface ConnectionRequest {
  id: string
  sender: PublicProfile
  receiver: PublicProfile
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired' | 'revoked' | 'blocked'
  message?: string
  created_at: string
}

export interface Connection {
  id: string
  other_user: PublicProfile
  connected_at: string
  conversation_id?: string
}

export interface Conversation {
  id: string
  connection_id: string
  other_user: PublicProfile
  last_message?: Message
  unread_count: number
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender: PublicProfile
  body?: string
  type: 'text' | 'image'
  read_at?: string | null
  created_at: string
}

export interface Notification {
  id: string
  type: string
  data: Record<string, unknown>
  read_at?: string
  created_at: string
}

export interface CompanionDocument {
  id: string
  document_type: string
  original_name: string
  mime_type?: string
  created_at: string
}

export interface CompanionApplication {
  id: string
  user_id: string
  legal_name: string
  status: CompanionStatus
  submission_notes?: string
  admin_notes?: string
  rejection_reason?: string
  reviewed_at?: string
  created_at: string
  documents?: CompanionDocument[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}

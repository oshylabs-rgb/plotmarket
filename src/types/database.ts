export type UserRole = 'user' | 'admin'

export type AccountType = 'basic' | 'starter' | 'professional' | 'business' | 'enterprise'

export type UserType = 'individual' | 'agent' | 'developer'

export type PropertyType = 'house' | 'apartment' | 'land' | 'commercial' | 'development'

export type ListingType = 'sale' | 'rent' | 'lease'

export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'paused'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export type InquiryStatus = 'unread' | 'read' | 'replied'

export type TitleDocumentType =
  | 'c_of_o'
  | 'governors_consent'
  | 'deed_of_assignment'
  | 'excision'
  | 'gazette'
  | 'registered_survey'
  | 'allocation_letter'
  | 'family_receipt'
  | 'unknown'

export const TITLE_DOCUMENT_LABELS: Record<TitleDocumentType, string> = {
  c_of_o: 'Certificate of Occupancy (C of O)',
  governors_consent: 'Governor’s Consent',
  deed_of_assignment: 'Deed of Assignment',
  excision: 'Excision',
  gazette: 'Gazette',
  registered_survey: 'Registered Survey',
  allocation_letter: 'Allocation Letter',
  family_receipt: 'Family Receipt',
  unknown: 'Not stated',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  account_type: AccountType
  user_type: UserType
  is_verified: boolean
  avatar_url: string | null
  company_name: string | null
  cac_number: string | null
  created_at: string
}

/** The seller details a public listing page shows. Nothing else leaves the server. */
export const SELLER_CONTACT_COLUMNS = 'id, full_name, phone, email, user_type, company_name, avatar_url'
export type SellerContact = Pick<
  Profile,
  'id' | 'full_name' | 'phone' | 'email' | 'user_type' | 'company_name' | 'avatar_url'
>

export interface Property {
  id: string
  user_id: string
  title: string
  description: string | null
  type: PropertyType
  listing_type: ListingType
  price: number
  location: string | null
  state: string
  city: string | null
  bedrooms: number | null
  bathrooms: number | null
  area: number | null
  images: string[]
  videos: string[]
  images_360: string[]
  videos_360: string[]
  title_document: TitleDocumentType
  features: string[]
  status: PropertyStatus
  is_featured: boolean
  is_verified: boolean
  /** Sample listing made by Plotmarket; never real inventory. */
  is_demo: boolean
  published_at: string | null
  paused_from: PropertyStatus | null
  paused_reason: 'plan_limit' | 'owner' | null
  estate_name: string | null
  pilot_id: string | null
  created_at: string
}

export type PilotStatus = 'requested' | 'active' | 'expired' | 'rejected' | 'revoked'

export interface Pilot {
  id: string
  user_id: string
  status: PilotStatus
  company_name: string
  cac_number: string
  project_name: string
  project_state: string
  project_area: string | null
  terms_accepted_at: string
  requested_at: string
  decided_at: string | null
  decided_by: string | null
  activated_at: string | null
  ends_at: string | null
  setup_session_at: string | null
  expiry_warning_sent_at: string | null
  admin_notes: string | null
  created_at: string
}

/** One row from the plan_status() database function. */
export interface PlanStatus {
  plan: 'basic' | 'pilot' | 'professional' | 'starter' | 'business' | 'enterprise'
  /** null means no limit */
  max_active: number | null
  active_count: number
  paused_count: number
  paid_plan: string | null
  paid_until: string | null
  pilot_id: string | null
  pilot_status: PilotStatus | null
  pilot_ends_at: string | null
  pilot_project_name: string | null
  pilot_project_state: string | null
}

export interface Subscription {
  id: string
  user_id: string
  plan: AccountType
  amount: number
  start_date: string
  end_date: string
  status: SubscriptionStatus
  paystack_reference: string | null
  paystack_subscription_code: string | null
  paystack_customer_code: string | null
  paystack_plan_code: string | null
  created_at: string
}

export interface Inquiry {
  id: string
  property_id: string
  sender_id: string
  receiver_id: string
  message: string
  status: InquiryStatus
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      properties: {
        Row: Property
        Insert: Omit<
          Property,
          | 'id'
          | 'created_at'
          | 'status'
          | 'is_featured'
          | 'is_verified'
          | 'is_demo'
          | 'published_at'
          | 'paused_from'
          | 'paused_reason'
          | 'pilot_id'
        >
        Update: Partial<Omit<Property, 'id' | 'created_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
      }
      inquiries: {
        Row: Inquiry
        Insert: Omit<Inquiry, 'id' | 'created_at' | 'status'>
        Update: Partial<Omit<Inquiry, 'id' | 'created_at'>>
      }
    }
  }
}

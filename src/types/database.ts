export type UserRole = 'user' | 'admin'

export type AccountType = 'basic' | 'starter' | 'professional' | 'business' | 'enterprise'

export type UserType = 'individual' | 'agent' | 'developer'

export type PropertyType = 'house' | 'apartment' | 'land' | 'commercial' | 'development'

export type ListingType = 'sale' | 'rent' | 'lease'

export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'sold'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export type InquiryStatus = 'unread' | 'read' | 'replied'

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
  features: string[]
  status: PropertyStatus
  is_featured: boolean
  is_verified: boolean
  created_at: string
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
        Insert: Omit<Property, 'id' | 'created_at' | 'status' | 'is_featured' | 'is_verified'>
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

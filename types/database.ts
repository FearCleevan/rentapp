// types/database.ts
// Auto-reflects the full Supabase schema after migration
// Last updated: Phase 2A

export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enum types (mirror database enums) ──────────────────────────────────────

export type ListingCategory =
  | 'parking'
  | 'room'
  | 'vehicle'
  | 'equipment'
  | 'venue'
  | 'meeting_room'
  | 'storage';

export type ListingStatus   = 'draft' | 'active' | 'paused' | 'deleted';
export type PriceUnit       = 'hour' | 'day' | 'week' | 'month';
export type BookingStatus   =
  | 'pending_payment'
  | 'payment_processing'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'disputed';
export type PayoutStatus         = 'pending' | 'processing' | 'paid' | 'failed';
export type IdVerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

// ─── Database interface ───────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      // ── profiles ─────────────────────────────────────────────────────────
      profiles: {
        Row: {
          id:                      string;
          full_name:               string;
          phone:                   string | null;
          avatar_url:              string | null;
          bio:                     string | null;
          default_lat:             number | null;
          default_lng:             number | null;
          default_city:            string | null;
          id_verification_status:  IdVerificationStatus;
          gov_id_url:              string | null;
          gov_id_selfie_url:       string | null;
          is_verified:             boolean;
          total_listings:          number;
          total_earnings:          number;
          host_rating:             number | null;
          host_review_count:       number;
          total_bookings:          number;
          renter_rating:           number | null;
          renter_review_count:     number;
          expo_push_token:         string | null;
          created_at:              string;
          updated_at:              string;
        };
        Insert: {
          id:            string;
          full_name:     string;
          phone?:        string | null;
          avatar_url?:   string | null;
          bio?:          string | null;
          default_city?: string | null;
        };
        Update: Partial<Omit<
          Database['public']['Tables']['profiles']['Row'],
          'id' | 'created_at' | 'is_verified'
        >>;
        Relationships: [];
      };

      // ── listings ──────────────────────────────────────────────────────────
      listings: {
        Row: {
          id:                   string;
          host_id:              string;
          category:             ListingCategory;
          title:                string;
          description:          string | null;
          tags:                 string[];
          address:              string;
          city:                 string;
          barangay:             string | null;
          lat:                  number;
          lng:                  number;
          price:                number;
          price_unit:           PriceUnit;
          deposit:              number;
          instant_book:         boolean;
          min_booking_hours:    number;
          max_booking_days:     number;
          advance_notice_hours: number;
          buffer_hours:         number;
          amenities:            string[];
          house_rules:          string | null;
          cancellation_policy:  string;
          cover_photo_url:      string | null;
          photos:               string[];
          review_count:         number;
          avg_rating:           number;
          total_bookings:       number;
          status:               ListingStatus;
          is_featured:          boolean;
          created_at:           string;
          updated_at:           string;
        };
        Insert: Omit<
          Database['public']['Tables']['listings']['Row'],
          'id' | 'created_at' | 'updated_at' | 'review_count' | 'avg_rating' | 'total_bookings'
        >;
        Update: Partial<Database['public']['Tables']['listings']['Insert']>;
        Relationships: [
          { foreignKeyName: 'listings_host_id_fkey'; columns: ['host_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ];
      };

      // ── listing detail tables ─────────────────────────────────────────────
      listing_parking: {
        Row: {
          listing_id:     string;
          space_type:     'covered' | 'open' | 'underground' | 'garage' | null;
          vehicle_types:  string[];
          total_area_sqm: number | null;
          has_cctv:       boolean;
          has_ev_charger: boolean;
          access_type:    'key' | 'card' | 'gate_code' | 'open' | null;
          floor_level:    string | null;
        };
        Insert: Omit<Database['public']['Tables']['listing_parking']['Row'], never>;
        Update: Partial<Database['public']['Tables']['listing_parking']['Row']>;
        Relationships: [];
      };

      listing_rooms: {
        Row: {
          listing_id:     string;
          room_type:      'private_room' | 'studio' | 'apartment' | 'house' | 'condo' | 'bed_space' | null;
          total_area_sqm: number | null;
          max_guests:     number;
          bedrooms:       number;
          bathrooms:      number;
          has_aircon:     boolean;
          has_wifi:       boolean;
          has_kitchen:    boolean;
          has_parking:    boolean;
          furnished:      boolean;
          check_in_time:  string;
          check_out_time: string;
        };
        Insert: Omit<Database['public']['Tables']['listing_rooms']['Row'], never>;
        Update: Partial<Database['public']['Tables']['listing_rooms']['Row']>;
        Relationships: [];
      };

      listing_vehicles: {
        Row: {
          listing_id:         string;
          vehicle_type:       'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle' | 'bus' | 'other' | null;
          make:               string | null;
          model:              string | null;
          year:               number | null;
          color:              string | null;
          plate_number:       string | null;
          transmission:       'automatic' | 'manual' | null;
          fuel_type:          'gasoline' | 'diesel' | 'electric' | 'hybrid' | null;
          seats:              number;
          with_driver:        boolean;
          fuel_included:      boolean;
          mileage_limit_km:   number | null;
          insurance_included: boolean;
        };
        Insert: Omit<Database['public']['Tables']['listing_vehicles']['Row'], never>;
        Update: Partial<Database['public']['Tables']['listing_vehicles']['Row']>;
        Relationships: [];
      };

      listing_equipment: {
        Row: {
          listing_id:      string;
          equipment_type:  string | null;
          brand:           string | null;
          model:           string | null;
          condition:       'new' | 'excellent' | 'good' | 'fair' | null;
          quantity:        number;
          includes:        string[] | null;
          requires_deposit: boolean;
          damage_policy:   string | null;
        };
        Insert: Omit<Database['public']['Tables']['listing_equipment']['Row'], never>;
        Update: Partial<Database['public']['Tables']['listing_equipment']['Row']>;
        Relationships: [];
      };

      listing_venues: {
        Row: {
          listing_id:      string;
          venue_type:      'rooftop' | 'function_hall' | 'garden' | 'beach' | 'indoor' | 'outdoor' | 'other' | null;
          total_area_sqm:  number | null;
          max_capacity:    number | null;
          has_sound_system: boolean;
          has_projector:   boolean;
          has_aircon:      boolean;
          has_catering:    boolean;
          has_parking:     boolean;
          setup_types:     string[];
          min_hours:       number;
        };
        Insert: Omit<Database['public']['Tables']['listing_venues']['Row'], never>;
        Update: Partial<Database['public']['Tables']['listing_venues']['Row']>;
        Relationships: [];
      };

      listing_meeting_rooms: {
        Row: {
          listing_id:    string;
          room_type:     'boardroom' | 'training_room' | 'hot_desk' | 'private_office' | 'open_space' | null;
          total_area_sqm: number | null;
          max_capacity:  number;
          has_projector: boolean;
          has_whiteboard: boolean;
          has_wifi:      boolean;
          has_coffee:    boolean;
          has_printer:   boolean;
          setup_types:   string[];
          amenities:     string[];
        };
        Insert: Omit<Database['public']['Tables']['listing_meeting_rooms']['Row'], never>;
        Update: Partial<Database['public']['Tables']['listing_meeting_rooms']['Row']>;
        Relationships: [];
      };

      // ── availability ──────────────────────────────────────────────────────
      availability: {
        Row: {
          id:         string;
          listing_id: string;
          start_time: string;
          end_time:   string;
          reason:     string;
          booking_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['availability']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['availability']['Insert']>;
        Relationships: [];
      };

      // ── bookings ──────────────────────────────────────────────────────────
      bookings: {
        Row: {
          id:                  string;
          listing_id:          string;
          renter_id:           string;
          host_id:             string;
          start_time:          string;
          end_time:            string;
          price_per_unit:      number | null;
          price_unit:          PriceUnit | null;
          duration_hours:      number | null;
          base_amount:         number | null;
          service_fee:         number | null;
          host_fee:            number | null;
          deposit_amount:      number;
          total_charge:        number | null;
          host_payout:         number | null;
          // legacy columns kept for backward compat
          total_amount:        number | null;
          status:              BookingStatus;
          vehicle_plate:       string | null;
          vehicle_type:        string | null;
          vehicle_color:       string | null;
          guest_count:         number | null;
          special_notes:       string | null;
          paymongo_link_id:    string | null;
          paymongo_link_url:   string | null;
          paymongo_payment_id: string | null;
          paid_at:             string | null;
          confirmed_at:        string | null;
          activated_at:        string | null;
          completed_at:        string | null;
          cancelled_at:        string | null;
          cancellation_reason: string | null;
          cancelled_by:        string | null;
          created_at:          string;
        };
        Insert: Omit<
          Database['public']['Tables']['bookings']['Row'],
          'id' | 'created_at' | 'confirmed_at' | 'activated_at' | 'completed_at' | 'cancelled_at'
        >;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [];
      };

      // ── payments ──────────────────────────────────────────────────────────
      payments: {
        Row: {
          id:                   string;
          booking_id:           string;
          paymongo_event_type:  string;
          paymongo_resource_id: string | null;
          amount:               number;
          currency:             string;
          status:               string;
          raw_payload:          Json | null;
          created_at:           string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
        Relationships: [];
      };

      // ── payouts ───────────────────────────────────────────────────────────
      payouts: {
        Row: {
          id:               string;
          booking_id:       string;
          host_id:          string;
          amount:           number;
          status:           PayoutStatus;
          payout_method:    string;
          payout_reference: string | null;
          scheduled_for:    string | null;
          paid_at:          string | null;
          notes:            string | null;
          created_at:       string;
        };
        Insert: Omit<Database['public']['Tables']['payouts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>;
        Relationships: [];
      };

      // ── reviews ───────────────────────────────────────────────────────────
      reviews: {
        Row: {
          id:                   string;
          booking_id:           string;
          listing_id:           string;
          reviewer_id:          string;
          reviewee_id:          string;
          review_type:          'renter_to_host' | 'host_to_renter';
          rating:               number;
          accuracy_rating:      number | null;
          communication_rating: number | null;
          value_rating:         number | null;
          cleanliness_rating:   number | null;
          comment:              string | null;
          is_public:            boolean;
          created_at:           string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
        Relationships: [];
      };

      // ── messages ──────────────────────────────────────────────────────────
      messages: {
        Row: {
          id:          string;
          booking_id:  string;
          sender_id:   string;
          receiver_id: string;
          body:        string;
          is_read:     boolean;
          read_at:     string | null;
          created_at:  string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };

      // ── saved_listings ────────────────────────────────────────────────────
      saved_listings: {
        Row: {
          id:         string;
          user_id:    string;
          listing_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_listings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['saved_listings']['Insert']>;
        Relationships: [];
      };

      // ── notifications ─────────────────────────────────────────────────────
      notifications: {
        Row: {
          id:         string;
          user_id:    string;
          type:       string;
          title:      string;
          body:       string;
          data:       Json;
          is_read:    boolean;
          read_at:    string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
    };

    Views: {};

    Functions: {
      calculate_booking_fees: {
        Args: {
          p_listing_id: string;
          p_start_time: string;
          p_end_time:   string;
        };
        Returns: {
          base_amount:    number;
          service_fee:    number;
          host_fee:       number;
          deposit_amount: number;
          total_charge:   number;
          host_payout:    number;
          duration_hours: number;
          price_unit:     string;
        }[];
      };
      is_listing_available: {
        Args: {
          p_listing_id: string;
          p_start_time: string;
          p_end_time:   string;
          p_booking_id?: string;
        };
        Returns: boolean;
      };
    };

    Enums: {};
  };
}

// ─── Convenience type aliases ─────────────────────────────────────────────────

export type Profile         = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate   = Database['public']['Tables']['profiles']['Update'];
export type Listing         = Database['public']['Tables']['listings']['Row'];
export type ListingInsert   = Database['public']['Tables']['listings']['Insert'];
export type Booking         = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert   = Database['public']['Tables']['bookings']['Insert'];
export type Review          = Database['public']['Tables']['reviews']['Row'];
export type Message         = Database['public']['Tables']['messages']['Row'];
export type MessageInsert   = Database['public']['Tables']['messages']['Insert'];
export type SavedListing    = Database['public']['Tables']['saved_listings']['Row'];
export type Notification    = Database['public']['Tables']['notifications']['Row'];
export type Payout          = Database['public']['Tables']['payouts']['Row'];
export type Payment         = Database['public']['Tables']['payments']['Row'];
export type Availability    = Database['public']['Tables']['availability']['Row'];

// ─── Joined / enriched types (for queries that join tables) ──────────────────

export type ListingWithHost = Listing & {
  host: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'is_verified' | 'host_rating' | 'host_review_count'>;
};

export type BookingWithListing = Booking & {
  listing: Pick<Listing, 'id' | 'title' | 'category' | 'address' | 'cover_photo_url' | 'price' | 'price_unit'>;
};

export type BookingWithParties = Booking & {
  listing: Pick<Listing, 'id' | 'title' | 'category' | 'cover_photo_url'>;
  renter:  Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'is_verified'>;
  host:    Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'is_verified'>;
};
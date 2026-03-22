//types/database.ts
export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:              string;
          full_name:       string;
          phone:           string | null;
          avatar_url:      string | null;
          is_verified:     boolean;
          gov_id_url:      string | null;
          expo_push_token: string | null;
          created_at:      string;
          updated_at:      string | null;
        };
        Insert: {
          id:           string;
          full_name:    string;
          phone?:       string | null;
          avatar_url?:  string | null;
          is_verified?: boolean;
        };
        Update: {
          full_name?:       string;
          phone?:           string | null;
          avatar_url?:      string | null;
          is_verified?:     boolean;
          expo_push_token?: string | null;
          updated_at?:      string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id:           string;
          host_id:      string;
          category:     'parking' | 'room' | 'vehicle' | 'equipment' | 'event_venue' | 'meeting_room' | 'storage';
          title:        string;
          description:  string | null;
          address:      string;
          city:         string;
          lat:          number;
          lng:          number;
          price:        number;
          price_unit:   'hour' | 'day' | 'week' | 'month';
          deposit:      number;
          instant_book: boolean;
          review_count: number;
          avg_rating:   number;
          status:       'draft' | 'active' | 'paused' | 'deleted';
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<
          Database['public']['Tables']['listings']['Row'],
          'id' | 'created_at' | 'updated_at' | 'review_count' | 'avg_rating'
        >;
        Update: Partial<Database['public']['Tables']['listings']['Insert']>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id:                string;
          listing_id:        string;
          renter_id:         string;
          host_id:           string;
          start_time:        string;
          end_time:          string;
          total_amount:      number;
          service_fee:       number;
          host_payout:       number;
          status:            'pending_payment' | 'payment_processing' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed';
          vehicle_plate:     string | null;
          vehicle_type:      string | null;
          special_notes:     string | null;
          paymongo_link_url: string | null;
          paid_at:           string | null;
          created_at:        string;
        };
        Insert: Omit<
          Database['public']['Tables']['bookings']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
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
          base_amount:  number;
          service_fee:  number;
          host_fee:     number;
          deposit:      number;
          total_charge: number;
          host_payout:  number;
          duration:     number;
          price_unit:   string;
        };
      };
    };
    Enums: {};
  };
}

// ─── Convenience type aliases ─────────────────────────────────────────────────

export type Profile         = Database['public']['Tables']['profiles']['Row'];
export type Listing         = Database['public']['Tables']['listings']['Row'];
export type Booking         = Database['public']['Tables']['bookings']['Row'];
export type ListingCategory = Listing['category'];
export type BookingStatus   = Booking['status'];
export type ListingStatus   = Listing['status'];

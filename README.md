# RentApp

A two-sided rental marketplace built with React Native and Expo. Renters can discover and book parking slots, rooms, vehicles, equipment, event venues, meeting rooms, and storage spaces. Hosts can list their spaces, manage bookings, and track earnings — all in a single mobile app.

---

## Features

### For Renters
- **Browse & Search** — Filter listings by category, keyword, and distance radius. Results are sorted by proximity using the Haversine formula.
- **Explore Feed** — Featured listings carousel, newly added listings, and top hosts displayed on the home screen.
- **Listing Detail Sheet** — Full-screen bottom sheet showing photos, amenities, host info, map preview, and pricing before booking.
- **Save / Wishlist** — Heart any listing to save it. Saved listings persist to your account and are accessible from the Saved tab.
- **Bookings** — Track upcoming and past bookings with status indicators (Pending Payment, Confirmed, Active, Completed, Cancelled, Disputed).
- **Host Profiles** — View a host's public profile: ratings, years hosting, verified badge, all their listings, and renter reviews.

### For Hosts
- **Listing Creation Wizard** — 8-step guided form: category → title & description → location picker → pricing → amenities → photos → house rules → review & publish.
- **Listing Management** — Activate, pause, or edit listings from the host dashboard.
- **Earnings & Payouts** — View total earnings, payout history, and payout status (Pending / Processing / Paid).
- **Become a Host** — Built-in onboarding pitch for users who aren't yet hosting.

### Account & Security
- **Email + Password Auth** — Registration requires email verification before first login.
- **Two-Step Registration** — Name + phone first, then email + password with a real-time password strength indicator.
- **ID Verification** — Upload a government ID front photo and a selfie for identity verification.
- **Edit Profile** — Update display name, phone, city, bio, and avatar.
- **Change Password** — Secure password update from within the app.
- **Notifications** — In-app notification history with read/unread tracking.

### Listing Categories
| Category | Icon | Description |
|---|---|---|
| Parking | 🅿️ | Covered/open parking slots |
| Room | 🏠 | Private rooms and studio units |
| Vehicle | 🚗 | Self-drive car rentals |
| Equipment | 🔧 | Cameras, tools, and gear |
| Event Venue | 🎪 | Function halls and rooftop spaces |
| Meeting Room | 🏢 | Conference and coworking spaces |
| Storage | 📦 | Storage units and warehouses |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5 + Expo 54 |
| Navigation | Expo Router 6 (file-based) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| State Management | Zustand 4.5 |
| Forms | React Hook Form 7 + Zod |
| UI Library | React Native Paper 5 |
| Typography | Plus Jakarta Sans (expo-google-fonts) |
| Animations | Moti + React Native Reanimated 4 |
| Maps | React Native Maps + Expo Location |
| Images | expo-image + expo-image-picker |
| Gradients | expo-linear-gradient |
| Notifications | expo-notifications |
| Secure Storage | expo-secure-store |
| Language | TypeScript 5 |

---

## Project Structure

```
rentapp/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (fonts, auth guard, paper provider)
│   ├── (auth)/                 # Unauthenticated screens
│   │   ├── onboarding.tsx      # App intro carousel
│   │   ├── login.tsx           # Sign in
│   │   ├── register.tsx        # Two-step sign up
│   │   └── forgot.tsx          # Password reset
│   ├── (tabs)/                 # Main tab navigation
│   │   ├── explore/            # Listing browse + search
│   │   ├── bookings/           # Upcoming & past bookings
│   │   ├── saved/              # Saved/wishlist listings
│   │   ├── host/               # Host dashboard
│   │   └── profile/            # User profile & settings
│   ├── listings/
│   │   ├── all.tsx             # Full listing grid with filters
│   │   ├── create.tsx          # 8-step listing creation wizard
│   │   └── new.tsx             # Recently added listings
│   ├── hosts/
│   │   ├── [id].tsx            # Public host profile
│   │   └── all.tsx             # Browse all hosts
│   ├── profile/                # Profile sub-screens
│   │   ├── edit-profile.tsx
│   │   ├── verify-id.tsx
│   │   ├── change-password.tsx
│   │   ├── notifications.tsx
│   │   └── host/               # Host-specific settings
│   └── become-host/            # Host onboarding
│
├── components/
│   ├── ui/                     # Shared primitives
│   │   ├── AppText.tsx         # Typography component
│   │   ├── AppButton.tsx       # Button variants
│   │   ├── AppInput.tsx        # Form input with validation display
│   │   ├── CategoryIcon.tsx    # Category badge + CATEGORY_CONFIG map
│   │   └── Toast.tsx           # Global toast notifications (Zustand)
│   ├── explore/                # Explore tab components
│   │   ├── BannerCarousel.tsx  # Featured / New / Top Hosts sections
│   │   ├── ListingCard.tsx     # Gradient overlay listing card
│   │   ├── ListingDetailSheet.tsx  # Full detail bottom sheet
│   │   ├── RadiusFilterSheet.tsx   # Distance filter UI
│   │   └── exploreData.ts      # Listing + Category types, sample data
│   ├── listing/                # Listing creation step components
│   └── maps/                   # Map picker components (OSM + Google)
│
├── hooks/
│   ├── useSession.ts           # Auth lifecycle + profile hydration
│   ├── useListings.ts          # Listing fetch with debounced filters
│   ├── useBookings.ts          # Bookings + saved listings hooks
│   └── useProfile.ts           # Profile update helpers
│
├── lib/
│   ├── supabase.ts             # Supabase client + auth helpers
│   ├── listingsService.ts      # All listing Supabase queries
│   ├── bookingsService.ts      # Bookings + saved listings queries
│   ├── profileService.ts       # Profile + ID verification + uploads
│   ├── listingCreateService.ts # Listing creation + photo upload
│   ├── payoutsService.ts       # Host payout queries
│   └── notificationsService.ts # Notification queries
│
├── store/
│   └── authStore.ts            # Zustand store (session, user, profile)
│
├── types/
│   └── database.ts             # TypeScript types matching DB schema
│
└── constants/
    └── theme.ts                # Colors, spacing, radius, shadow, typography
```

---

## Database Schema (Supabase)

### Core Tables

**`profiles`** — Extends `auth.users`
- User info: `full_name`, `phone`, `avatar_url`, `bio`, `default_city`
- Host metrics: `total_listings`, `total_earnings`, `host_rating`, `host_review_count`
- Verification: `id_verification_status` (`none` | `pending` | `approved` | `rejected`), `is_verified`, `is_host`

**`listings`**
- Categories: `parking` | `room` | `vehicle` | `equipment` | `event_venue` | `meeting_room` | `storage`
- Pricing: `price`, `price_unit` (`hour` | `day` | `week` | `month`), `deposit`
- Status: `draft` | `active` | `paused` | `deleted`
- Booking config: `instant_book`, `min_booking_hours`, `advance_notice_hours`
- Media: `cover_photo_url`, `photos[]`

**`bookings`**
- Statuses: `pending_payment` → `payment_processing` → `confirmed` → `active` → `completed`
- Payment: `paymongo_link_url`, `paid_at`
- Cancellation: `cancelled_at`, `cancelled_by`, `cancellation_reason`

**`saved_listings`** — User wishlist (user_id + listing_id pairs)

**`reviews`** — `renter_to_host` or `host_to_renter` review types

**`payouts`** — Host payout records with status tracking

**`notifications`** — In-app notification history with read state

### Storage Buckets
- `avatars/` — Profile pictures
- `listing-photos/` — Listing images
- `id-documents/` — Government ID verification photos

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) on your device, or Android/iOS simulators set up
- A [Supabase](https://supabase.com/) project with the schema applied
- A [Google Maps API key](https://developers.google.com/maps) (for the map picker)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rentapp.git
cd rentapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project under **Settings → API**.

### 4. Add your Google Maps API key

In `app.json`, replace the placeholder with your real key:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

### 5. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com/)
2. Apply the database schema (see the **Database Schema** section above for the required tables)
3. Enable **Email Auth** under Authentication → Providers
4. Enable **Email confirmation** (required before first login)
5. Create storage buckets: `avatars`, `listing-photos`, `id-documents`
6. Set appropriate Row Level Security (RLS) policies on each table

### 6. Run the app

```bash
# Start the Expo development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key | Yes |

> Google Maps API key is configured in `app.json`, not `.env`, because it must be embedded at build time for the native Maps SDK.

---

## Development Notes

- **Distance calculation** uses the Haversine formula. The default base location is Davao City (7.0731°N, 125.6126°E) when device location is unavailable.
- **Image uploads** use `ArrayBuffer` instead of `Blob` for reliable `file://` URI support on Android.
- **Optimistic updates** are used for save/unsave — local state updates immediately, then syncs with Supabase in the background.
- **Listing creation** uploads each photo individually to the `listing-photos` bucket. The first photo selected becomes the cover photo.
- **Payments** are handled via PayMongo. The `paymongo_link_url` stored in bookings directs renters to a PayMongo-hosted checkout page.
- **Toast notifications** use a global Zustand store (`useToast`) consumed by `ToastProvider` mounted at the app root, so any screen can trigger toasts without prop drilling.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes
4. Push to your fork and open a pull request

---

## License

This project is private. All rights reserved.

// components/explore/exploreData.ts

export type Category = 'all' | 'parking' | 'room' | 'vehicle' | 'equipment' | 'venue' | 'meeting';

export interface Listing {
  id:          string;
  category:    Exclude<Category, 'all'>;
  title:       string;
  location:    string;
  address?:    string;
  city?:       string;
  distance:    number;   // km
  lat:         number;
  lng:         number;
  userLat?:    number;
  userLng?:    number;
  price:       number;
  priceUnit:   string;
  rating:      number;
  reviewCount: number;
  isVerified:  boolean;
  instantBook: boolean;
  hostName:    string;
  hostAvatar:  string;
  amenities:   string[];
  emoji:       string;
  bgColor:     string;
  coverPhotoUrl?: string | null;
  photos?:     string[];
  description: string;
  totalArea?:  string;
  capacity?:   number;
}

export interface AdBanner {
  id:       string;
  title:    string;
  subtitle: string;
  cta:      string;
  emoji:    string;
  bg:       string;
  accent:   string;
}

export const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'all',       label: 'All',       icon: 'grid'      },
  { key: 'parking',   label: 'Parking',   icon: 'map-pin'   },
  { key: 'room',      label: 'Rooms',     icon: 'home'      },
  { key: 'vehicle',   label: 'Vehicles',  icon: 'truck'     },
  { key: 'equipment', label: 'Equipment', icon: 'tool'      },
  { key: 'venue',     label: 'Venues',    icon: 'calendar'  },
  { key: 'meeting',   label: 'Meetings',  icon: 'briefcase' },
];

export const AD_BANNERS: AdBanner[] = [
  {
    id:       'ad1',
    title:    'List your space today',
    subtitle: 'Start earning from your idle parking slot or extra room',
    cta:      'Start for free →',
    emoji:    '💰',
    bg:       '#FF6B35',
    accent:   '#FFD0B5',
  },
  {
    id:       'ad2',
    title:    'Monthly parking deals',
    subtitle: 'Save up to 50% with a monthly parking subscription',
    cta:      'View deals →',
    emoji:    '🅿️',
    bg:       '#0D9E75',
    accent:   '#9FE1CB',
  },
  {
    id:       'ad3',
    title:    'Need a car this weekend?',
    subtitle: 'Self-drive vehicles available starting ₱1,200/day',
    cta:      'Browse cars →',
    emoji:    '🚗',
    bg:       '#534AB7',
    accent:   '#AFA9EC',
  },
  {
    id:       'ad4',
    title:    'Host your next event',
    subtitle: 'Function halls and rooftops for any occasion',
    cta:      'Explore venues →',
    emoji:    '🎪',
    bg:       '#1A1A2E',
    accent:   '#7F77DD',
  },
];

export const LISTINGS: Listing[] = [
  {
    id:          '1',
    category:    'parking',
    title:       'Covered Parking · SM Lanang',
    location:    'JP Laurel Ave, Bajada, Davao City',
    distance:    0.8,
    lat:         7.0897,
    lng:         125.6145,
    price:       80,
    priceUnit:   'hour',
    rating:      4.9,
    reviewCount: 38,
    isVerified:  true,
    instantBook: true,
    hostName:    'Miguel R.',
    hostAvatar:  'MR',
    amenities:   ['CCTV', '24/7 Access', 'Covered', 'Key Card', 'EV Charging'],
    emoji:       '🅿️',
    bgColor:     '#F0EDE6',
    description: 'A clean, covered parking slot in a secure building near SM Lanang. Perfect for daily or monthly parking. 24/7 monitored with CCTV.',
    totalArea:   '12 sqm',
  },
  {
    id:          '2',
    category:    'vehicle',
    title:       'Toyota Vios 2022 · Automatic',
    location:    'Matina, Davao City',
    distance:    1.4,
    lat:         7.0731,
    lng:         125.6126,
    price:       1500,
    priceUnit:   'day',
    rating:      4.7,
    reviewCount: 22,
    isVerified:  true,
    instantBook: false,
    hostName:    'Ana S.',
    hostAvatar:  'AS',
    amenities:   ['5 seats', 'Self-drive', 'GPS', 'Dash cam', 'Unlimited km'],
    emoji:       '🚗',
    bgColor:     '#E8E4DC',
    description: 'Well-maintained Toyota Vios 2022 automatic. Great for day trips around Davao. Fuel not included. Driver not included.',
    capacity:    5,
  },
  {
    id:          '3',
    category:    'room',
    title:       'Private Room · Poblacion',
    location:    'Claveria St, Poblacion, Davao City',
    distance:    2.1,
    lat:         7.0655,
    lng:         125.6076,
    price:       800,
    priceUnit:   'night',
    rating:      4.8,
    reviewCount: 54,
    isVerified:  true,
    instantBook: true,
    hostName:    'Carlo M.',
    hostAvatar:  'CM',
    amenities:   ['WiFi', 'Aircon', 'Kitchen', 'Hot shower', 'Netflix'],
    emoji:       '🏠',
    bgColor:     '#EAF0E8',
    description: 'Cozy private room in a quiet area of Poblacion. Perfect for solo travelers or couples. Close to restaurants and transport.',
    totalArea:   '20 sqm',
    capacity:    2,
  },
  {
    id:          '4',
    category:    'equipment',
    title:       'Sony A7III Camera Kit',
    location:    'Buhangin, Davao City',
    distance:    3.2,
    lat:         7.1035,
    lng:         125.6289,
    price:       1200,
    priceUnit:   'day',
    rating:      5.0,
    reviewCount: 11,
    isVerified:  false,
    instantBook: false,
    hostName:    'Nico P.',
    hostAvatar:  'NP',
    amenities:   ['Lenses incl.', 'Tripod', 'Camera bag', '2 batteries', 'SD cards'],
    emoji:       '📷',
    bgColor:     '#EDE8F0',
    description: 'Full-frame mirrorless camera kit. Includes 24-70mm and 85mm lenses. Perfect for events, portraits, and travel photography.',
  },
  {
    id:          '5',
    category:    'venue',
    title:       'Rooftop Event Space',
    location:    'Damosa Gateway, Lanang, Davao',
    distance:    4.5,
    lat:         7.1055,
    lng:         125.6201,
    price:       8000,
    priceUnit:   'day',
    rating:      4.6,
    reviewCount: 17,
    isVerified:  true,
    instantBook: false,
    hostName:    'Gina T.',
    hostAvatar:  'GT',
    amenities:   ['200 pax', 'AV system', 'Parking', 'Aircon', 'Tables & chairs'],
    emoji:       '🎪',
    bgColor:     '#F0E8E8',
    description: 'Stunning rooftop venue with city view. Perfect for corporate events, birthdays, and weddings. Full AV setup included.',
    totalArea:   '300 sqm',
    capacity:    200,
  },
  {
    id:          '6',
    category:    'meeting',
    title:       'Meeting Room · 8 Seater',
    location:    'Abreeza Mall Area, Davao',
    distance:    1.9,
    lat:         7.0823,
    lng:         125.6197,
    price:       500,
    priceUnit:   'hour',
    rating:      4.8,
    reviewCount: 29,
    isVerified:  true,
    instantBook: true,
    hostName:    'Lara V.',
    hostAvatar:  'LV',
    amenities:   ['Projector', 'WiFi', 'Whiteboard', 'Coffee', 'Printer'],
    emoji:       '🏢',
    bgColor:     '#E8EEF0',
    description: 'Professional meeting room near Abreeza Mall. Ideal for team meetings, client presentations, and interviews.',
    totalArea:   '30 sqm',
    capacity:    8,
  },
  {
    id:          '7',
    category:    'parking',
    title:       'Open Parking · Abreeza Area',
    location:    'J.P. Laurel Ave, Agdao, Davao',
    distance:    2.3,
    lat:         7.0798,
    lng:         125.6158,
    price:       50,
    priceUnit:   'hour',
    rating:      4.3,
    reviewCount: 14,
    isVerified:  false,
    instantBook: true,
    hostName:    'Ben A.',
    hostAvatar:  'BA',
    amenities:   ['Open air', '24/7', 'Guarded'],
    emoji:       '🅿️',
    bgColor:     '#F0EDE6',
    description: 'Open parking space near Abreeza Mall. Affordable option for daily parking. Guarded 24/7.',
    totalArea:   '15 sqm',
  },
  {
    id:          '8',
    category:    'room',
    title:       'Studio Unit · Lanang',
    location:    'Lanang, Davao City',
    distance:    3.8,
    lat:         7.1021,
    lng:         125.6233,
    price:       1200,
    priceUnit:   'night',
    rating:      4.9,
    reviewCount: 41,
    isVerified:  true,
    instantBook: true,
    hostName:    'Sarah L.',
    hostAvatar:  'SL',
    amenities:   ['WiFi', 'Aircon', 'Pool access', 'Gym', 'Parking'],
    emoji:       '🏠',
    bgColor:     '#EAF0E8',
    description: 'Modern studio unit with pool and gym access. Fully furnished with kitchen. Great for extended stays.',
    totalArea:   '35 sqm',
    capacity:    2,
  },
];

export const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

export function filterListings(
  listings:  Listing[],
  category:  Category,
  search:    string,
  radiusKm:  number,
  userLat:   number,
  userLng:   number,
): Listing[] {
  return listings.filter(l => {
    const matchCat  = category === 'all' || l.category === category;
    const matchText = search === ''
      || l.title.toLowerCase().includes(search.toLowerCase())
      || l.location.toLowerCase().includes(search.toLowerCase());
    const matchDist = l.distance <= radiusKm;
    return matchCat && matchText && matchDist;
  });
}

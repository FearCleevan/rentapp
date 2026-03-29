// components/maps/LocationPickerGoogle.tsx
//
// ─── Google Maps version of LocationPicker ────────────────────────────────────
// Drop-in replacement for components/listing/LocationPicker.tsx
// Same props, same onChange signature, same saved-pins feature.
//
// SETUP (one-time):
//   1. Enable "Maps SDK for Android" + "Maps SDK for iOS" + "Geocoding API"
//      in Google Cloud Console → APIs & Services → Library.
//   2. Create an API key, restrict it to your app's bundle ID / SHA-1.
//   3. Add to app.json:
//        "plugins": [
//          ["react-native-maps", { "googleMapsApiKey": "YOUR_KEY_HERE" }]
//        ]
//   4. iOS only — add to ios/<AppName>/AppDelegate.mm:
//        #import <GoogleMaps/GoogleMaps.h>
//        [GMSServices provideAPIKey:@"YOUR_KEY_HERE"];   // before [super application:...]
//   5. Run:  npx expo prebuild --clean
//
// SWITCHING from OSM version:
//   In any file that imports LocationPicker, change:
//     import { LocationPicker } from '@/components/listing/LocationPicker';
//   to:
//     import { LocationPicker } from '@/components/maps/LocationPickerGoogle';
//   No other changes needed — props are identical.
//
// NOTE: Google Geocoding API replaces Nominatim. Requires the same API key.
//       Billing is free up to $200/month (~40,000 geocode calls).

import { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput,
  Alert, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import MapView, {
  Marker, PROVIDER_GOOGLE, Region,
} from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── ⚠️  PUT YOUR GOOGLE API KEY HERE ────────────────────────────────────────
const GOOGLE_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
// ──────────────────────────────────────────────────────────────────────────────

const MAP_H      = 320;
const SAVED_KEY  = 'rentapp_saved_locations_v1';
const MAX_SAVED  = 5;

const DAVAO_REGION: Region = {
  latitude:       7.0731,
  longitude:      125.6126,
  latitudeDelta:  0.05,
  longitudeDelta: 0.05,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickedLocation {
  address: string;
  city:    string;
  lat:     number;
  lng:     number;
}

interface SavedPin extends PickedLocation {
  id:    string;
  label: string;
}

interface PlacePrediction {
  place_id:     string;
  description:  string;
  structured_formatting: {
    main_text:      string;
    secondary_text: string;
  };
}

// ─── Google API helpers ───────────────────────────────────────────────────────

async function googlePlacesSearch(
  query: string,
  sessionToken: string,
): Promise<PlacePrediction[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const params = new URLSearchParams({
      input:        query,
      key:          GOOGLE_API_KEY,
      sessiontoken: sessionToken,
      components:   'country:ph',
      location:     '7.0731,125.6126',
      radius:       '50000',
      language:     'en',
    });
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
    );
    const json = await res.json();
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      console.warn('[Places Autocomplete]', json.status, json.error_message);
    }
    return json.predictions ?? [];
  } catch (e) {
    console.warn('[Places Autocomplete error]', e);
    return [];
  }
}

async function googlePlaceDetails(
  placeId:      string,
  sessionToken: string,
): Promise<{ address: string; city: string; lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      place_id:     placeId,
      key:          GOOGLE_API_KEY,
      sessiontoken: sessionToken,
      fields:       'geometry,formatted_address,address_components',
      language:     'en',
    });
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    );
    const json = await res.json();
    if (json.status !== 'OK') {
      console.warn('[Place Details]', json.status);
      return null;
    }
    const result   = json.result;
    const location = result.geometry?.location;
    if (!location) return null;

    const components: any[] = result.address_components ?? [];
    const city = (
      components.find((c: any) => c.types.includes('locality'))?.long_name ??
      components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ??
      'Davao City'
    );

    return {
      address: result.formatted_address ?? '',
      city,
      lat: location.lat,
      lng: location.lng,
    };
  } catch (e) {
    console.warn('[Place Details error]', e);
    return null;
  }
}

async function googleReverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address: string; city: string }> {
  try {
    const params = new URLSearchParams({
      latlng:   `${lat},${lng}`,
      key:      GOOGLE_API_KEY,
      language: 'en',
    });
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    );
    const json = await res.json();
    if (json.status !== 'OK') {
      return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: 'Davao City' };
    }
    const result     = json.results?.[0];
    const components = result?.address_components ?? [];
    const city = (
      components.find((c: any) => c.types.includes('locality'))?.long_name ??
      components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ??
      'Davao City'
    );
    return {
      address: result?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city,
    };
  } catch {
    return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: 'Davao City' };
  }
}

// Shorten a long address for the search bar
function shortLabel(address: string): string {
  return address.split(',').slice(0, 2).join(',').trim();
}

// Random session token for Places API billing grouping
function newSessionToken() {
  return Math.random().toString(36).substring(2);
}

// ─── AsyncStorage helpers ─────────────────────────────────────────────────────

async function loadPins(): Promise<SavedPin[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function savePins(pins: SavedPin[]) {
  try { await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(pins)); } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value:    PickedLocation;
  onChange: (loc: PickedLocation) => void;
}

export function LocationPicker({ value, onChange }: Props) {
  const mapRef          = useRef<MapView>(null);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef(newSessionToken());

  const [searchText,      setSearchText]      = useState(shortLabel(value.address || ''));
  const [predictions,     setPredictions]     = useState<PlacePrediction[]>([]);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [loadingSearch,   setLoadingSearch]   = useState(false);
  const [loadingGeo,      setLoadingGeo]      = useState(false);

  const [pin, setPin] = useState({
    latitude:  value.lat  || DAVAO_REGION.latitude,
    longitude: value.lng  || DAVAO_REGION.longitude,
  });

  const [savedPins,  setSavedPins]  = useState<SavedPin[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);

  useEffect(() => {
    loadPins().then(p => { setSavedPins(p); setPinsLoaded(true); });
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  function onSearchChange(text: string) {
    setSearchText(text);
    setShowDropdown(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) { setPredictions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      const results = await googlePlacesSearch(text, sessionTokenRef.current);
      setPredictions(results);
      setShowDropdown(results.length > 0);
      setLoadingSearch(false);
    }, 400);
  }

  async function onSelectPrediction(prediction: PlacePrediction) {
    setShowDropdown(false);
    setLoadingGeo(true);

    const details = await googlePlaceDetails(prediction.place_id, sessionTokenRef.current);
    // New session token after each completed autocomplete→details flow
    sessionTokenRef.current = newSessionToken();

    if (!details) { setLoadingGeo(false); return; }

    const { address, city, lat, lng } = details;
    setSearchText(shortLabel(address));
    setPin({ latitude: lat, longitude: lng });
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      500,
    );
    onChange({ address, city, lat, lng });
    setLoadingGeo(false);
  }

  // ── Map interactions ────────────────────────────────────────────────────────
  async function onMapPress(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
    setLoadingGeo(true);
    const geo = await googleReverseGeocode(latitude, longitude);
    setSearchText(shortLabel(geo.address));
    onChange({ address: geo.address, city: geo.city, lat: latitude, lng: longitude });
    setLoadingGeo(false);
  }

  async function onMarkerDragEnd(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
    setLoadingGeo(true);
    const geo = await googleReverseGeocode(latitude, longitude);
    setSearchText(shortLabel(geo.address));
    onChange({ address: geo.address, city: geo.city, lat: latitude, lng: longitude });
    setLoadingGeo(false);
  }

  // ── Current location ────────────────────────────────────────────────────────
  async function useCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setPin({ latitude, longitude });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600,
      );
      setLoadingGeo(true);
      const geo = await googleReverseGeocode(latitude, longitude);
      setSearchText(shortLabel(geo.address));
      onChange({ address: geo.address, city: geo.city, lat: latitude, lng: longitude });
      setLoadingGeo(false);
    } catch (e) {
      console.warn('[Location]', e);
    }
  }

  // ── Saved pins ──────────────────────────────────────────────────────────────
  function onSavePin() {
    if (!value.address) {
      Alert.alert('No location set', 'Search for an address or tap the map first.');
      return;
    }
    if (savedPins.length >= MAX_SAVED) {
      Alert.alert('Max pins reached', `You can save up to ${MAX_SAVED} pins.`);
      return;
    }
    const autoLabel = value.address.split(',')[0]?.trim() ?? 'Saved location';
    if (Platform.OS === 'ios') {
      Alert.prompt('Save this pin', 'Give it a short label',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: async (input?: string) => doSavePin(input?.trim() || autoLabel) },
        ], 'plain-text', autoLabel);
    } else {
      Alert.alert('Save this pin?', `"${autoLabel}"`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => doSavePin(autoLabel) },
      ]);
    }
  }

  async function doSavePin(label: string) {
    const newPin: SavedPin = {
      id: Date.now().toString(), label,
      address: value.address, city: value.city, lat: value.lat, lng: value.lng,
    };
    const updated = [...savedPins, newPin];
    setSavedPins(updated);
    await savePins(updated);
  }

  function onApplySavedPin(p: SavedPin) {
    setPin({ latitude: p.lat, longitude: p.lng });
    setSearchText(shortLabel(p.address));
    setShowDropdown(false);
    mapRef.current?.animateToRegion(
      { latitude: p.lat, longitude: p.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 500,
    );
    onChange({ address: p.address, city: p.city, lat: p.lat, lng: p.lng });
  }

  async function onDeleteSavedPin(id: string) {
    const updated = savedPins.filter(p => p.id !== id);
    setSavedPins(updated);
    await savePins(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.wrap}>

      {/* ── Search bar + dropdown ── */}
      <View style={{ zIndex: 100 }}>
        <View style={[s.searchBar, (loadingSearch || loadingGeo) && s.searchBarActive]}>
          <Feather name="search" size={16} color={Colors.subtle} style={{ marginHorizontal: 12 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search address, barangay, or landmark…"
            placeholderTextColor={Colors.subtle}
            value={searchText}
            onChangeText={onSearchChange}
            onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {(loadingSearch || loadingGeo) && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginRight: 12 }}
            />
          )}
          {searchText.length > 0 && !loadingSearch && !loadingGeo && (
            <TouchableOpacity
              onPress={() => { setSearchText(''); setPredictions([]); setShowDropdown(false); }}
              style={{ marginRight: 12 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={14} color={Colors.subtle} />
            </TouchableOpacity>
          )}
        </View>

        {/* Google Places Autocomplete dropdown */}
        {showDropdown && predictions.length > 0 && (
          <View style={s.dropdown}>
            {predictions.map((item, i) => (
              <TouchableOpacity
                key={item.place_id}
                style={[s.suggestionRow, i > 0 && s.suggestionDivider]}
                onPress={() => onSelectPrediction(item)}
                activeOpacity={0.75}
              >
                <View style={s.suggestionPin}>
                  <Feather name="map-pin" size={12} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" weight="semibold" numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </AppText>
                  {item.structured_formatting.secondary_text ? (
                    <AppText variant="caption" color={Colors.muted} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </AppText>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
            {/* Google attribution — required by ToS */}
            <View style={s.googleAttribution}>
              <AppText style={{ fontSize: 9, color: Colors.subtle }}>
                Powered by Google
              </AppText>
            </View>
          </View>
        )}
      </View>

      {/* Use current location */}
      <TouchableOpacity style={s.locationBtn} onPress={useCurrentLocation} activeOpacity={0.85}>
        <Feather name="crosshair" size={15} color={Colors.primary} />
        <AppText style={s.locationBtnText}>Use my current location</AppText>
      </TouchableOpacity>

      {/* ── Google Map ── */}
      <View style={s.mapWrap}>
        <MapView
          ref={mapRef}
          style={s.map}
          provider={PROVIDER_GOOGLE}   // ← Real Google Maps
          initialRegion={{
            latitude:      pin.latitude,
            longitude:     pin.longitude,
            latitudeDelta:  0.04,
            longitudeDelta: 0.04,
          }}
          onPress={onMapPress}
          onTouchStart={() => { if (showDropdown) setShowDropdown(false); }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {/* Custom draggable pin */}
          <Marker
            coordinate={pin}
            draggable
            onDragEnd={onMarkerDragEnd}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges
          >
            <View style={s.pin}>
              <View style={s.pinCircle}>
                <Feather name="map-pin" size={16} color={Colors.white} />
              </View>
              <View style={s.pinTip} />
            </View>
          </Marker>
        </MapView>

        {/* Save pin overlay */}
        <TouchableOpacity style={s.savePinBtn} onPress={onSavePin} activeOpacity={0.85}>
          <Feather name="bookmark" size={12} color={Colors.primary} />
          <AppText style={s.savePinText}>Save pin</AppText>
        </TouchableOpacity>

        {/* Hint badge */}
        <View style={s.hint}>
          <Feather name="move" size={9} color={Colors.white} />
          <AppText style={s.hintText}>Tap map or drag pin</AppText>
        </View>
      </View>

      {/* Selected address */}
      {value.address ? (
        <View style={s.addressCard}>
          <View style={s.addressIcon}>
            <Feather name="map-pin" size={14} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginBottom: 2 }}>
              Selected location
            </AppText>
            <AppText variant="caption" color={Colors.ink} numberOfLines={2} style={{ lineHeight: 17 }}>
              {value.address}
            </AppText>
            {value.city ? (
              <View style={s.cityChip}>
                <Feather name="navigation" size={8} color={Colors.teal} />
                <AppText style={{ fontSize: 10, color: Colors.teal, marginLeft: 4, fontWeight: '700' }}>
                  {value.city}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={s.noAddress}>
          <Feather name="info" size={13} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 8, flex: 1 }}>
            Search for an address or tap the map to set the exact location
          </AppText>
        </View>
      )}

      {/* Saved pins */}
      <View style={s.savedSection}>
        <View style={s.savedHeader}>
          <Feather name="bookmark" size={13} color={Colors.muted} />
          <AppText variant="label" weight="bold" color={Colors.muted} style={{ marginLeft: 6 }}>
            Saved pins
          </AppText>
          <View style={s.savedBadge}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              {savedPins.length}/{MAX_SAVED}
            </AppText>
          </View>
        </View>

        {pinsLoaded && savedPins.length === 0 ? (
          <AppText variant="caption" color={Colors.subtle} style={{ marginTop: 4, lineHeight: 17 }}>
            Set a pin and tap "Save pin" to store it for quick reuse.
          </AppText>
        ) : null}

        {savedPins.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.sm }}
            >
              {savedPins.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={s.savedChip}
                  onPress={() => onApplySavedPin(p)}
                  onLongPress={() =>
                    Alert.alert('Remove saved pin?', `"${p.label}"`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => onDeleteSavedPin(p.id) },
                    ])
                  }
                  activeOpacity={0.8}
                >
                  <View style={s.savedChipIcon}>
                    <Feather name="map-pin" size={10} color={Colors.primary} />
                  </View>
                  <View style={{ maxWidth: 100 }}>
                    <AppText variant="caption" weight="bold" color={Colors.ink} numberOfLines={1}>
                      {p.label}
                    </AppText>
                    <AppText style={{ fontSize: 10, color: Colors.muted }} numberOfLines={1}>
                      {p.city}
                    </AppText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <AppText style={{ fontSize: 10, color: Colors.subtle }}>
              Tap to apply · Long-press to remove
            </AppText>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Styles (identical to OSM version) ───────────────────────────────────────

const s = StyleSheet.create({
  wrap: { gap: Spacing.md },

  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.white,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    minHeight:       50,
  },
  searchBarActive: { borderColor: Colors.primary + '60' },
  searchInput: {
    flex:            1,
    fontSize:        14,
    color:           Colors.ink,
    paddingVertical: 12,
    fontFamily:      'PlusJakartaSans_400Regular',
  },

  dropdown: {
    position:        'absolute',
    top:             54,
    left:            0,
    right:           0,
    backgroundColor: Colors.white,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    zIndex:          200,
    overflow:        'hidden',
    ...Shadow.md,
  },
  suggestionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   11,
  },
  suggestionDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  suggestionPin: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     Spacing.sm,
    flexShrink:      0,
  },
  googleAttribution: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   6,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    alignItems:        'flex-end',
  },

  locationBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.primaryLight,
    borderRadius:    Radius.md,
    paddingVertical: 10,
    borderWidth:     1,
    borderColor:     Colors.primary + '40',
  },
  locationBtnText: {
    marginLeft:  8,
    color:       Colors.primary,
    fontWeight:  '700',
    fontSize:    13,
    fontFamily:  'PlusJakartaSans_700Bold',
  },

  mapWrap: {
    borderRadius: Radius.lg,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  Colors.border,
    position:     'relative',
    height:       MAP_H,
  },
  map: { width: '100%', height: MAP_H },

  pin:       { alignItems: 'center' },
  pinCircle: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2.5,
    borderColor:     Colors.white,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.25,
    shadowRadius:    4,
    elevation:       5,
  },
  pinTip: {
    width:            0,
    height:           0,
    borderLeftWidth:  6,
    borderRightWidth: 6,
    borderTopWidth:   9,
    borderLeftColor:  'transparent',
    borderRightColor: 'transparent',
    borderTopColor:   Colors.primary,
    marginTop:        -2,
  },

  savePinBtn: {
    position:          'absolute',
    top:               Spacing.sm,
    right:             Spacing.sm,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.white,
    borderRadius:      Radius.full,
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderWidth:       1.5,
    borderColor:       Colors.primary + '55',
    ...Shadow.sm,
  },
  savePinText: {
    marginLeft:  5,
    color:       Colors.primary,
    fontWeight:  '700',
    fontSize:    11,
    fontFamily:  'PlusJakartaSans_700Bold',
  },
  hint: {
    position:          'absolute',
    bottom:            Spacing.sm,
    left:              Spacing.sm,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(0,0,0,0.45)',
    borderRadius:      Radius.full,
    paddingVertical:   4,
    paddingHorizontal: 9,
  },
  hintText: { fontSize: 9, color: Colors.white, marginLeft: 4 },

  addressCard: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.primary + '35',
  },
  addressIcon: {
    width:           30,
    height:          30,
    borderRadius:    8,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  cityChip: {
    flexDirection:     'row',
    alignItems:        'center',
    marginTop:         5,
    backgroundColor:   Colors.tealLight,
    borderRadius:      Radius.full,
    paddingVertical:   3,
    paddingHorizontal: 8,
    alignSelf:         'flex-start',
  },
  noAddress: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },

  savedSection: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.sm,
  },
  savedHeader:  { flexDirection: 'row', alignItems: 'center' },
  savedBadge: {
    backgroundColor:   Colors.primaryLight,
    borderRadius:      Radius.full,
    paddingVertical:   2,
    paddingHorizontal: 9,
    marginLeft:        Spacing.sm,
  },
  savedChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.white,
    borderRadius:      Radius.md,
    padding:           Spacing.sm,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    gap:               Spacing.sm,
    ...Shadow.sm,
  },
  savedChipIcon: {
    width:           24,
    height:          24,
    borderRadius:    6,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
});
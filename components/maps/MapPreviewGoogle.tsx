// components/maps/MapPreviewGoogle.tsx
//
// ─── Google Maps version of MapPreview ───────────────────────────────────────
// Drop-in replacement for components/explore/MapPreview.tsx
// Same props, same visual layout, same route display logic.
//
// Uses:
//   • Google Maps via react-native-maps PROVIDER_GOOGLE
//   • Google Directions API for route polyline (same as OSRM but more reliable)
//   • Google Geocoding API for reverse geocode (already configured for LocationPicker)
//
// SWITCHING from OSM version:
//   In ListingDetailSheet.tsx, change:
//     import { MapPreview } from './MapPreview';
//   to:
//     import { MapPreview } from '@/components/maps/MapPreviewGoogle';
//   No other changes needed — all props are identical.

import { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, {
  Marker, Polyline, PROVIDER_GOOGLE, Region,
} from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── ⚠️  PUT YOUR GOOGLE API KEY HERE ────────────────────────────────────────
const GOOGLE_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
// ──────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  listingLat:     number;
  listingLng:     number;
  listingEmoji:   string;   // kept for API compat, not shown on Google map
  listingTitle:   string;
  listingAddress?: string;
  userLat?:        number;
  userLng?:        number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function regionForPoints(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): Region {
  const minLat = Math.min(a.lat, b.lat);
  const maxLat = Math.max(a.lat, b.lat);
  const minLng = Math.min(a.lng, b.lng);
  const maxLng = Math.max(a.lng, b.lng);
  return {
    latitude:       (minLat + maxLat) / 2,
    longitude:      (minLng + maxLng) / 2,
    latitudeDelta:  Math.max(0.01, (maxLat - minLat) * 1.8),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.8),
  };
}

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Decode Google's encoded polyline format
function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const coords: Array<{ latitude: number; longitude: number }> = [];
  let idx   = 0;
  let lat   = 0;
  let lng   = 0;

  while (idx < encoded.length) {
    let b: number, shift = 0, result = 0;
    do {
      b       = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift  += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0; result = 0;
    do {
      b       = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift  += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

// Google Directions API
async function fetchDirections(
  originLat:  number, originLng:  number,
  destLat:    number, destLng:    number,
): Promise<{
  coords:   Array<{ latitude: number; longitude: number }>;
  routeKm:  number | null;
}> {
  try {
    const params = new URLSearchParams({
      origin:      `${originLat},${originLng}`,
      destination: `${destLat},${destLng}`,
      key:         GOOGLE_API_KEY,
      mode:        'driving',
      language:    'en',
    });
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params}`,
    );
    const json = await res.json();

    if (json.status !== 'OK' || !json.routes?.length) {
      return { coords: [], routeKm: null };
    }

    const route   = json.routes[0];
    const leg     = route.legs?.[0];
    const encoded = route.overview_polyline?.points ?? '';
    const coords  = encoded ? decodePolyline(encoded) : [];
    const routeKm = leg?.distance?.value != null ? leg.distance.value / 1000 : null;

    return { coords, routeKm };
  } catch {
    return { coords: [], routeKm: null };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MapPreview({
  listingLat,
  listingLng,
  listingTitle,
  listingAddress,
  userLat,
  userLng,
}: Props) {
  const mapRef         = useRef<MapView>(null);
  const watchSubRef    = useRef<Location.LocationSubscription | null>(null);
  const regionRef      = useRef<Region>(
    regionForPoints(
      { lat: userLat ?? 7.0831, lng: userLng ?? 125.6026 },
      { lat: listingLat, lng: listingLng },
    ),
  );

  const [deviceLoc,    setDeviceLoc]    = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords,  setRouteCoords]  = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeKm,      setRouteKm]      = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [followUser,   setFollowUser]   = useState(true);

  // ── GPS watch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;

        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;
        setDeviceLoc({ lat: initial.coords.latitude, lng: initial.coords.longitude });

        watchSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 8 },
          (loc) => { if (mounted) setDeviceLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude }); },
        );
      } catch {}
    })();
    return () => {
      mounted = false;
      watchSubRef.current?.remove();
      watchSubRef.current = null;
    };
  }, []);

  // ── Derived origin ─────────────────────────────────────────────────────────
  const origin = useMemo(() => {
    if (deviceLoc) return deviceLoc;
    if (userLat != null && userLng != null) return { lat: userLat, lng: userLng };
    return { lat: 7.0831, lng: 125.6026 };
  }, [deviceLoc, userLat, userLng]);

  const directKm = useMemo(
    () => haversineKm(origin.lat, origin.lng, listingLat, listingLng),
    [origin.lat, origin.lng, listingLat, listingLng],
  );

  // ── Auto-fit ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!followUser) return;
    const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
    regionRef.current = fitted;
    mapRef.current?.animateToRegion(fitted, 300);
  }, [origin.lat, origin.lng, listingLat, listingLng, followUser]);

  // ── Google Directions route ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoadingRoute(true);
        const { coords, routeKm: km } = await fetchDirections(
          origin.lat, origin.lng, listingLat, listingLng,
        );
        if (cancelled) return;

        if (coords.length > 1) {
          setRouteCoords(coords);
          setRouteKm(km);
        } else {
          // Fallback: straight line
          setRouteCoords([
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: listingLat, longitude: listingLng },
          ]);
          setRouteKm(null);
        }
      } catch {
        if (!cancelled) {
          setRouteCoords([
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: listingLat, longitude: listingLng },
          ]);
          setRouteKm(null);
        }
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [origin.lat, origin.lng, listingLat, listingLng]);

  // ── Controls ───────────────────────────────────────────────────────────────
  async function recenterOnUser() {
    setFollowUser(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setDeviceLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
      regionRef.current = fitted;
      mapRef.current?.animateToRegion(fitted, 280);
    }
  }

  function zoom(zoomIn: boolean) {
    mapRef.current?.getCamera().then((cam: any) => {
      if (!cam) return;
      mapRef.current?.animateCamera(
        { ...cam, zoom: Math.max(1, (cam.zoom ?? 14) + (zoomIn ? 1 : -1)) },
        { duration: 200 },
      );
    });
  }

  function recenter() {
    setFollowUser(true);
    const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
    regionRef.current = fitted;
    mapRef.current?.animateCamera(
      {
        center:  { latitude: fitted.latitude, longitude: fitted.longitude },
        heading: 0,
        pitch:   0,
        zoom:    Math.round(Math.log2(360 / fitted.longitudeDelta)),
      },
      { duration: 300 },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}    // ← Real Google Maps
          initialRegion={regionRef.current}
          onRegionChangeComplete={(r: any) => { regionRef.current = r; }}
          onTouchStart={() => setFollowUser(false)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass
          showsTraffic={false}
          toolbarEnabled={false}
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
        >
          {/* Route polyline */}
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={Colors.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* User / origin marker */}
          <Marker
            coordinate={{ latitude: origin.lat, longitude: origin.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={20}
            tracksViewChanges
          >
            <View style={styles.userMarker}>
              <Feather name="navigation" size={12} color={Colors.white} />
            </View>
          </Marker>

          {/* Listing marker */}
          <Marker
            coordinate={{ latitude: listingLat, longitude: listingLng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={18}
            tracksViewChanges
          >
            <View style={styles.listingMarker}>
              <Feather name="map-pin" size={14} color={Colors.white} />
            </View>
          </Marker>
        </MapView>

        {/* Zoom + recenter controls */}
        <View style={styles.zoomStack}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => zoom(true)} activeOpacity={0.8}>
            <Feather name="plus" size={16} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => zoom(false)} activeOpacity={0.8}>
            <Feather name="minus" size={16} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={recenter} activeOpacity={0.8}>
            <Feather name="crosshair" size={15} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Loading route indicator */}
        {loadingRoute && (
          <View style={styles.routeLoadingBadge}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <AppText style={styles.routeLoadingText}>Calculating route…</AppText>
          </View>
        )}
      </View>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <TouchableOpacity style={styles.infoItem} activeOpacity={0.75} onPress={recenterOnUser}>
          <Feather name="navigation" size={12} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            Get directions
          </AppText>
        </TouchableOpacity>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Feather name="map-pin" size={12} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
            {listingAddress || listingTitle}
          </AppText>
        </View>
      </View>

      {/* Distance chips */}
      <View style={styles.metricsRow}>
        <View style={styles.metricChip}>
          <Feather name="activity" size={11} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            {loadingRoute
              ? 'Routing…'
              : routeKm != null
                ? `${routeKm.toFixed(2)} km route`
                : `${directKm.toFixed(2)} km route`}
          </AppText>
        </View>
        <View style={styles.metricChip}>
          <Feather name="navigation-2" size={11} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
            {directKm.toFixed(2)} km as the crow flies
          </AppText>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius:    Radius.md,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     Colors.border,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  mapWrap: { height: 290, width: '100%', position: 'relative' },
  map:     { width: '100%', height: '100%' },

  zoomStack: {
    position: 'absolute',
    right:    Spacing.sm,
    bottom:   Spacing.sm,
    gap:      8,
  },
  ctrlBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.sm,
  },

  routeLoadingBadge: {
    position:          'absolute',
    top:               Spacing.sm,
    left:              Spacing.sm,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.92)',
    borderRadius:      Radius.full,
    paddingVertical:   5,
    paddingHorizontal: 10,
    gap:               6,
    ...Shadow.sm,
  },
  routeLoadingText: { fontSize: 10, color: Colors.muted },

  userMarker: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: Colors.ink,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     Colors.white,
    ...Shadow.sm,
  },
  listingMarker: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     Colors.white,
    ...Shadow.sm,
  },

  infoBar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  divider:  { width: 1, height: 16, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },

  metricsRow: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               8,
    paddingHorizontal: Spacing.md,
    paddingBottom:     Spacing.sm,
  },
  metricChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.bg,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingVertical:   5,
    paddingHorizontal: 8,
  },
});
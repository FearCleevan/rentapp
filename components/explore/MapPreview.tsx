import { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

let Maps: any = null;
try {
  Maps = require('react-native-maps');
} catch {
  Maps = null;
}

const MapView = Maps?.default ?? null;
const Marker = Maps?.Marker ?? null;
const Polyline = Maps?.Polyline ?? null;
const UrlTile = Maps?.UrlTile ?? null;
const PROVIDER_DEFAULT = Maps?.PROVIDER_DEFAULT;
const MAPS_AVAILABLE = !!MapView;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  listingLat: number;
  listingLng: number;
  listingEmoji: string;
  listingTitle: string;
  listingAddress?: string;
  userLat?: number;
  userLng?: number;
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
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.8),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.8),
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  const mapRef = useRef<any>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  // Store region in a ref, NOT state — never pass it as a controlled prop
  // to MapView. Doing so resets heading to 0 on every render = snap-back bug.
  const regionRef = useRef<Region>(
    regionForPoints(
      { lat: userLat ?? 7.0831, lng: userLng ?? 125.6026 },
      { lat: listingLat, lng: listingLng },
    ),
  );

  const [deviceLoc, setDeviceLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [snappedOrigin, setSnappedOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [snappedDest, setSnappedDest] = useState<{ lat: number; lng: number } | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [followUser, setFollowUser] = useState(true);

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
          (loc) => setDeviceLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
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

  // ── Auto-fit when origin updates (only while followUser=true) ──────────────
  useEffect(() => {
    if (!followUser) return;
    const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
    regionRef.current = fitted;
    mapRef.current?.animateToRegion(fitted, 300);
  }, [origin.lat, origin.lng, listingLat, listingLng, followUser]);

  // ── OSRM route fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoadingRoute(true);
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${origin.lng},${origin.lat};${listingLng},${listingLat}` +
          `?overview=full&geometries=geojson&steps=false&alternatives=false`;
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled) return;

        const route = json?.routes?.[0];
        const coords: Array<[number, number]> = route?.geometry?.coordinates ?? [];

        if (coords.length > 1) {
          const [sLng, sLat] = coords[0];
          const [eLng, eLat] = coords[coords.length - 1];
          setSnappedOrigin({ lat: sLat, lng: sLng });
          setSnappedDest({ lat: eLat, lng: eLng });
          setRouteCoords(coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng })));
          setRouteKm(typeof route?.distance === 'number' ? route.distance / 1000 : null);
        } else {
          setSnappedOrigin(null);
          setSnappedDest(null);
          setRouteCoords([
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: listingLat, longitude: listingLng },
          ]);
          setRouteKm(null);
        }
      } catch {
        if (!cancelled) {
          setSnappedOrigin(null);
          setSnappedDest(null);
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

  const displayOrigin = snappedOrigin ?? origin;
  const displayDest   = snappedDest   ?? { lat: listingLat, lng: listingLng };

  // ── Controls ───────────────────────────────────────────────────────────────

  async function getCurrentDirection() {
    setFollowUser(true);
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setDeviceLoc({ lat: current.coords.latitude, lng: current.coords.longitude });
    } catch {
      const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
      regionRef.current = fitted;
      mapRef.current?.animateToRegion(fitted, 280);
    }
  }

  // ROTATION FIX: Use animateCamera (which carries heading) instead of
  // animateToRegion (which always resets heading to 0). We read the current
  // camera first, change only the zoom level, and leave heading/pitch intact.
  function zoom(zoomIn: boolean) {
    mapRef.current?.getCamera().then((cam: any) => {
      if (!cam) return;
      mapRef.current?.animateCamera(
        { ...cam, zoom: Math.max(1, (cam.zoom ?? 14) + (zoomIn ? 1 : -1)) },
        { duration: 200 },
      );
    });
  }

  // Recenter: intentionally resets heading/pitch back to north-up
  function recenter() {
    setFollowUser(true);
    const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
    regionRef.current = fitted;
    mapRef.current?.animateCamera(
      {
        center: { latitude: fitted.latitude, longitude: fitted.longitude },
        heading: 0,
        pitch: 0,
        zoom: Math.round(Math.log2(360 / fitted.longitudeDelta)),
      },
      { duration: 300 },
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!MAPS_AVAILABLE) {
    return (
      <View style={[styles.container, styles.fallbackWrap]}>
        <Feather name="map" size={16} color={Colors.subtle} />
        <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 8, flex: 1 }}>
          Map preview unavailable in this build.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          // Use initialRegion ONLY — never bind `region` as a controlled prop.
          // The controlled region prop resets heading to 0 on every re-render,
          // which caused the rotation snap-back.
          initialRegion={regionRef.current}
          onRegionChangeComplete={(r: any) => { regionRef.current = r; }}
          onTouchStart={() => setFollowUser(false)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass
          toolbarEnabled={false}
          mapType="standard"
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
        >
          <UrlTile
            urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            tileSize={256}
            shouldReplaceMapContent
          />

          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={Colors.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/*
            ICON FIX: tracksViewChanges must stay TRUE permanently.
            Setting it to false freezes the native snapshot of the marker view,
            and on Android that snapshot is often taken before the JS font/icon
            has loaded — resulting in a blank circle. Keeping it true means
            the native layer always mirrors the live JS view, so the Feather
            icon is always visible. Two markers = negligible perf cost.
          */}
          <Marker
            coordinate={{ latitude: displayOrigin.lat, longitude: displayOrigin.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={20}
            tracksViewChanges
          >
            <View style={styles.userMarker}>
              <Feather name="navigation" size={12} color={Colors.white} />
            </View>
          </Marker>

          <Marker
            coordinate={{ latitude: displayDest.lat, longitude: displayDest.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={18}
            tracksViewChanges
          >
            <View style={styles.listingPin}>
              <Feather name="map-pin" size={14} color={Colors.white} />
            </View>
          </Marker>
        </MapView>

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
      </View>

      <View style={styles.infoBar}>
        <TouchableOpacity style={styles.infoItem} activeOpacity={0.75} onPress={getCurrentDirection}>
          <Feather name="navigation" size={12} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            Get Current Direction
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

      <View style={styles.metricsRow}>
        <View style={styles.metricChip}>
          <Feather name="activity" size={11} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            {loadingRoute ? 'Routing...' : `${(routeKm ?? directKm).toFixed(2)} km route`}
          </AppText>
        </View>
        <View style={styles.metricChip}>
          <Feather name="navigation-2" size={11} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
            {directKm.toFixed(2)} km away
          </AppText>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  fallbackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mapWrap: {
    height: 290,
    width: '100%',
  },
  map: { width: '100%', height: '100%' },
  zoomStack: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    gap: 8,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.sm,
  },
  listingPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.sm,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
});

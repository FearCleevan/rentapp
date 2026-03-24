import { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import MapView, { Marker, Polyline, Region, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

interface Props {
  listingLat: number;
  listingLng: number;
  listingEmoji: string;
  listingTitle: string;
  listingAddress?: string;
  userLat?: number;
  userLng?: number;
}

function regionForPoints(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): Region {
  const minLat = Math.min(a.lat, b.lat);
  const maxLat = Math.max(a.lat, b.lat);
  const minLng = Math.min(a.lng, b.lng);
  const maxLng = Math.max(a.lng, b.lng);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max(0.01, (maxLat - minLat) * 1.8);
  const longitudeDelta = Math.max(0.01, (maxLng - minLng) * 1.8);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180)
    * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function MapPreview({
  listingLat,
  listingLng,
  listingEmoji,
  listingTitle,
  listingAddress,
  userLat,
  userLng,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  const [deviceLoc, setDeviceLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<Region>(() => (
    regionForPoints(
      { lat: userLat ?? 7.0831, lng: userLng ?? 125.6026 },
      { lat: listingLat, lng: listingLng },
    )
  ));
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [followUser, setFollowUser] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;

        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        setDeviceLoc({ lat: initial.coords.latitude, lng: initial.coords.longitude });

        watchSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 8,
          },
          (loc) => {
            setDeviceLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          },
        );
      } catch {
      }
    })();

    return () => {
      mounted = false;
      watchSubRef.current?.remove();
      watchSubRef.current = null;
    };
  }, []);

  const origin = useMemo(() => {
    if (deviceLoc) return deviceLoc;
    if (userLat != null && userLng != null) return { lat: userLat, lng: userLng };
    return { lat: 7.0831, lng: 125.6026 };
  }, [deviceLoc, userLat, userLng]);

  const directKm = useMemo(
    () => haversineKm(origin.lat, origin.lng, listingLat, listingLng),
    [origin.lat, origin.lng, listingLat, listingLng],
  );

  useEffect(() => {
    const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
    if (!followUser) return;
    setRegion(fitted);
    mapRef.current?.animateToRegion(fitted, 300);
  }, [origin.lat, origin.lng, listingLat, listingLng, followUser]);

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
        const coordinates: Array<[number, number]> = route?.geometry?.coordinates ?? [];
        if (coordinates.length > 1) {
          setRouteCoords(
            coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
          );
          setRouteKm(typeof route?.distance === 'number' ? route.distance / 1000 : null);
        } else {
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

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [origin.lat, origin.lng, listingLat, listingLng]);

  async function openDirections() {
    const url =
      `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=` +
      `${origin.lat}%2C${origin.lng}%3B${listingLat}%2C${listingLng}`;
    await Linking.openURL(url);
  }

  function zoom(multiplier: number) {
    const next = {
      ...region,
      latitudeDelta: Math.max(0.002, Math.min(0.6, region.latitudeDelta * multiplier)),
      longitudeDelta: Math.max(0.002, Math.min(0.6, region.longitudeDelta * multiplier)),
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 200);
  }

  function recenter() {
    setFollowUser(true);
    const fitted = regionForPoints(origin, { lat: listingLat, lng: listingLng });
    setRegion(fitted);
    mapRef.current?.animateToRegion(fitted, 280);
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          region={region}
          onRegionChangeComplete={(r) => setRegion(r)}
          onTouchStart={() => setFollowUser(false)}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          mapType="standard"
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
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
              lineDashPattern={[8, 5]}
            />
          )}

          <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }}>
            <View style={styles.userDotOuter}>
              <View style={styles.userDotInner} />
            </View>
          </Marker>

          <Marker coordinate={{ latitude: listingLat, longitude: listingLng }}>
            <View style={styles.listingPin}>
              <AppText style={styles.listingEmoji}>{listingEmoji}</AppText>
            </View>
          </Marker>
        </MapView>

        <View style={styles.zoomStack}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => zoom(0.7)} activeOpacity={0.8}>
            <Feather name="plus" size={16} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => zoom(1.45)} activeOpacity={0.8}>
            <Feather name="minus" size={16} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={recenter} activeOpacity={0.8}>
            <Feather name="crosshair" size={15} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBar}>
        <TouchableOpacity style={styles.infoItem} activeOpacity={0.75} onPress={openDirections}>
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

      <View style={styles.metricsRow}>
        <View style={styles.metricChip}>
          <Feather name="activity" size={11} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            {loadingRoute
              ? 'Routing...'
              : `${(routeKm ?? directKm).toFixed(2)} km route`}
          </AppText>
        </View>
        <View style={styles.metricChip}>
          <Feather name="navigation-2" size={11} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
            {directKm.toFixed(2)} km away
          </AppText>
        </View>
      </View>

      <AppText style={styles.osmAttribution}>
        Map data (c) OpenStreetMap contributors
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadow.sm,
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
  userDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${Colors.primary}55`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  listingPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  listingEmoji: { fontSize: 12, lineHeight: 14 },
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
  osmAttribution: {
    fontSize: 10,
    color: Colors.subtle,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});

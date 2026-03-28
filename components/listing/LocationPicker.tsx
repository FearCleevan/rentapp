// components/listing/LocationPicker.tsx
// 100% free map location picker — zero API keys required.
//
// Services used:
//   Map tiles    → OpenStreetMap  (tile.openstreetmap.org)
//   Search       → Nominatim      (nominatim.openstreetmap.org/search)
//   Reverse geo  → Nominatim      (nominatim.openstreetmap.org/reverse)
//   Saved pins   → AsyncStorage   (device-local, up to 5)
//
// Required packages (already in Expo):
//   npx expo install react-native-maps
//   npx expo install @react-native-async-storage/async-storage
//
// app.json plugin (no API key needed):
//   "plugins": ["react-native-maps"]

import { useState, useRef, useEffect } from 'react';
import {
    View, StyleSheet, TouchableOpacity, TextInput,
    Alert, Dimensions, Platform, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

import * as Location from 'expo-location';

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
const UrlTile = Maps?.UrlTile ?? null;
const PROVIDER_DEFAULT = Maps?.PROVIDER_DEFAULT;
const MAPS_AVAILABLE = !!MapView;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_H = 420;
const SAVED_KEY = 'rentapp_saved_locations_v1';
const MAX_SAVED = 5;
// Nominatim requires a real User-Agent — replace with your app contact
const USER_AGENT = 'RentApp/1.0 (rentapp.davao@gmail.com)';

// Davao City default region
const DAVAO_REGION: Region = {
    latitude: 7.0731,
    longitude: 125.6126,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickedLocation {
    address: string;
    city: string;
    lat: number;
    lng: number;
}

interface SavedPin extends PickedLocation {
    id: string;
    label: string;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        city?: string;
        town?: string;
        municipality?: string;
        county?: string;
        suburb?: string;
        village?: string;
    };
}

// ─── Nominatim helpers ────────────────────────────────────────────────────────

async function nominatimSearch(query: string): Promise<NominatimResult[]> {
    if (!query || query.trim().length < 3) return [];
    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '6',
            countrycodes: 'ph',
            // Bias results toward Davao City area
            viewbox: '125.4,6.7,126.0,7.5',
            bounded: '0',
        });
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`,
            { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' } },
        );
        const json = await res.json();
        return Array.isArray(json) ? json : [];
    } catch (e) {
        console.warn('[Nominatim search]', e);
        return [];
    }
}

async function nominatimReverse(
    lat: number,
    lng: number,
): Promise<{ address: string; city: string }> {
    try {
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lng),
            format: 'json',
            addressdetails: '1',
        });
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`,
            { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' } },
        );
        const json = await res.json();
        const a = json.address ?? {};
        const city = a.city ?? a.town ?? a.municipality ?? a.county ?? 'Davao City';
        return {
            address: json.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            city,
        };
    } catch {
        return {
            address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            city: 'Davao City',
        };
    }
}

function cityFromResult(r: NominatimResult): string {
    const a = r.address ?? {};
    return a.city ?? a.town ?? a.municipality ?? a.county ?? 'Davao City';
}

// Shorten a long display_name for the search bar label
function shortLabel(displayName: string): string {
    return displayName.split(',').slice(0, 2).join(',').trim();
}

// ─── AsyncStorage helpers ─────────────────────────────────────────────────────

async function loadPins(): Promise<SavedPin[]> {
    try {
        const raw = await AsyncStorage.getItem(SAVED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

async function savePins(pins: SavedPin[]): Promise<void> {
    try { await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(pins)); } catch { }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    value: PickedLocation;
    onChange: (loc: PickedLocation) => void;
}

export function LocationPicker({ value, onChange }: Props) {
    const mapRef = useRef<any>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQuery = useRef('');

    // Search state
    const [searchText, setSearchText] = useState(shortLabel(value.address || ''));
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingGeo, setLoadingGeo] = useState(false);

    // Map pin position
    const [pin, setPin] = useState({
        latitude: value.lat || DAVAO_REGION.latitude,
        longitude: value.lng || DAVAO_REGION.longitude,
    });

    async function getCurrentLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required.');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;

            setPin({ latitude: lat, longitude: lng });

            mapRef.current?.animateToRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

            const geo = await nominatimReverse(lat, lng);

            setSearchText(shortLabel(geo.address));

            onChange({
                address: geo.address,
                city: geo.city,
                lat,
                lng,
            });

        } catch (e) {
            console.warn('[Location error]', e);
        }
    }

    // Saved pins
    const [savedPins, setSavedPins] = useState<SavedPin[]>([]);
    const [pinsLoaded, setPinsLoaded] = useState(false);

    useEffect(() => {
        loadPins().then(p => { setSavedPins(p); setPinsLoaded(true); });
    }, []);

    // useEffect(() => {
    //     getCurrentLocation(true);
    // }, []);

    // ── Search input handler ──────────────────────────────────────────────────
    function onSearchChange(text: string) {
        setSearchText(text);
        setShowSuggestions(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (text.trim().length < 3) { setSuggestions([]); return; }

        debounceRef.current = setTimeout(async () => {
            if (text === lastQuery.current) return;
            lastQuery.current = text;
            setLoadingSearch(true);
            const results = await nominatimSearch(text);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setLoadingSearch(false);
        }, 650); // 650ms debounce — respects Nominatim 1 req/sec limit
    }

    // ── Select a search suggestion ────────────────────────────────────────────
    function onSelectSuggestion(item: NominatimResult) {
        setShowSuggestions(false);
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const city = cityFromResult(item);
        const label = shortLabel(item.display_name);

        setSearchText(label);
        setPin({ latitude: lat, longitude: lng });
        mapRef.current?.animateToRegion(
            { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
            500,
        );
        onChange({ address: item.display_name, city, lat, lng });
    }

    // ── Tap anywhere on the map ───────────────────────────────────────────────
    async function onMapPress(e: any) {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setPin({ latitude, longitude });
        setLoadingGeo(true);
        const geo = await nominatimReverse(latitude, longitude);
        setSearchText(shortLabel(geo.address));
        onChange({ address: geo.address, city: geo.city, lat: latitude, lng: longitude });
        setLoadingGeo(false);
    }

    // ── Drag the pin ──────────────────────────────────────────────────────────
    async function onMarkerDragEnd(e: any) {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setPin({ latitude, longitude });
        setLoadingGeo(true);
        const geo = await nominatimReverse(latitude, longitude);
        setSearchText(shortLabel(geo.address));
        onChange({ address: geo.address, city: geo.city, lat: latitude, lng: longitude });
        setLoadingGeo(false);
    }

    // ── Save current pin ──────────────────────────────────────────────────────
    function onSavePin() {
        if (!value.address) {
            Alert.alert('No location set', 'Search for an address or tap the map first.');
            return;
        }
        if (savedPins.length >= MAX_SAVED) {
            Alert.alert(
                'Max saved pins reached',
                `You can save up to ${MAX_SAVED} pins. Long-press an existing pin to remove it.`,
            );
            return;
        }

        const autoLabel = value.address.split(',')[0]?.trim() ?? 'Saved location';

        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Save this pin',
                'Give it a short label (e.g. "My Parking Slot")',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Save',
                        onPress: async (input: string | undefined) => {
                            const label = input?.trim() || autoLabel;
                            await doSavePin(label);
                        },
                    },
                ],
                'plain-text',
                autoLabel,
            );
        } else {
            // Android doesn't have Alert.prompt — save with auto label
            Alert.alert(
                'Save this pin?',
                `Will be saved as:\n"${autoLabel}"`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: () => doSavePin(autoLabel) },
                ],
            );
        }
    }

    async function doSavePin(label: string) {
        const newPin: SavedPin = {
            id: Date.now().toString(),
            label,
            address: value.address,
            city: value.city,
            lat: value.lat,
            lng: value.lng,
        };
        const updated = [...savedPins, newPin];
        setSavedPins(updated);
        await savePins(updated);
    }

    // ── Apply a saved pin ─────────────────────────────────────────────────────
    function onApplySavedPin(p: SavedPin) {
        setPin({ latitude: p.lat, longitude: p.lng });
        setSearchText(shortLabel(p.address));
        setShowSuggestions(false);
        mapRef.current?.animateToRegion(
            { latitude: p.lat, longitude: p.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
            500,
        );
        onChange({ address: p.address, city: p.city, lat: p.lat, lng: p.lng });
    }

    // ── Delete a saved pin ────────────────────────────────────────────────────
    async function onDeleteSavedPin(id: string) {
        const updated = savedPins.filter(p => p.id !== id);
        setSavedPins(updated);
        await savePins(updated);
    }

    // ── Dismiss dropdown on map touch ─────────────────────────────────────────
    function dismissSuggestions() {
        if (showSuggestions) setShowSuggestions(false);
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={s.wrap}>

            {/* ── Search bar + dropdown ── */}
            <View style={s.searchContainer}>
                <View style={[s.searchBar, (loadingSearch || loadingGeo) && s.searchBarLoading]}>
                    <Feather
                        name="search"
                        size={16}
                        color={Colors.subtle}
                        style={{ marginLeft: 14, marginRight: 10 }}
                    />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search address, barangay, or landmark…"
                        placeholderTextColor={Colors.subtle}
                        value={searchText}
                        onChangeText={onSearchChange}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {/* Loading indicator */}
                    {(loadingSearch || loadingGeo) && (
                        <View style={s.loadingPill}>
                            <AppText style={{ fontSize: 10, color: Colors.primary }}>
                                {loadingGeo ? 'Getting address…' : 'Searching…'}
                            </AppText>
                        </View>
                    )}
                    {/* Clear button */}
                    {searchText.length > 0 && !loadingSearch && !loadingGeo && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchText('');
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                            style={{ marginRight: 12 }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Feather name="x" size={14} color={Colors.subtle} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <View style={s.dropdown}>
                        {suggestions.map((item, i) => {
                            const parts = item.display_name.split(',');
                            const main = parts[0]?.trim() ?? '';
                            const sub = parts.slice(1, 3).join(',').trim();
                            return (
                                <TouchableOpacity
                                    key={item.place_id}
                                    style={[s.suggestionRow, i > 0 && s.suggestionDivider]}
                                    onPress={() => onSelectSuggestion(item)}
                                    activeOpacity={0.75}
                                >
                                    <View style={s.suggestionPinWrap}>
                                        <Feather name="map-pin" size={12} color={Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppText
                                            variant="label"
                                            weight="semibold"
                                            numberOfLines={1}
                                        >
                                            {main}
                                        </AppText>
                                        {sub ? (
                                            <AppText
                                                variant="caption"
                                                color={Colors.muted}
                                                numberOfLines={1}
                                            >
                                                {sub}
                                            </AppText>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Use current location button */}
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.primaryLight,
                    padding: 10,
                    borderRadius: Radius.md,
                    marginBottom: 10,
                    justifyContent: 'center',
                }}
                onPress={() => getCurrentLocation()}
            >
                <Feather name="crosshair" size={16} color={Colors.primary} />
                <AppText style={{ marginLeft: 6, color: Colors.primary, fontWeight: 'bold' }}>
                    Use my current location
                </AppText>
            </TouchableOpacity>

            {/* ── Map ── */}
            {MAPS_AVAILABLE ? (
                <View style={s.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={s.map}
                        provider={PROVIDER_DEFAULT}
                        initialRegion={{
                            latitude: pin.latitude,
                            longitude: pin.longitude,
                            latitudeDelta: 0.04,
                            longitudeDelta: 0.04,
                        }}
                        onPress={onMapPress}
                        onTouchStart={dismissSuggestions}
                        showsUserLocation
                        showsMyLocationButton={false}
                        showsCompass={false}
                        showsTraffic={false}
                        toolbarEnabled={false}
                        mapType="standard"
                    >
                        {/* OpenStreetMap tile overlay */}
                        <UrlTile
                            urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                            maximumZ={19}
                        />

                        {/* Draggable pin */}
                        <Marker
                            coordinate={pin}
                            draggable
                            onDragEnd={onMarkerDragEnd}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <View style={s.pinWrap}>
                                <View style={s.pinCircle}>
                                    <Feather name="map-pin" size={18} color={Colors.white} />
                                </View>
                                <View style={s.pinTip} />
                            </View>
                        </Marker>
                    </MapView>

                    {/* Save pin overlay button */}
                    <TouchableOpacity
                        style={s.savePinOverlay}
                        onPress={onSavePin}
                        activeOpacity={0.85}
                    >
                        <Feather name="bookmark" size={13} color={Colors.primary} />
                        <AppText
                            variant="caption"
                            weight="bold"
                            color={Colors.primary}
                            style={{ marginLeft: 5 }}
                        >
                            Save pin
                        </AppText>
                    </TouchableOpacity>

                    {/* Bottom hint */}
                    <View style={s.mapHintBadge}>
                        <Feather name="move" size={10} color={Colors.white} />
                        <AppText style={s.mapHintText}>Tap map or drag pin</AppText>
                    </View>
                </View>
            ) : (
                <View style={s.mapUnavailable}>
                    <Feather name="alert-circle" size={15} color={Colors.subtle} />
                    <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 8, flex: 1 }}>
                        Map unavailable in this build. Use search or current location.
                    </AppText>
                </View>
            )}
            {/* ── Selected address display ── */}
            {value.address ? (
                <View style={s.addressCard}>
                    <View style={s.addressIconBox}>
                        <Feather name="map-pin" size={15} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <AppText
                            variant="caption"
                            weight="bold"
                            color={Colors.primary}
                            style={{ marginBottom: 2 }}
                        >
                            Selected location
                        </AppText>
                        <AppText
                            variant="caption"
                            color={Colors.ink}
                            numberOfLines={2}
                            style={{ lineHeight: 17 }}
                        >
                            {value.address}
                        </AppText>
                        {value.city ? (
                            <View style={s.cityChip}>
                                <Feather name="navigation" size={9} color={Colors.teal} />
                                <AppText
                                    style={{ fontSize: 10, color: Colors.teal, marginLeft: 4, fontWeight: '700' }}
                                >
                                    {value.city}
                                </AppText>
                            </View>
                        ) : null}
                    </View>
                </View>
            ) : (
                <View style={s.noSelectionBanner}>
                    <Feather name="info" size={13} color={Colors.muted} />
                    <AppText
                        variant="caption"
                        color={Colors.muted}
                        style={{ marginLeft: 8, flex: 1 }}
                    >
                        Search for an address or tap the map to set the exact location
                    </AppText>
                </View>
            )}

            {/* ── Saved pins ── */}
            <View style={s.savedSection}>
                <View style={s.savedHeader}>
                    <Feather name="bookmark" size={13} color={Colors.muted} />
                    <AppText
                        variant="label"
                        weight="bold"
                        color={Colors.muted}
                        style={{ marginLeft: 6 }}
                    >
                        Saved pins
                    </AppText>
                    <View style={s.savedCountBadge}>
                        <AppText
                            variant="caption"
                            weight="bold"
                            color={Colors.primary}
                        >
                            {savedPins.length}/{MAX_SAVED}
                        </AppText>
                    </View>
                </View>

                {pinsLoaded && savedPins.length === 0 && (
                    <AppText
                        variant="caption"
                        color={Colors.subtle}
                        style={{ marginTop: 4, lineHeight: 17 }}
                    >
                        Set a pin and tap "Save pin" above to store it here for quick reuse next time you create a listing.
                    </AppText>
                )}

                {savedPins.length > 0 && (
                    <>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={s.savedScroll}
                        >
                            {savedPins.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={s.savedChip}
                                    onPress={() => onApplySavedPin(p)}
                                    onLongPress={() =>
                                        Alert.alert(
                                            'Remove saved pin?',
                                            `"${p.label}"`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                {
                                                    text: 'Remove',
                                                    style: 'destructive',
                                                    onPress: () => onDeleteSavedPin(p.id),
                                                },
                                            ],
                                        )
                                    }
                                    activeOpacity={0.8}
                                >
                                    <View style={s.savedChipIcon}>
                                        <Feather name="map-pin" size={11} color={Colors.primary} />
                                    </View>
                                    <View style={{ maxWidth: 110 }}>
                                        <AppText
                                            variant="caption"
                                            weight="bold"
                                            color={Colors.ink}
                                            numberOfLines={1}
                                        >
                                            {p.label}
                                        </AppText>
                                        <AppText
                                            style={{ fontSize: 10, color: Colors.muted }}
                                            numberOfLines={1}
                                        >
                                            {p.city}
                                        </AppText>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <AppText style={s.savedHint}>
                            Tap to apply · Long-press to remove
                        </AppText>
                    </>
                )}
            </View>

            {/* OSM attribution — required by OSM usage policy */}
            {/* <AppText style={s.osmAttribution}>
                Map data © OpenStreetMap contributors
            </AppText> */}

        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    wrap: { gap: Spacing.md },

    // Search bar
    searchContainer: { position: 'relative', zIndex: 100 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        minHeight: 50,
    },
    searchBarLoading: { borderColor: Colors.primary + '60' },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.ink,
        paddingVertical: 12,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    loadingPill: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radius.full,
        paddingVertical: 3,
        paddingHorizontal: 10,
        marginRight: 10,
    },

    // Dropdown
    dropdown: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        zIndex: 200,
        overflow: 'hidden',
        ...Shadow.md,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 11,
    },
    suggestionDivider: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    suggestionPinWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
        flexShrink: 0,
    },

    // Map
    mapContainer: {
        width: '100%',
        height: MAP_H,
        marginHorizontal: 0,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    mapUnavailable: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    map: { width: '100%', height: MAP_H },

    // Custom orange pin
    pinWrap: { alignItems: 'center' },
    pinCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    pinTip: {
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.primary,
        marginTop: -2,
    },

    // Overlays on map
    savePinOverlay: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.full,
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderWidth: 1.5,
        borderColor: Colors.primary + '55',
        ...Shadow.sm,
    },
    mapHintBadge: {
        position: 'absolute',
        bottom: Spacing.sm,
        left: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.48)',
        borderRadius: Radius.full,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    mapHintText: {
        fontSize: 10,
        color: Colors.white,
        marginLeft: 4,
    },

    // Address display
    addressCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.primaryLight,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primary + '35',
    },
    addressIconBox: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        backgroundColor: Colors.tealLight,
        borderRadius: Radius.full,
        paddingVertical: 3,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
    },
    noSelectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Saved pins
    savedSection: {
        backgroundColor: Colors.bg,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    savedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    savedCountBadge: {
        backgroundColor: Colors.primaryLight,
        borderRadius: Radius.full,
        paddingVertical: 2,
        paddingHorizontal: 9,
        marginLeft: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    savedScroll: {
        gap: Spacing.sm,
        paddingBottom: 2,
    },
    savedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        padding: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: Spacing.sm,
        ...Shadow.sm,
    },
    savedChipIcon: {
        width: 26,
        height: 26,
        borderRadius: 7,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    savedHint: {
        fontSize: 10,
        color: Colors.subtle,
    },

    osmAttribution: {
        fontSize: 9,
        color: Colors.subtle,
        textAlign: 'right',
        marginTop: -6,
    },
});



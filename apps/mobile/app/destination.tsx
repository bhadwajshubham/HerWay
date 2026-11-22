import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowRight, Clock3, LocateFixed, MapPin, Search, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { OpenStreetMapPlaceSchema, type OpenStreetMapPlace } from '@herway/shared';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { OpenStreetMap } from '../src/components/OpenStreetMap';

type GeolocationLike = {
  getCurrentPosition: (
    success: (pos: { coords: { latitude: number; longitude: number } }) => void,
    error?: () => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number }
  ) => void;
};

const recentPlaces = [
  { name: 'Koramangala 5th Block', area: 'Bengaluru', lat: 12.9345, lon: 77.6148, Icon: Clock3 },
  { name: 'Indiranagar Metro', area: 'Metro station', lat: 12.9784, lon: 77.6408, Icon: MapPin },
  { name: 'Kempegowda Airport', area: 'Terminal 1', lat: 13.1986, lon: 77.7066, Icon: Star }
] as const;

export default function DestinationScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lon: number } | null>(null);
  const [searchResults, setSearchResults] = useState<OpenStreetMapPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [lastSearch, setLastSearch] = useState('');

  useEffect(() => {
    const query = destination.trim();
    if (query.length < 3) {
      setSearchResults([]);
      setSearching(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError('');
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(query)}`,
          { headers: { accept: 'application/json' }, signal: controller.signal }
        );
        if (!response.ok) throw new Error('address_search_failed');
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error('invalid_address_results');
        const valid = payload.flatMap((item) => {
          if (typeof item !== 'object' || item === null) return [];
          const mapped = item as Record<string, unknown>;
          const parsed = OpenStreetMapPlaceSchema.safeParse({
            placeId: mapped.place_id,
            displayName: mapped.display_name,
            lat: mapped.lat,
            lon: mapped.lon,
            type: typeof mapped.type === 'string' ? mapped.type : undefined
          });
          return parsed.success ? [parsed.data] : [];
        });
        setSearchResults(valid);
        setLastSearch(query);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setSearchResults([]);
          setSearchError('Address search is unavailable. Try again or choose a suggested place.');
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [destination]);

  const handleUseCurrentLocation = () => {
    setLocationError('');
    if (useCurrentLocation) {
      setUseCurrentLocation(false);
      return;
    }
    setUseCurrentLocation(true);
    const geo = (globalThis as { navigator?: { geolocation?: GeolocationLike } }).navigator
      ?.geolocation;
    if (geo) {
      geo.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        () => {
          setLocationError('Could not read GPS automatically. Using default pickup area.');
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    }
  };

  const canContinue = Boolean(destination.trim());
  const mapLat = selectedPlace?.lat ?? currentLocation?.lat ?? 17.4435;
  const mapLon = selectedPlace?.lon ?? currentLocation?.lon ?? 78.3772;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="LOCATION PREVIEW" tone="teal" />

        <Text accessibilityRole="header" style={styles.title}>
          Choose destination
        </Text>
        <Text style={styles.subtitle}>
          Search an address or pick a suggested place to view ride options.
        </Text>

        <View style={styles.mapWrap}>
          <OpenStreetMap
            height={184}
            latitude={mapLat}
            longitude={mapLon}
            label={destination.trim() ? `Map for ${destination}` : 'HITEC City pickup map'}
          />
        </View>

        <SpringPressable
          onPress={handleUseCurrentLocation}
          accessibilityRole="button"
          accessibilityLabel="Use current location as pickup"
          style={[styles.locationBtn, useCurrentLocation && styles.locationBtnActive]}
        >
          <LocateFixed
            size={18}
            color={useCurrentLocation ? theme.color.teal : theme.color.muted}
          />
          <Text style={[styles.locationBtnText, useCurrentLocation && styles.locationBtnTextActive]}>
            {useCurrentLocation
              ? 'Using current location as pickup'
              : 'Use current location as pickup'}
          </Text>
        </SpringPressable>

        {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

        <View style={styles.inputWrap}>
          <Search size={19} color={theme.color.teal} />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Search an address or place"
            placeholderTextColor={theme.color.muted}
            accessibilityLabel="Destination"
            style={styles.input}
          />
        </View>

        {destination.trim().length >= 3 ? (
          <View style={styles.resultsBlock}>
            {searching ? <Text style={styles.helperText}>Searching OpenStreetMap...</Text> : null}
            {searchResults.map((place) => (
              <SpringPressable
                key={place.placeId}
                onPress={() => {
                  setDestination(place.displayName);
                  setSelectedPlace({ lat: Number(place.lat), lon: Number(place.lon) });
                  setSearchResults([]);
                }}
                accessibilityRole="button"
                style={styles.resultRow}
              >
                <MapPin size={16} color={theme.color.teal} />
                <Text numberOfLines={2} style={styles.resultText}>
                  {place.displayName}
                </Text>
              </SpringPressable>
            ))}
            {!searching && searchResults.length === 0 ? (
              <Text style={styles.helperText}>
                {searchError || 'Try a city, landmark, road, or pin code.'}
              </Text>
            ) : null}
          </View>
        ) : null}

        {lastSearch && lastSearch.trim().length >= 3 && searchResults.length > 0 ? (
          <Text style={styles.helperText}>{`Showing results for "${lastSearch}"`}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Recent & suggested</Text>

        <View style={styles.placesList}>
          {recentPlaces.map((place) => (
            <SpringPressable
              key={place.name}
              onPress={() => {
                setDestination(place.name);
                setSelectedPlace({ lat: place.lat, lon: place.lon });
                setSearchResults([]);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.placeCard, pressed && styles.placeCardPressed]}
            >
              <View style={styles.placeIconWrap}>
                <place.Icon size={19} color={theme.color.teal} />
              </View>
              <View style={styles.placeCopy}>
                <Text numberOfLines={1} style={styles.placeName}>
                  {place.name}
                </Text>
                <Text numberOfLines={1} style={styles.placeArea}>
                  {place.area}
                </Text>
              </View>
            </SpringPressable>
          ))}
        </View>

        <SpringPressable
          disabled={!canContinue}
          onPress={() =>
            router.push({
              pathname: '/ride-options',
              params: {
                destination,
                lat: selectedPlace
                  ? String(selectedPlace.lat)
                  : useCurrentLocation && currentLocation
                    ? String(currentLocation.lat)
                    : '',
                lon: selectedPlace
                  ? String(selectedPlace.lon)
                  : useCurrentLocation && currentLocation
                    ? String(currentLocation.lon)
                    : '',
                pickupMode: useCurrentLocation ? 'current' : 'hitec'
              }
            })
          }
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.ctaButton,
            !canContinue && styles.ctaButtonDisabled,
            pressed && canContinue && styles.ctaButtonPressed
          ]}
        >
          <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
            See ride options
          </Text>
          <ArrowRight
            size={18}
            color={canContinue ? theme.color.textOnAccent : theme.color.muted}
          />
        </SpringPressable>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.surface
  },
  scroll: {
    width: '100%'
  },
  content: {
    width: '100%',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 112
  },
  title: {
    color: theme.color.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: theme.font.bold,
    marginTop: 20
  },
  subtitle: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  mapWrap: {
    marginTop: 16,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.color.border
  },
  locationBtn: {
    marginTop: theme.layout.cardGap,
    minHeight: theme.touchTarget,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10
  },
  locationBtnActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  locationBtnText: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.semibold,
    flex: 1
  },
  locationBtnTextActive: {
    color: theme.color.teal
  },
  errorText: {
    color: theme.color.orange,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  inputWrap: {
    marginTop: theme.layout.cardGap,
    height: 56,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.semibold
  },
  resultsBlock: {
    marginTop: theme.layout.cardGap,
    gap: 8
  },
  helperText: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.regular,
    marginTop: 4
  },
  resultRow: {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10
  },
  resultText: {
    flex: 1,
    color: theme.color.white,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: theme.font.semibold
  },
  sectionTitle: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold,
    marginTop: 22,
    marginBottom: 12
  },
  placesList: {
    gap: theme.layout.cardGap
  },
  placeCard: {
    minHeight: 68,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12
  },
  placeCardPressed: {
    borderColor: theme.color.teal
  },
  placeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeCopy: {
    flex: 1
  },
  placeName: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.semibold
  },
  placeArea: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  ctaButton: {
    minHeight: 54,
    marginTop: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  ctaButtonDisabled: {
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border
  },
  ctaButtonPressed: {
    opacity: 0.9
  },
  ctaText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  ctaTextDisabled: {
    color: theme.color.muted
  }
});
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, Clock3, MapPin, Search, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { OpenStreetMapPlaceSchema, type OpenStreetMapPlace } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { OpenStreetMap } from '../src/components/OpenStreetMap';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: 20,
          paddingBottom: 112
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <SpringPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: '#18181C',
              borderWidth: 1,
              borderColor: '#34343B',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={22} color={theme.color.white} />
          </SpringPressable>
          <View
            style={{
              borderRadius: 999,
              backgroundColor: theme.color.tealSoft,
              paddingHorizontal: 12,
              paddingVertical: 7
            }}
          >
            <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '800' }}>
              LOCATION PREVIEW
            </Text>
          </View>
        </View>

        <Text
          accessibilityRole="header"
          style={{
            color: theme.color.white,
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '800',
            marginTop: 24
          }}
        >
          Choose destination
        </Text>
        <Text style={{ color: '#A7A7AD', fontSize: 14, lineHeight: 21, marginTop: 8 }}>
          Select a sample place to preview the ride flow.
        </Text>

        <View style={{ marginTop: 16 }}>
          <OpenStreetMap
            height={180}
            latitude={selectedPlace?.lat ?? 17.4435}
            longitude={selectedPlace?.lon ?? 78.3772}
            label={destination.trim() ? `Map for ${destination}` : 'HITEC City pickup map'}
          />
        </View>

        <View
          style={{
            marginTop: 20,
            height: 60,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#34343B',
            backgroundColor: '#18181C',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16
          }}
        >
          <Search size={20} color={theme.color.teal} />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Search an address or place"
            accessibilityLabel="Destination"
            style={{
              flex: 1,
              height: '100%',
              marginLeft: 10,
              color: theme.color.white,
              fontSize: 16,
              fontWeight: '700'
            }}
          />
        </View>

        {destination.trim().length >= 3 ? (
          <View style={{ marginTop: 12 }}>
            {searching ? (
              <Text style={{ color: '#A7A7AD', fontSize: 13, marginBottom: 8 }}>
                Searching OpenStreetMap...
              </Text>
            ) : null}
            {searchResults.map((place) => (
              <SpringPressable
                key={place.placeId}
                onPress={() => {
                  setDestination(place.displayName);
                  setSelectedPlace({ lat: Number(place.lat), lon: Number(place.lon) });
                  setSearchResults([]);
                }}
                accessibilityRole="button"
                style={{
                  minHeight: 64,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#34343B',
                  backgroundColor: theme.color.surfaceDarkRaised,
                  justifyContent: 'center',
                  paddingHorizontal: 14,
                  marginBottom: 8
                }}
              >
                <Text numberOfLines={1} style={{ color: theme.color.white, fontWeight: '800' }}>
                  {place.displayName}
                </Text>
              </SpringPressable>
            ))}
            {!searching && searchResults.length === 0 ? (
              <Text style={{ color: '#A7A7AD', fontSize: 13, marginBottom: 8 }}>
                {searchError || 'Try a city, landmark, road, or pin code.'}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text
          style={{
            color: theme.color.white,
            fontSize: 16,
            fontWeight: '800',
            marginTop: 26,
            marginBottom: 10
          }}
        >
          Recent & suggested
        </Text>
        {recentPlaces.map((place) => (
          <SpringPressable
            key={place.name}
            onPress={() => {
              setDestination(place.name);
              setSelectedPlace({ lat: place.lat, lon: place.lon });
              setSearchResults([]);
            }}
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: 74,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: pressed ? theme.color.teal : '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              marginBottom: 10
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.color.lavender,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <place.Icon size={20} color={theme.color.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
                {place.name}
              </Text>
              <Text style={{ color: "#A7A7AD", fontSize: 13, marginTop: 3 }}>
                {place.area}
              </Text>
            </View>
          </SpringPressable>
        ))}

        <SpringPressable
          disabled={!destination.trim()}
          onPress={() =>
            router.push({
              pathname: '/ride-options',
              params: {
                destination,
                lat: selectedPlace ? String(selectedPlace.lat) : '',
                lon: selectedPlace ? String(selectedPlace.lon) : ''
              }
            })
          }
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 56,
            marginTop: 14,
            borderRadius: 16,
            backgroundColor: destination.trim() ? theme.color.orange : '#34343B',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            opacity: pressed ? 0.88 : 1
          })}
        >
          <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
            See ride options
          </Text>
          <ArrowRight size={18} color={theme.color.white} />
        </SpringPressable>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

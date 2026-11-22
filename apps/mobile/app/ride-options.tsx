import { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, View } from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Clock3,
  ShieldCheck,
  Star,
  Zap
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { OpenStreetMap } from '../src/components/OpenStreetMap';
import { createRide } from '../src/firebase/rides';
import { useIdentity } from '../src/firebase/useIdentity';

const options = [
  {
    id: 'calm',
    title: 'HerWay Calm',
    detail: 'Verified woman captain · 4 min',
    price: '₹180',
    Icon: ShieldCheck
  },
  {
    id: 'comfort',
    title: 'HerWay Comfort',
    detail: 'Extra space · 6 min',
    price: '₹245',
    Icon: Star
  },
  { id: 'quick', title: 'Quick ride', detail: 'Nearest captain · 8 min', price: '₹150', Icon: Zap }
] as const;

export default function RideOptionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string; lat?: string; lon?: string }>();
  const [selected, setSelected] = useState<(typeof options)[number]['id']>('calm');
  const [busy, setBusy] = useState(false);
  const identity = useIdentity();
  const latitude = Number(params.lat);
  const longitude = Number(params.lon);

  const onRequestRide = useCallback(async () => {
    if (busy) return;
    if (!identity.ready) {
      Alert.alert('Sign in required', 'Sign in with Google to request a women-only ride.');
      return;
    }
    const destination = typeof params.destination === 'string' ? params.destination.trim() : '';
    if (destination.length < 3) {
      Alert.alert('Choose a destination', 'Go back and pick where you want to go.');
      return;
    }
    setBusy(true);
    try {
      const rideId = await createRide(
        { uid: identity.uid, displayName: identity.displayName },
        {
          riderName: identity.displayName,
          pickup: 'HITEC City, Hyderabad',
          dropoff: destination,
          pickupPoint: { lat: 17.4435, lng: 78.3772 },
          dropoffPoint: {
            lat: Number.isFinite(latitude) ? latitude : 17.2403,
            lng: Number.isFinite(longitude) ? longitude : 78.4294
          },
          rideCategory: selected === 'comfort' ? 'premium' : 'standard',
          seats: 1,
          womenOnly: true
        }
      );
      router.push({ pathname: '/trip-live', params: { rideId } });
    } catch (error) {
      Alert.alert('Could not request ride', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, identity, latitude, longitude, params.destination, router, selected]);

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
              backgroundColor: theme.color.surfaceDarkRaised,
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
              ROUTE PREVIEW
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
          Choose your ride
        </Text>
        <View
          style={{
            minHeight: 48,
            marginTop: 10,
            borderRadius: 14,
            backgroundColor: theme.color.tealSoft,
            justifyContent: 'center',
            paddingHorizontal: 14
          }}
        >
          <Text
            style={{ color: theme.color.teal, fontSize: 12, lineHeight: 18, fontFamily: theme.font.bold }}
          >
            Fares are estimates. You will be matched with a verified woman captain.
          </Text>
        </View>
        <View
          style={{ marginTop: 14, borderRadius: 18, backgroundColor: theme.color.surfaceDark, padding: 16 }}
        >
          <Text style={{ color: '#BBD0DA', fontSize: 12, fontWeight: '800' }}>ROUTE PREVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.color.tealSoft
              }}
            />
            <View style={{ width: 2, height: 30, backgroundColor: '#517080', marginLeft: 4 }} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: theme.color.white, fontWeight: '800' }}>Current location</Text>
              <Text numberOfLines={2} style={{ color: '#BBD0DA', fontSize: 12, marginTop: 3 }}>
                {typeof params.destination === 'string' && params.destination
                  ? params.destination
                  : 'Destination selected'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <OpenStreetMap
              height={180}
              latitude={Number.isFinite(latitude) ? latitude : 17.4435}
              longitude={Number.isFinite(longitude) ? longitude : 78.3772}
              label="OpenStreetMap route preview"
            />
          </View>
        </View>

        <View style={{ marginTop: 18, gap: 10 }}>
          {options.map((option) => {
            const active = selected === option.id;
            return (
              <SpringPressable
                key={option.id}
                onPress={() => setSelected(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  minHeight: 96,
                  borderRadius: 20,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? theme.color.teal : '#34343B',
                  backgroundColor: theme.color.surfaceDarkRaised,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.92 : 1
                })}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: active ? theme.color.tealSoft : theme.color.lavender,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <option.Icon size={24} color={active ? theme.color.teal : theme.color.ink} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.color.white, fontSize: 16, fontWeight: '800' }}>
                    {option.title}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}
                  >
                    <Clock3 size={13} color={theme.color.muted} />
                    <Text style={{ color: "#A7A7AD", fontSize: 13 }}>{option.detail}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.color.white, fontSize: 16, fontWeight: '900' }}>
                  {option.price}
                </Text>
              </SpringPressable>
            );
          })}
        </View>

        <SpringPressable
          onPress={() => void onRequestRide()}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 56,
            marginTop: 18,
            borderRadius: 16,
            backgroundColor: theme.color.orange,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            opacity: pressed ? 0.88 : 1
          })}
        >
          <CarFront size={19} color={theme.color.white} />
          <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
            {busy ? 'Requesting…' : 'Request women-only ride'}
          </Text>
          <ArrowRight size={18} color={theme.color.white} />
        </SpringPressable>
        <SpringPressable
          onPress={() => router.push('/schedule-ride')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 54,
            marginTop: 10,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.color.teal,
            backgroundColor: theme.color.surfaceDark,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 9,
            opacity: pressed ? 0.88 : 1
          })}
        >
          <Clock3 size={18} color={theme.color.teal} />
          <Text style={{ color: theme.color.teal, fontSize: 14, fontWeight: '800' }}>
            Schedule a ride request
          </Text>
        </SpringPressable>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

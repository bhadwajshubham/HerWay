import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowRight, MapPin, ShieldCheck, Users } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RideRequestCreateSchema } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { FadeIn } from '../src/components/motion';
import { createRide } from '../src/firebase/rides';
import { useIdentity } from '../src/firebase/useIdentity';
import { useAuth } from '../src/firebase/useAuth';

const HITEC_PICKUP = {
  name: 'HITEC City Gate 2, Hyderabad',
  point: { lat: 17.4435, lng: 78.3772 }
};

export default function RideRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string; lat?: string; lon?: string }>();
  const identity = useIdentity();
  const { configured, loading } = useAuth();

  const [pickup, setPickup] = useState(HITEC_PICKUP.name);
  const [dropoff, setDropoff] = useState(params.destination ?? '');
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.destination) setDropoff(params.destination);
  }, [params.destination]);

  const submit = useCallback(async () => {
    if (busy) return;
    if (!identity.ready) {
      setStatus('Sign in with Google first so your ride is tied to a verified account.');
      return;
    }
    const lat = Number(params.lat);
    const lon = Number(params.lon);
    const parsed = RideRequestCreateSchema.safeParse({
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      pickupPoint: HITEC_PICKUP.point,
      dropoffPoint: {
        lat: Number.isFinite(lat) && lat !== 0 ? lat : 17.2403,
        lng: Number.isFinite(lon) && lon !== 0 ? lon : 78.4294
      },
      rideCategory: 'standard',
      seats,
      womenOnly: true,
      note: note.trim() ? note.trim() : undefined
    });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? 'Check your pickup and dropoff.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const rideId = await createRide(
        { uid: identity.uid, displayName: identity.displayName },
        { ...parsed.data, riderName: identity.displayName }
      );
      router.push({ pathname: '/trip-live', params: { rideId } });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the ride request.');
    } finally {
      setBusy(false);
    }
  }, [busy, dropoff, identity, note, params.lat, params.lon, pickup, router, seats]);

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
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="REQUEST A RIDE" tone="orange" />

        <FadeIn delay={40}>
          <Text
            accessibilityRole="header"
            style={{
              color: theme.color.white,
              fontSize: 32,
              lineHeight: 38,
              fontWeight: '900',
              letterSpacing: -0.8,
              marginTop: 22
            }}
          >
            Who is coming{`\n`}with you?
          </Text>
          <Text style={{ color: '#A7A7AD', fontSize: 14, lineHeight: 21, marginTop: 8 }}>
            Women-only by default. A verified woman captain can accept this ride.
          </Text>
        </FadeIn>

        <FadeIn delay={90}>
          <View
            style={{
              marginTop: 22,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              padding: 16
            }}
          >
            <Text style={{ color: '#A7A7AD', fontSize: 12, fontWeight: '800' }}>PICKUP</Text>
            <View
              style={{
                marginTop: 8,
                minHeight: 52,
                borderRadius: 14,
                backgroundColor: '#0F0F12',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12
              }}
            >
              <MapPin size={18} color={theme.color.teal} />
              <TextInput
                value={pickup}
                onChangeText={setPickup}
                accessibilityLabel="Pickup location"
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: theme.color.white,
                  fontSize: 15,
                  fontWeight: '700'
                }}
              />
            </View>

            <Text style={{ color: '#A7A7AD', fontSize: 12, fontWeight: '800', marginTop: 16 }}>
              DROP-OFF
            </Text>
            <View
              style={{
                marginTop: 8,
                minHeight: 52,
                borderRadius: 14,
                backgroundColor: '#0F0F12',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12
              }}
            >
              <MapPin size={18} color={theme.color.orange} />
              <TextInput
                value={dropoff}
                onChangeText={setDropoff}
                placeholder="Where to?"
                placeholderTextColor="#6C6C75"
                accessibilityLabel="Drop-off location"
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: theme.color.white,
                  fontSize: 15,
                  fontWeight: '700'
                }}
              />
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22 }}>
            <Users size={18} color={theme.color.white} />
            <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
              Seats needed
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {[1, 2, 3, 4].map((count) => {
              const active = seats === count;
              return (
                <SpringPressable
                  key={count}
                  onPress={() => setSeats(count)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    width: 56,
                    height: 52,
                    borderRadius: 14,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? theme.color.teal : '#34343B',
                    backgroundColor: active ? theme.color.tealSoft : theme.color.surfaceDarkRaised,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text
                    style={{
                      color: active ? theme.color.teal : theme.color.white,
                      fontSize: 17,
                      fontWeight: '900'
                    }}
                  >
                    {count}
                  </Text>
                </SpringPressable>
              );
            })}
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <Text style={{ color: '#A7A7AD', fontSize: 12, fontWeight: '800', marginTop: 22 }}>
            NOTE FOR YOUR CAPTAIN (OPTIONAL)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={240}
            placeholder="e.g. Near the main gate, wearing a blue jacket"
            placeholderTextColor="#6C6C75"
            accessibilityLabel="Note for captain"
            style={{
              marginTop: 8,
              minHeight: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              color: theme.color.white,
              paddingHorizontal: 14,
              fontSize: 15
            }}
          />
        </FadeIn>

        <FadeIn delay={220}>
          <View
            style={{
              marginTop: 18,
              borderRadius: 16,
              backgroundColor: '#11283A',
              borderWidth: 1,
              borderColor: '#21495A',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <ShieldCheck size={20} color="#9FCFC6" />
            <Text style={{ flex: 1, marginLeft: 10, color: '#E8EEF2', fontSize: 13, fontWeight: '700' }}>
              Women-only ride. Your captain must be a verified woman.
            </Text>
          </View>
        </FadeIn>

        {!configured && !loading ? (
          <Text style={{ color: theme.color.danger, marginTop: 12, fontSize: 13 }}>
            Firebase is not configured in this build.
          </Text>
        ) : null}

        <SpringPressable
          onPress={() => void submit()}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 58,
            marginTop: 18,
            borderRadius: 16,
            backgroundColor: theme.color.orange,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            opacity: pressed || busy ? 0.85 : 1
          })}
        >
          <Text style={{ color: theme.color.white, fontSize: 16, fontWeight: '900' }}>
            {busy ? 'Requesting...' : 'Request women-only ride'}
          </Text>
          <ArrowRight size={19} color={theme.color.white} />
        </SpringPressable>

        {status ? (
          <Text
            accessibilityRole="alert"
            style={{ color: theme.color.danger, marginTop: 12, fontSize: 13, textAlign: 'center' }}
          >
            {status}
          </Text>
        ) : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

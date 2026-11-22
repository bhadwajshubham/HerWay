import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const params = useLocalSearchParams<{
    destination?: string;
    lat?: string;
    lon?: string;
    pickupMode?: string;
  }>();
  const identity = useIdentity();
  const { configured, loading } = useAuth();

  const [pickup, setPickup] = useState(HITEC_PICKUP.name);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [dropoff, setDropoff] = useState(params.destination ?? '');
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.destination) setDropoff(params.destination);
    if (params.pickupMode) setUseCurrentLocation(params.pickupMode === 'current');
  }, [params.destination, params.pickupMode]);

  useEffect(() => {
    if (params.pickupMode === 'current' && params.lat && params.lon) {
      const lat = Number(params.lat);
      const lon = Number(params.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        setCurrentLocation({ lat, lon });
      }
    }
  }, [params.lat, params.lon, params.pickupMode]);

  useEffect(() => {
    if (useCurrentLocation && currentLocation) {
      setPickup('Current location');
    } else if (!useCurrentLocation) {
      setPickup(HITEC_PICKUP.name);
    }
  }, [useCurrentLocation, currentLocation]);

  const submit = useCallback(async () => {
    if (busy) return;
    if (!identity.ready) {
      setStatus('Sign in with Google first so your ride is tied to a verified account.');
      return;
    }
    const lat = Number(params.lat);
    const lon = Number(params.lon);
    const pickupPoint =
      useCurrentLocation && currentLocation
        ? { lat: currentLocation.lat, lng: currentLocation.lon }
        : HITEC_PICKUP.point;
    const dropoffPoint =
      Number.isFinite(lat) && lat !== 0 && Number.isFinite(lon) && lon !== 0
        ? { lat, lng: lon }
        : { lat: 17.2403, lng: 78.4294 };
    const parsed = RideRequestCreateSchema.safeParse({
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      pickupPoint,
      dropoffPoint,
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
  }, [
    busy,
    currentLocation,
    dropoff,
    identity,
    note,
    params.lat,
    params.lon,
    pickup,
    router,
    seats,
    useCurrentLocation
  ]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="REQUEST A RIDE" tone="orange" />

        <FadeIn delay={40}>
          <Text accessibilityRole="header" style={styles.title}>
            Who is coming{`\n`}with you?
          </Text>
          <Text style={styles.subtitle}>
            Women-only by default. A verified woman captain can accept this ride.
          </Text>
        </FadeIn>

        <FadeIn delay={90}>
          <View style={styles.card}>
            <Text style={styles.microLabel}>PICKUP</Text>
            <View style={styles.locToggleRow}>
              <SpringPressable
                onPress={() => setUseCurrentLocation((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel="Use current location as pickup"
                style={[styles.locBtn, useCurrentLocation && styles.locBtnActive]}
              >
                <MapPin
                  size={18}
                  color={useCurrentLocation ? theme.color.teal : theme.color.white}
                />
              </SpringPressable>
              <Text style={styles.locLabel}>
                {useCurrentLocation ? 'Using current location' : 'Use current location'}
              </Text>
            </View>

            <View style={styles.inputBox}>
              <MapPin size={18} color={theme.color.teal} />
              <TextInput
                value={pickup}
                onChangeText={setPickup}
                accessibilityLabel="Pickup location"
                style={styles.inputField}
              />
            </View>

            <Text style={[styles.microLabel, styles.spacedLabel]}>DROP-OFF</Text>
            <View style={styles.inputBox}>
              <MapPin size={18} color={theme.color.orange} />
              <TextInput
                value={dropoff}
                onChangeText={setDropoff}
                placeholder="Where to?"
                placeholderTextColor={theme.color.muted}
                accessibilityLabel="Drop-off location"
                style={styles.inputField}
              />
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <View style={styles.seatsHeader}>
            <Users size={18} color={theme.color.white} />
            <Text style={styles.seatsTitle}>Seats needed</Text>
          </View>
          <View style={styles.seatsRow}>
            {[1, 2, 3, 4].map((count) => {
              const active = seats === count;
              return (
                <SpringPressable
                  key={count}
                  onPress={() => setSeats(count)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.seatChip, active && styles.seatChipActive]}
                >
                  <Text style={[styles.seatText, active && styles.seatTextActive]}>{count}</Text>
                </SpringPressable>
              );
            })}
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <Text style={[styles.microLabel, styles.spacedLabel]}>
            NOTE FOR YOUR CAPTAIN (OPTIONAL)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={240}
            placeholder="e.g. Near the main gate, wearing a blue jacket"
            placeholderTextColor={theme.color.muted}
            accessibilityLabel="Note for captain"
            style={styles.noteInput}
          />
        </FadeIn>

        <FadeIn delay={220}>
          <View style={styles.assuranceBanner}>
            <ShieldCheck size={20} color={theme.color.teal} />
            <Text style={styles.assuranceText}>
              Women-only ride · Verified woman captain · 4-digit Start PIN
            </Text>
          </View>
        </FadeIn>

        {!configured && !loading ? (
          <Text style={styles.configError}>Firebase is not configured in this build.</Text>
        ) : null}

        <SpringPressable
          onPress={() => void submit()}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submitBtn,
            (pressed || busy) && styles.pressed
          ]}
        >
          <Text style={styles.submitBtnText}>
            {busy ? 'Requesting...' : 'Request women-only ride'}
          </Text>
          <ArrowRight size={19} color={theme.color.textOnAccent} />
        </SpringPressable>

        {status ? (
          <Text accessibilityRole="alert" style={styles.statusError}>
            {status}
          </Text>
        ) : null}
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
    fontSize: 30,
    lineHeight: 36,
    fontFamily: theme.font.bold,
    letterSpacing: -0.6,
    marginTop: 20
  },
  subtitle: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  card: {
    marginTop: 20,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 16
  },
  microLabel: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.4
  },
  spacedLabel: {
    marginTop: 16
  },
  locToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8
  },
  locBtn: {
    minHeight: 44,
    width: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  locBtnActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  locLabel: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.semibold
  },
  inputBox: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  inputField: {
    flex: 1,
    marginLeft: 10,
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.semibold
  },
  seatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20
  },
  seatsTitle: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  seatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  seatChip: {
    width: 54,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center'
  },
  seatChipActive: {
    borderWidth: 2,
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  seatText: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  seatTextActive: {
    color: theme.color.teal
  },
  noteInput: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    color: theme.color.white,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: theme.font.regular
  },
  assuranceBanner: {
    marginTop: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  assuranceText: {
    flex: 1,
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  configError: {
    color: theme.color.danger,
    marginTop: 12,
    fontSize: 13,
    fontFamily: theme.font.semibold
  },
  submitBtn: {
    minHeight: 54,
    marginTop: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9
  },
  submitBtnText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  statusError: {
    color: theme.color.danger,
    marginTop: 12,
    fontSize: 13,
    fontFamily: theme.font.semibold,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.88
  }
});
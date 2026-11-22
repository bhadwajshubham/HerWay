import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowRight, CarFront, MapPin, ShieldCheck, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { RideRequest } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { FadeIn, PopIn } from '../src/components/motion';
import { acceptRide, advanceRide, subscribeOpenRides, subscribeRide } from '../src/firebase/rides';
import { ensureCaptainProfile } from '../src/firebase/captains';
import { publishLiveLocation, watchDeviceLocation } from '../src/firebase/liveLocation';
import { useIdentity } from '../src/firebase/useIdentity';

const NEXT_ACTION: Partial<Record<RideRequest['status'], string>> = {
  DRIVER_ACCEPTED: 'Mark arrived',
  ARRIVED: 'Start trip',
  IN_TRANSIT: 'Complete trip'
};

export default function CaptainScreen() {
  const router = useRouter();
  const identity = useIdentity();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [active, setActive] = useState<RideRequest | null>(null);
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeOpenRides(setRides, (error) => setStatus(error.message)), []);

  useEffect(() => {
    if (!active) return;
    return subscribeRide(active.rideId, (next) => setActive(next), (error) => setStatus(error.message));
  }, [active?.rideId]);

  useEffect(() => {
    if (!active || active.status !== 'IN_TRANSIT') return;
    return watchDeviceLocation(
      (point) => {
        void publishLiveLocation(active.rideId, point).catch(() => undefined);
      },
      (message) => setStatus(message)
    );
  }, [active?.rideId, active?.status]);

  const onAccept = useCallback(
    async (ride: RideRequest) => {
      if (busy || !identity.ready) {
        setStatus('Sign in with Google to accept rides as a verified captain.');
        return;
      }
      if (!vehicle.trim() || !plate.trim()) {
        setStatus('Add your vehicle and plate before accepting a ride.');
        return;
      }
      setBusy(true);
      setStatus('');
      try {
        const captain = await ensureCaptainProfile(identity.uid, {
          displayName: identity.displayName,
          vehicle,
          plate
        });
        await acceptRide(ride.rideId, captain);
        setActive({ ...ride, status: 'DRIVER_ACCEPTED', captain });
        router.push({ pathname: '/trip-live', params: { rideId: ride.rideId } });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Could not accept the ride.');
      } finally {
        setBusy(false);
      }
    },
    [busy, identity, plate, router, vehicle]
  );

  const onAdvance = useCallback(async () => {
    if (!active || busy || !identity.uid) return;
    setBusy(true);
    setStatus('');
    try {
      await advanceRide(active.rideId, active.status, identity.uid);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update the ride.');
    } finally {
      setBusy(false);
    }
  }, [active, busy, identity.uid]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: 20,
          paddingBottom: 112
        }}
      >
        <ScreenHeader badge="CAPTAIN" tone="teal" />
        <FadeIn delay={40}>
          <Text style={{ color: theme.color.white, fontSize: 30, fontWeight: '900', marginTop: 20 }}>
            Rides near you
          </Text>
          <Text style={{ color: '#A7A7AD', fontSize: 14, marginTop: 6 }}>
            Verified women captains only. Accept a request to start the trip.
          </Text>
        </FadeIn>

        <FadeIn delay={80}>
          <View
            style={{
              marginTop: 18,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              padding: 16
            }}
          >
            <Text style={{ color: '#A7A7AD', fontSize: 12, fontWeight: '800' }}>YOUR VEHICLE</Text>
            <TextInput
              value={vehicle}
              onChangeText={setVehicle}
              placeholder="Vehicle (e.g. Swift)"
              placeholderTextColor="#6C6C75"
              style={{ color: theme.color.white, minHeight: 48, marginTop: 8 }}
            />
            <TextInput
              value={plate}
              onChangeText={setPlate}
              placeholder="Plate (e.g. TS09AB1234)"
              placeholderTextColor="#6C6C75"
              autoCapitalize="characters"
              style={{ color: theme.color.white, minHeight: 48, borderTopWidth: 1, borderColor: '#34343B' }}
            />
          </View>
        </FadeIn>

        {active && NEXT_ACTION[active.status] ? (
          <PopIn delay={60}>
            <View
              style={{
                marginTop: 16,
                borderRadius: 20,
                backgroundColor: theme.color.tealSoft,
                padding: 16
              }}
            >
              <Text style={{ color: theme.color.ink, fontWeight: '900', fontSize: 16 }}>
                Active ride · {active.status.replace('_', ' ')}
              </Text>
              <Text style={{ color: theme.color.ink, fontSize: 13, marginTop: 4 }}>
                {active.pickup} → {active.dropoff}
              </Text>
              <SpringPressable
                onPress={() => void onAdvance()}
                accessibilityRole="button"
                style={{
                  marginTop: 12,
                  minHeight: 48,
                  borderRadius: 14,
                  backgroundColor: theme.color.teal,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ color: theme.color.white, fontWeight: '900' }}>
                  {NEXT_ACTION[active.status]}
                </Text>
              </SpringPressable>
            </View>
          </PopIn>
        ) : null}

        <View style={{ marginTop: 20, gap: 12 }}>
          {rides.length === 0 ? (
            <Text style={{ color: '#A7A7AD', textAlign: 'center', marginTop: 24 }}>
              No open rides right now. Check back shortly.
            </Text>
          ) : null}
          {rides.map((ride, index) => (
            <FadeIn key={ride.rideId} delay={index * 50}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#34343B',
                  backgroundColor: theme.color.surfaceDarkRaised,
                  padding: 16
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CarFront size={20} color={theme.color.teal} />
                  <Text style={{ color: theme.color.white, fontWeight: '900', marginLeft: 8, flex: 1 }}>
                    {ride.riderName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Star size={12} color={theme.color.orange} />
                    <Text style={{ color: '#A7A7AD', fontSize: 12, marginLeft: 3 }}>women-only</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <MapPin size={16} color={theme.color.teal} />
                  <Text style={{ color: '#BBD0DA', fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                    {ride.pickup}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <MapPin size={16} color={theme.color.orange} />
                  <Text style={{ color: '#BBD0DA', fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                    {ride.dropoff}
                  </Text>
                </View>
                <SpringPressable
                  onPress={() => void onAccept(ride)}
                  accessibilityRole="button"
                  style={{
                    marginTop: 14,
                    minHeight: 48,
                    borderRadius: 14,
                    backgroundColor: theme.color.orange,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <ShieldCheck size={18} color={theme.color.white} />
                  <Text style={{ color: theme.color.white, fontWeight: '900' }}>Accept ride</Text>
                  <ArrowRight size={16} color={theme.color.white} />
                </SpringPressable>
              </View>
            </FadeIn>
          ))}
        </View>

        {status ? (
          <Text accessibilityRole="alert" style={{ color: theme.color.danger, marginTop: 14 }}>
            {status}
          </Text>
        ) : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

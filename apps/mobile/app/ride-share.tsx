import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, MapPin, Users, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PoolCreateSchema, type Pool } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { FadeIn } from '../src/components/motion';
import { createPool, joinPool, subscribeOpenPools } from '../src/firebase/pools';
import { useIdentity } from '../src/firebase/useIdentity';

const HITEC = { lat: 17.4435, lng: 78.3772 };
const DESTINATION = { lat: 17.2403, lng: 78.4294 };

export default function RideShareScreen() {
  const router = useRouter();
  const identity = useIdentity();
  const [pools, setPools] = useState<Pool[]>([]);
  const [origin, setOrigin] = useState('HITEC City Gate 2');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('120');
  const [seats, setSeats] = useState('3');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeOpenPools(setPools, (error) => setStatus(error.message)), []);

  const onHost = useCallback(async () => {
    if (busy || !identity.ready) {
      setStatus('Sign in with Google to host a shared ride.');
      return;
    }
    const parsed = PoolCreateSchema.safeParse({
      origin: origin.trim(),
      destination: destination.trim(),
      originPoint: HITEC,
      destinationPoint: DESTINATION,
      departureAt: Date.now() + 30 * 60 * 1000,
      seatsTotal: Number(seats),
      fareShareInr: Number(fare)
    });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? 'Check your ride details.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await createPool({ uid: identity.uid, displayName: identity.displayName }, parsed.data);
      setDestination('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not host the ride.');
    } finally {
      setBusy(false);
    }
  }, [busy, destination, fare, identity, origin, seats]);

  const onJoin = useCallback(
    async (pool: Pool) => {
      if (!identity.ready) {
        setStatus('Sign in with Google to join a shared ride.');
        return;
      }
      setStatus('');
      try {
        await joinPool(pool.poolId, { uid: identity.uid, displayName: identity.displayName });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Could not join the ride.');
      }
    },
    [identity]
  );

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SpringPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={22} color={theme.color.white} />
          </SpringPressable>
          <ScreenHeader badge="SHARE & SPLIT" tone="teal" />
        </View>

        <FadeIn delay={40}>
          <Text style={{ color: theme.color.white, fontSize: 30, fontWeight: '900', marginTop: 18 }}>
            Share a ride
          </Text>
          <Text style={{ color: '#A7A7AD', fontSize: 14, marginTop: 6 }}>
            Women going the same way can join and split the fare.
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
            <Text style={{ color: '#A7A7AD', fontSize: 12, fontWeight: '800' }}>HOST A RIDE</Text>
            <TextInput
              value={origin}
              onChangeText={setOrigin}
              accessibilityLabel="Origin"
              style={{ color: theme.color.white, minHeight: 48, marginTop: 8 }}
            />
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Where are you going?"
              placeholderTextColor="#6C6C75"
              accessibilityLabel="Destination"
              style={{ color: theme.color.white, minHeight: 48, borderTopWidth: 1, borderColor: '#34343B' }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={fare}
                onChangeText={setFare}
                keyboardType="numeric"
                accessibilityLabel="Fare per seat"
                style={{
                  flex: 1,
                  color: theme.color.white,
                  minHeight: 48,
                  borderTopWidth: 1,
                  borderColor: '#34343B'
                }}
              />
              <TextInput
                value={seats}
                onChangeText={setSeats}
                keyboardType="numeric"
                accessibilityLabel="Seats available"
                style={{
                  flex: 1,
                  color: theme.color.white,
                  minHeight: 48,
                  borderTopWidth: 1,
                  borderColor: '#34343B'
                }}
              />
            </View>
            <SpringPressable
              onPress={() => void onHost()}
              accessibilityRole="button"
              style={{
                marginTop: 12,
                minHeight: 50,
                borderRadius: 14,
                backgroundColor: theme.color.orange,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ color: theme.color.white, fontWeight: '900' }}>Post shared ride</Text>
            </SpringPressable>
          </View>
        </FadeIn>

        <Text style={{ color: theme.color.white, fontSize: 20, fontWeight: '900', marginTop: 24 }}>
          Open pools nearby
        </Text>
        <View style={{ marginTop: 12, gap: 12 }}>
          {pools.length === 0 ? (
            <Text style={{ color: '#A7A7AD', textAlign: 'center', marginTop: 16 }}>
              No shared rides yet. Be the first to post one.
            </Text>
          ) : null}
          {pools.map((pool, index) => (
            <FadeIn key={pool.poolId} delay={index * 50}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#34343B',
                  backgroundColor: theme.color.surfaceDarkRaised,
                  padding: 16
                }}
              >
                <Text style={{ color: theme.color.white, fontWeight: '900', fontSize: 16 }}>
                  {pool.origin} → {pool.destination}
                </Text>
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Users size={15} color={theme.color.teal} />
                    <Text style={{ color: '#BBD0DA', fontSize: 13, marginLeft: 5 }}>
                      {pool.members.length}/{pool.seatsTotal} seats
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Wallet size={15} color={theme.color.orange} />
                    <Text style={{ color: '#BBD0DA', fontSize: 13, marginLeft: 5 }}>
                      ₹{pool.fareShareInr}/seat
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MapPin size={15} color={theme.color.teal} />
                    <Text style={{ color: '#BBD0DA', fontSize: 13, marginLeft: 5 }}>{pool.hostName}</Text>
                  </View>
                </View>
                <SpringPressable
                  onPress={() => void onJoin(pool)}
                  accessibilityRole="button"
                  style={{
                    marginTop: 12,
                    minHeight: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.color.teal,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: theme.color.teal, fontWeight: '900' }}>Join this ride</Text>
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

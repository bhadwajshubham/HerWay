import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Share, Text, View } from 'react-native';
import {
  ArrowLeft,
  CarFront,
  MessageCircle,
  Phone,
  ShieldCheck,
  Siren,
  Star
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RideRequest } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { OpenStreetMap } from '../src/components/OpenStreetMap';
import { FadeIn, PopIn, Pulse } from '../src/components/motion';
import { cancelRide, subscribeRide } from '../src/firebase/rides';
import { subscribeLiveLocation, type LiveFix } from '../src/firebase/liveLocation';
import { useIdentity } from '../src/firebase/useIdentity';

const STATUS_COPY: Record<RideRequest['status'], { title: string; detail: string; tone: string }> = {
  SEARCHING: {
    title: 'Finding your captain',
    detail: 'We are matching you with a verified woman captain nearby.',
    tone: theme.color.orange
  },
  DRIVER_ACCEPTED: {
    title: 'Captain on the way',
    detail: 'Your captain accepted the ride and is heading to pickup.',
    tone: theme.color.teal
  },
  ARRIVED: {
    title: 'Captain has arrived',
    detail: 'Meet your captain at the pickup point.',
    tone: theme.color.teal
  },
  IN_TRANSIT: {
    title: 'On the way',
    detail: 'You are in transit. Share your trip with a trusted contact.',
    tone: theme.color.teal
  },
  COMPLETED: {
    title: 'Ride completed',
    detail: 'Thanks for riding with HerWay. Stay safe.',
    tone: theme.color.teal
  },
  CANCELLED: {
    title: 'Ride cancelled',
    detail: 'This ride was cancelled. Request a new one when ready.',
    tone: theme.color.danger
  }
};

export default function TripLiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const identity = useIdentity();
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [liveFix, setLiveFix] = useState<LiveFix | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.rideId) return;
    const unsubscribe = subscribeRide(
      params.rideId,
      (next) => setRide(next),
      (snapshotError) => setError(snapshotError.message)
    );
    return () => unsubscribe();
  }, [params.rideId]);

  useEffect(() => {
    if (!params.rideId) return;
    return subscribeLiveLocation(params.rideId, setLiveFix, () => undefined);
  }, [params.rideId]);

  const copy = ride ? STATUS_COPY[ride.status] : null;
  const isRider = Boolean(ride && identity.uid && ride.riderUid === identity.uid);
  const canCancel =
    isRider && ride !== null && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED';

  const handleCancel = () => {
    if (!ride || !identity.uid) return;
    Alert.alert('Cancel this ride?', 'Your captain will be notified immediately.', [
      { text: 'Keep ride', style: 'cancel' },
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: () => {
          void cancelRide(ride.rideId, identity.uid).catch((cancelError) => {
            setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel');
          });
        }
      }
    ]);
  };

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
              WOMEN-ONLY RIDE
            </Text>
          </View>
        </View>

        <FadeIn delay={40}>
          <View style={{ marginTop: 18 }}>
            <OpenStreetMap
              height={210}
              latitude={liveFix?.point.lat ?? ride?.pickupPoint.lat}
              longitude={liveFix?.point.lng ?? ride?.pickupPoint.lng}
              label="Live trip map"
            />
          </View>
        </FadeIn>

        {!params.rideId ? (
          <FadeIn delay={80}>
            <View
              style={{
                marginTop: 16,
                borderRadius: 22,
                backgroundColor: theme.color.surfaceDarkRaised,
                borderWidth: 1,
                borderColor: '#34343B',
                padding: 20
              }}
            >
              <Text style={{ color: theme.color.white, fontSize: 20, fontWeight: '900' }}>
                No active ride
              </Text>
              <Text style={{ color: '#A7A7AD', marginTop: 6 }}>
                Request a women-only ride to see live status here.
              </Text>
              <SpringPressable
                onPress={() => router.push('/ride-request')}
                accessibilityRole="button"
                style={{
                  marginTop: 16,
                  minHeight: 52,
                  borderRadius: 14,
                  backgroundColor: theme.color.orange,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ color: theme.color.white, fontWeight: '900', fontSize: 15 }}>
                  Request a ride
                </Text>
              </SpringPressable>
            </View>
          </FadeIn>
        ) : null}

        {ride && copy ? (
          <>
            <FadeIn delay={80}>
              <View
                style={{
                  marginTop: 16,
                  borderRadius: 22,
                  backgroundColor: theme.color.surfaceDarkRaised,
                  borderWidth: 1,
                  borderColor: '#34343B',
                  padding: 18
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {ride.status === 'SEARCHING' ? (
                    <Pulse>
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: copy.tone
                        }}
                      />
                    </Pulse>
                  ) : (
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: copy.tone
                      }}
                    />
                  )}
                  <Text
                    accessibilityRole="header"
                    style={{
                      color: theme.color.white,
                      fontSize: 20,
                      fontWeight: '900',
                      marginLeft: 10,
                      flex: 1
                    }}
                  >
                    {copy.title}
                  </Text>
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: copy.tone,
                      paddingHorizontal: 10,
                      paddingVertical: 5
                    }}
                  >
                    <Text style={{ color: copy.tone, fontSize: 11, fontWeight: '900' }}>
                      {ride.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#A7A7AD', marginTop: 8 }}>{copy.detail}</Text>
                {liveFix ? (
                  <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '800', marginTop: 6 }}>
                    Captain location updated {Math.max(0, Math.round((Date.now() - liveFix.updatedAt) / 1000))}s ago
                  </Text>
                ) : null}
                <View style={{ height: 1, backgroundColor: '#34343B', marginVertical: 14 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.color.teal
                    }}
                  />
                  <Text style={{ color: theme.color.white, marginLeft: 10, flex: 1 }} numberOfLines={1}>
                    {ride.pickup}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.color.orange
                    }}
                  />
                  <Text style={{ color: theme.color.white, marginLeft: 10, flex: 1 }} numberOfLines={1}>
                    {ride.dropoff}
                  </Text>
                </View>
                <Text style={{ color: '#A7A7AD', fontSize: 13, marginTop: 12 }}>
                  {ride.seats} {ride.seats === 1 ? 'seat' : 'seats'} · {ride.riderName}
                  {ride.note ? ` · ${ride.note}` : ''}
                </Text>
              </View>
            </FadeIn>

            {ride.captain ? (
              <PopIn delay={120}>
                <View
                  style={{
                    marginTop: 14,
                    borderRadius: 22,
                    backgroundColor: theme.color.surfaceDarkRaised,
                    borderWidth: 1,
                    borderColor: '#34343B',
                    padding: 18
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: theme.color.tealSoft,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CarFront size={24} color={theme.color.teal} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: theme.color.white, fontSize: 17, fontWeight: '900' }}>
                        {ride.captain.displayName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        <Star size={13} color={theme.color.orange} fill={theme.color.orange} />
                        <Text style={{ color: '#A7A7AD', fontSize: 13, marginLeft: 4 }}>
                          {ride.captain.rating.toFixed(1)} · {ride.captain.vehicle}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#34343B',
                        paddingHorizontal: 10,
                        paddingVertical: 6
                      }}
                    >
                      <Text style={{ color: theme.color.white, fontWeight: '900', fontSize: 13 }}>
                        {ride.captain.plate}
                      </Text>
                    </View>
                  </View>
                </View>
              </PopIn>
            ) : null}

            <FadeIn delay={160}>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <SpringPressable
                  onPress={() =>
                    router.push({ pathname: '/ride-chat', params: { rideId: ride.rideId } })
                  }
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    minHeight: 66,
                    borderRadius: 18,
                    backgroundColor: theme.color.surfaceDarkRaised,
                    borderWidth: 1,
                    borderColor: '#34343B',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MessageCircle size={21} color={theme.color.teal} />
                  <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 5 }}>
                    Ride chat
                  </Text>
                </SpringPressable>
                <SpringPressable
                  onPress={() => router.push('/safety')}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    minHeight: 66,
                    borderRadius: 18,
                    backgroundColor: theme.color.surfaceDarkRaised,
                    borderWidth: 1,
                    borderColor: '#34343B',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Siren size={21} color={theme.color.danger} />
                  <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 5 }}>
                    Safety
                  </Text>
                </SpringPressable>
                <SpringPressable
                  onPress={() =>
                    Share.share({
                      title: 'My HerWay ride',
                      message: `I'm on a women-only HerWay ride from ${ride.pickup} to ${ride.dropoff}.`
                    })
                  }
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    minHeight: 66,
                    borderRadius: 18,
                    backgroundColor: theme.color.surfaceDarkRaised,
                    borderWidth: 1,
                    borderColor: '#34343B',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Phone size={21} color={theme.color.teal} />
                  <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 5 }}>
                    Share
                  </Text>
                </SpringPressable>
              </View>
            </FadeIn>

            {canCancel ? (
              <SpringPressable
                onPress={handleCancel}
                accessibilityRole="button"
                style={{
                  marginTop: 16,
                  minHeight: 52,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.color.danger,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ color: theme.color.danger, fontSize: 14, fontWeight: '800' }}>
                  Cancel ride
                </Text>
              </SpringPressable>
            ) : null}
          </>
        ) : null}

        {ride?.status === 'COMPLETED' ? (
          <FadeIn delay={80}>
            <View
              style={{
                marginTop: 16,
                borderRadius: 18,
                backgroundColor: theme.color.tealSoft,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <ShieldCheck size={20} color={theme.color.teal} />
              <Text
                style={{ flex: 1, marginLeft: 10, color: theme.color.ink, fontSize: 13, fontWeight: '700' }}
              >
                Ride complete. You can request another women-only ride anytime.
              </Text>
            </View>
          </FadeIn>
        ) : null}

        {error ? (
          <Text accessibilityRole="alert" style={{ color: theme.color.danger, marginTop: 12, fontSize: 13 }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  AlertCircle,
  ArrowLeft,
  CarFront,
  CheckCircle2,
  MessageCircle,
  Navigation,
  Share2,
  ShieldCheck,
  Siren,
  Star,
  Users
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

const DARK_DANGER = '#F87171';
const DARK_DANGER_SOFT = 'rgba(248, 113, 113, 0.14)';
const DARK_TEAL_SOFT = 'rgba(17, 108, 102, 0.24)';
const DARK_ORANGE_SOFT = 'rgba(255, 106, 0, 0.18)';
const MUTED_DARK = '#A7A7AD';

const TRIP_STEPS = ['Matching', 'En route', 'Arrived', 'In transit'] as const;

const STATUS_META: Record<
  RideRequest['status'],
  { title: string; detail: string; tone: string; softBg: string; stepIndex: number }
> = {
  SEARCHING: {
    title: 'Finding your captain',
    detail: 'Matching you with a verified woman captain nearby.',
    tone: theme.color.orange,
    softBg: DARK_ORANGE_SOFT,
    stepIndex: 0
  },
  DRIVER_ACCEPTED: {
    title: 'Captain on the way',
    detail: 'Your captain accepted the ride and is heading to pickup.',
    tone: '#2DD4BF',
    softBg: DARK_TEAL_SOFT,
    stepIndex: 1
  },
  ARRIVED: {
    title: 'Captain has arrived',
    detail: 'Check the plate number below and meet at your pickup point.',
    tone: '#2DD4BF',
    softBg: DARK_TEAL_SOFT,
    stepIndex: 2
  },
  IN_TRANSIT: {
    title: 'On the way',
    detail: 'You are in transit. Share your live trip with a trusted contact.',
    tone: '#2DD4BF',
    softBg: DARK_TEAL_SOFT,
    stepIndex: 3
  },
  COMPLETED: {
    title: 'Ride completed',
    detail: 'Thanks for riding with HerWay. Stay safe.',
    tone: '#2DD4BF',
    softBg: DARK_TEAL_SOFT,
    stepIndex: 4
  },
  CANCELLED: {
    title: 'Ride cancelled',
    detail: 'This ride was cancelled. Request a new one whenever you are ready.',
    tone: DARK_DANGER,
    softBg: DARK_DANGER_SOFT,
    stepIndex: -1
  }
};

export default function TripLiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const identity = useIdentity();

  const [ride, setRide] = useState<RideRequest | null>(null);
  const [hasLoadedRide, setHasLoadedRide] = useState(!params.rideId);
  const [liveFix, setLiveFix] = useState<LiveFix | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.rideId) {
      setHasLoadedRide(true);
      return;
    }
    setHasLoadedRide(false);
    const unsubscribe = subscribeRide(
      params.rideId,
      (next) => {
        setRide(next);
        setHasLoadedRide(true);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setHasLoadedRide(true);
      }
    );
    return () => unsubscribe();
  }, [params.rideId]);

  useEffect(() => {
    if (!params.rideId) return;
    return subscribeLiveLocation(params.rideId, setLiveFix, () => undefined);
  }, [params.rideId]);

  const isActive = ride !== null && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED';

  useEffect(() => {
    if (!liveFix || !isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [liveFix, isActive]);

  const meta = ride ? STATUS_META[ride.status] : null;
  const isRider = Boolean(ride && identity.uid && ride.riderUid === identity.uid);
  const canCancel = isRider && isActive;
  const gpsAgeSec = liveFix ? Math.max(0, Math.round((now - liveFix.updatedAt) / 1000)) : null;
  const isGpsStale = gpsAgeSec !== null && gpsAgeSec > 30;

  const executeCancel = async () => {
    if (!ride || !identity.uid || cancelling) return;
    setCancelling(true);
    setError('');
    try {
      await cancelRide(ride.rideId, identity.uid);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel ride');
    } finally {
      setCancelling(false);
    }
  };

  const handleCancel = () => {
    if (!ride || !identity.uid || cancelling) return;
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Cancel this ride? Your captain will be notified immediately.')
          : true;
      if (confirmed) void executeCancel();
      return;
    }
    Alert.alert('Cancel this ride?', 'Your captain will be notified immediately.', [
      { text: 'Keep ride', style: 'cancel' },
      { text: 'Cancel ride', style: 'destructive', onPress: () => void executeCancel() }
    ]);
  };

  const handleShare = async () => {
    if (!ride) return;
    const captainInfo = ride.captain
      ? `\nCaptain: ${ride.captain.displayName} (${ride.captain.vehicle} · ${ride.captain.plate})`
      : '';
    try {
      await Share.share({
        title: 'My HerWay ride',
        message: `I'm on a women-only HerWay ride.\nFrom: ${ride.pickup}\nTo: ${ride.dropoff}${captainInfo}`
      });
    } catch {
      setError('Unable to open share sheet.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <SpringPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconButton}
          >
            <ArrowLeft size={22} color={theme.color.white} />
          </SpringPressable>

          <View style={styles.womenOnlyPill}>
            <ShieldCheck size={14} color="#2DD4BF" />
            <Text style={styles.womenOnlyText}>WOMEN-ONLY RIDE</Text>
          </View>
        </View>

        {/* Map Container with Live Overlay */}
        <FadeIn delay={40}>
          <View style={styles.mapWrapper}>
            <OpenStreetMap
              height={230}
              latitude={liveFix?.point.lat ?? ride?.pickupPoint.lat}
              longitude={liveFix?.point.lng ?? ride?.pickupPoint.lng}
              label="Live trip map"
            />
            {isActive ? (
              <View style={styles.mapOverlayBadge}>
                {liveFix && !isGpsStale ? (
                  <Pulse>
                    <View style={[styles.liveDot, { backgroundColor: '#2DD4BF' }]} />
                  </Pulse>
                ) : (
                  <Navigation size={12} color={isGpsStale ? theme.color.orange : MUTED_DARK} />
                )}
                <Text style={styles.mapOverlayText}>
                  {liveFix
                    ? isGpsStale
                      ? `GPS delayed (${gpsAgeSec}s)`
                      : `Live GPS · ${gpsAgeSec}s ago`
                    : 'Pickup area'}
                </Text>
              </View>
            ) : null}
          </View>
        </FadeIn>

        {/* Loading State */}
        {params.rideId && !hasLoadedRide ? (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color="#2DD4BF" />
              <View>
                <Text style={styles.cardTitle}>Loading live trip...</Text>
                <Text style={styles.mutedText}>Connecting to your ride status</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Empty / Not Found State */}
        {(!params.rideId || (hasLoadedRide && !ride)) && !error ? (
          <FadeIn delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {params.rideId ? 'Ride not found' : 'No active ride'}
              </Text>
              <Text style={[styles.mutedText, { marginTop: 6 }]}>
                {params.rideId
                  ? 'This trip may have expired or been removed.'
                  : 'Request a women-only ride to track your captain live here.'}
              </Text>
              <SpringPressable
                onPress={() => router.push('/ride-request')}
                accessibilityRole="button"
                style={styles.primaryCta}
              >
                <Text style={styles.primaryCtaText}>Request a ride</Text>
              </SpringPressable>
            </View>
          </FadeIn>
        ) : null}

        {/* Active / Completed / Cancelled Ride Content */}
        {ride && meta ? (
          <>
            {/* Status & Route Card */}
            <FadeIn delay={80}>
              <View style={styles.card}>
                <View style={styles.statusHeader}>
                  {ride.status === 'SEARCHING' ? (
                    <Pulse>
                      <View style={[styles.statusDot, { backgroundColor: meta.tone }]} />
                    </Pulse>
                  ) : (
                    <View style={[styles.statusDot, { backgroundColor: meta.tone }]} />
                  )}
                  <Text accessibilityRole="header" style={styles.statusTitle}>
                    {meta.title}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: meta.softBg, borderColor: meta.tone }]}>
                    <Text style={[styles.statusPillText, { color: meta.tone }]}>
                      {ride.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.mutedText, { marginTop: 8 }]}>{meta.detail}</Text>

                {/* 4-Step Progress Bar */}
                {meta.stepIndex >= 0 ? (
                  <View style={styles.stepperContainer}>
                    {TRIP_STEPS.map((label, idx) => {
                      const done = idx < meta.stepIndex;
                      const current = idx === meta.stepIndex;
                      return (
                        <View key={label} style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepBar,
                              {
                                backgroundColor:
                                  done || current ? meta.tone : theme.color.borderDark
                              }
                            ]}
                          />
                          <Text
                            style={[
                              styles.stepLabel,
                              { color: done || current ? theme.color.white : MUTED_DARK }
                            ]}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.divider} />

                {/* Route Timeline */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={styles.routeRail}>
                      <View style={[styles.routeDot, { backgroundColor: '#2DD4BF' }]} />
                      <View style={styles.routeConnector} />
                    </View>
                    <View style={styles.routeTextWrap}>
                      <Text style={styles.microLabel}>PICKUP</Text>
                      <Text style={styles.routeAddress} numberOfLines={1}>
                        {ride.pickup}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.routeRow, { marginTop: 4 }]}>
                    <View style={styles.routeRail}>
                      <View style={[styles.routeDot, { backgroundColor: theme.color.orange }]} />
                    </View>
                    <View style={styles.routeTextWrap}>
                      <Text style={styles.microLabel}>DROPOFF</Text>
                      <Text style={styles.routeAddress} numberOfLines={1}>
                        {ride.dropoff}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Meta Footer */}
                <View style={styles.metaRow}>
                  <Users size={14} color={MUTED_DARK} />
                  <Text style={styles.metaText} numberOfLines={2}>
                    {ride.seats} {ride.seats === 1 ? 'seat' : 'seats'} · {ride.riderName}
                    {ride.note ? ` · ${ride.note}` : ''}
                  </Text>
                </View>
              </View>
            </FadeIn>

            {/* Captain Card */}
            {ride.captain ? (
              <PopIn delay={120}>
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.captainAvatar}>
                      <CarFront size={24} color="#2DD4BF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.captainName}>{ride.captain.displayName}</Text>
                        <CheckCircle2 size={15} color="#2DD4BF" />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Star size={13} color={theme.color.orange} fill={theme.color.orange} />
                        <Text style={[styles.mutedText, { fontSize: 13, marginLeft: 4 }]}>
                          {ride.captain.rating.toFixed(1)} · {ride.captain.vehicle}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.plateBadge}>
                      <Text style={styles.plateLabel}>PLATE</Text>
                      <Text style={styles.plateText}>{ride.captain.plate}</Text>
                    </View>
                  </View>
                </View>
              </PopIn>
            ) : null}

            {/* Quick Actions */}
            <FadeIn delay={160}>
              <View style={styles.actionsRow}>
                <SpringPressable
                  onPress={() =>
                    router.push({ pathname: '/ride-chat', params: { rideId: ride.rideId } })
                  }
                  accessibilityRole="button"
                  style={styles.actionTile}
                >
                  <MessageCircle size={21} color="#2DD4BF" />
                  <Text style={styles.actionLabel}>Ride chat</Text>
                </SpringPressable>

                <SpringPressable
                  onPress={() => router.push('/safety')}
                  accessibilityRole="button"
                  style={[styles.actionTile, styles.safetyTile]}
                >
                  <Siren size={21} color={DARK_DANGER} />
                  <Text style={[styles.actionLabel, { color: DARK_DANGER }]}>Safety SOS</Text>
                </SpringPressable>

                <SpringPressable
                  onPress={() => void handleShare()}
                  accessibilityRole="button"
                  style={styles.actionTile}
                >
                  <Share2 size={21} color="#2DD4BF" />
                  <Text style={styles.actionLabel}>Share trip</Text>
                </SpringPressable>
              </View>
            </FadeIn>

            {/* Cancel Button */}
            {canCancel ? (
              <SpringPressable
                onPress={handleCancel}
                disabled={cancelling}
                accessibilityRole="button"
                style={[styles.cancelButton, cancelling && { opacity: 0.6 }]}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color={DARK_DANGER} />
                ) : (
                  <Text style={styles.cancelText}>Cancel ride</Text>
                )}
              </SpringPressable>
            ) : null}

            {/* Terminal State CTA */}
            {ride.status === 'COMPLETED' || ride.status === 'CANCELLED' ? (
              <FadeIn delay={80}>
                <View style={styles.terminalCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ShieldCheck size={20} color="#2DD4BF" />
                    <Text style={styles.terminalText}>
                      {ride.status === 'COMPLETED'
                        ? 'Ride complete. Request another women-only ride anytime.'
                        : 'Ready to try again? Request a new women-only ride.'}
                    </Text>
                  </View>
                  <SpringPressable
                    onPress={() => router.push('/ride-request')}
                    accessibilityRole="button"
                    style={[styles.primaryCta, { marginTop: 14 }]}
                  >
                    <Text style={styles.primaryCtaText}>Book another ride</Text>
                  </SpringPressable>
                </View>
              </FadeIn>
            ) : null}
          </>
        ) : null}

        {/* Error Banner */}
        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <AlertCircle size={16} color={DARK_DANGER} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.surfaceDark
  },
  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 112
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconButton: {
    width: theme.touchTarget,
    height: theme.touchTarget,
    borderRadius: 16,
    backgroundColor: theme.color.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: theme.color.borderDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  womenOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: DARK_TEAL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  womenOnlyText: {
    color: '#2DD4BF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  mapWrapper: {
    marginTop: 16,
    position: 'relative'
  },
  mapOverlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(13, 13, 15, 0.86)',
    borderWidth: 1,
    borderColor: theme.color.borderDark,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  mapOverlayText: {
    color: theme.color.white,
    fontSize: 12,
    fontWeight: '700'
  },
  card: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: theme.color.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: theme.color.borderDark,
    padding: 18
  },
  cardTitle: {
    color: theme.color.white,
    fontSize: 19,
    fontWeight: '800'
  },
  mutedText: {
    color: MUTED_DARK,
    fontSize: 14,
    lineHeight: 20
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  statusTitle: {
    color: theme.color.white,
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 10,
    flex: 1
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  stepItem: {
    flex: 1
  },
  stepBar: {
    height: 4,
    borderRadius: 2
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6
  },
  divider: {
    height: 1,
    backgroundColor: theme.color.borderDark,
    marginVertical: 16
  },
  routeContainer: {
    gap: 2
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  routeRail: {
    width: 18,
    alignItems: 'center',
    paddingTop: 4
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  routeConnector: {
    width: 2,
    height: 28,
    backgroundColor: theme.color.borderDark,
    marginTop: 4
  },
  routeTextWrap: {
    flex: 1,
    marginLeft: 8
  },
  microLabel: {
    color: MUTED_DARK,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  routeAddress: {
    color: theme.color.white,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 52, 59, 0.6)'
  },
  metaText: {
    color: MUTED_DARK,
    fontSize: 13,
    flex: 1
  },
  captainAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: DARK_TEAL_SOFT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  captainName: {
    color: theme.color.white,
    fontSize: 17,
    fontWeight: '800'
  },
  plateBadge: {
    borderRadius: 12,
    backgroundColor: theme.color.surfaceDark,
    borderWidth: 1,
    borderColor: theme.color.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center'
  },
  plateLabel: {
    color: MUTED_DARK,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  plateText: {
    color: theme.color.white,
    fontWeight: '900',
    fontSize: 13,
    marginTop: 1
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  actionTile: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: theme.color.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: theme.color.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },
  safetyTile: {
    backgroundColor: DARK_DANGER_SOFT,
    borderColor: 'rgba(248, 113, 113, 0.35)'
  },
  actionLabel: {
    color: theme.color.white,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6
  },
  primaryCta: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: theme.color.orange,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryCtaText: {
    color: theme.color.white,
    fontWeight: '900',
    fontSize: 15
  },
  cancelButton: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    backgroundColor: DARK_DANGER_SOFT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    color: DARK_DANGER,
    fontSize: 14,
    fontWeight: '800'
  },
  terminalCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: theme.color.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: theme.color.borderDark,
    padding: 16
  },
  terminalText: {
    flex: 1,
    marginLeft: 10,
    color: theme.color.white,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19
  },
  errorBanner: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: DARK_DANGER_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  errorText: {
    color: DARK_DANGER,
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  }
});
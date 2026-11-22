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
  KeyRound,
  MessageCircle,
  Navigation,
  Share2,
  ShieldCheck,
  Siren,
  Star,
  Users
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RideStatus } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { FadeIn, PopIn, Pulse } from '../src/components/motion';
import { OpenStreetMap } from '../src/components/OpenStreetMap';
import { cancelRide, subscribeRide, type RideWithPin } from '../src/firebase/rides';
import { subscribeLiveLocation, type LiveFix } from '../src/firebase/liveLocation';
import { getActiveRideId } from '../src/firebase/activeRide';
import { useIdentity } from '../src/firebase/useIdentity';
import {
  fetchOsrmRoute,
  formatDistanceKm,
  formatEtaMinutes,
  type OsrmRouteResult
} from '../src/domain/osrm';

const TRIP_STEPS = ['Matched', 'En route', 'Arrived', 'In transit'] as const;

const STATUS_META: Record<
  RideStatus,
  {
    title: string;
    detail: string;
    tone: string;
    softBg: string;
    stepIndex: number;
  }
> = {
  SEARCHING: {
    title: 'Finding your captain',
    detail: 'Matching you with a verified woman captain nearby.',
    tone: theme.color.orange,
    softBg: theme.color.orangeSoft,
    stepIndex: 0
  },
  DRIVER_ACCEPTED: {
    title: 'Captain on the way',
    detail: 'Share your 4-digit Start PIN when your captain arrives.',
    tone: theme.color.teal,
    softBg: theme.color.tealSoft,
    stepIndex: 1
  },
  ARRIVED: {
    title: 'Captain has arrived',
    detail: 'Verify the vehicle plate and share your 4-digit Start PIN to begin.',
    tone: theme.color.teal,
    softBg: theme.color.tealSoft,
    stepIndex: 2
  },
  IN_TRANSIT: {
    title: 'On the way',
    detail: 'You are in transit. Share your live trip with a trusted contact.',
    tone: theme.color.teal,
    softBg: theme.color.tealSoft,
    stepIndex: 3
  },
  COMPLETED: {
    title: 'Ride completed',
    detail: 'Thanks for riding with HerWay. Stay safe.',
    tone: theme.color.teal,
    softBg: theme.color.tealSoft,
    stepIndex: 4
  },
  CANCELLED: {
    title: 'Ride cancelled',
    detail: 'This ride was cancelled. Request a new one whenever you are ready.',
    tone: theme.color.danger,
    softBg: 'rgba(248, 113, 113, 0.14)',
    stepIndex: -1
  }
};

export default function TripLiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const identity = useIdentity();

  const [resolvedRideId, setResolvedRideId] = useState<string>(params.rideId ?? '');
  const [ride, setRide] = useState<RideWithPin | null>(null);
  const [hasLoadedRide, setHasLoadedRide] = useState(false);
  const [liveFix, setLiveFix] = useState<LiveFix | null>(null);
  const [route, setRoute] = useState<OsrmRouteResult | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (params.rideId) {
      setResolvedRideId(params.rideId);
      return;
    }
    void getActiveRideId().then((storedId) => {
      if (cancelled) return;
      if (storedId) {
        setResolvedRideId(storedId);
      } else {
        setHasLoadedRide(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.rideId]);

  useEffect(() => {
    if (!resolvedRideId) {
      setHasLoadedRide(true);
      return;
    }
    setHasLoadedRide(false);
    setError('');
    const unsubscribe = subscribeRide(
      resolvedRideId,
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
  }, [resolvedRideId]);

  useEffect(() => {
    if (!resolvedRideId) return;
    return subscribeLiveLocation(resolvedRideId, setLiveFix, () => undefined);
  }, [resolvedRideId]);

  const originPoint = liveFix?.point ?? ride?.pickupPoint;
  const destPoint = ride?.dropoffPoint;

  useEffect(() => {
    if (!originPoint || !destPoint) return;
    if (originPoint.lat === 0 || destPoint.lat === 0) return;
    const controller = new AbortController();
    void fetchOsrmRoute(originPoint, destPoint, controller.signal)
      .then((res) => setRoute(res))
      .catch((routeErr: unknown) => {
        if (!(routeErr instanceof Error && routeErr.name === 'AbortError')) {
          setRoute(null);
        }
      });
    return () => controller.abort();
  }, [originPoint?.lat, originPoint?.lng, destPoint?.lat, destPoint?.lng]);

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
  const showStartPin = Boolean(
    ride && (ride.status === 'DRIVER_ACCEPTED' || ride.status === 'ARRIVED')
  );

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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <ShieldCheck size={14} color={theme.color.teal} />
            <Text style={styles.womenOnlyText}>WOMEN-ONLY RIDE</Text>
          </View>
        </View>

        <FadeIn delay={40}>
          <View style={styles.mapWrapper}>
            <OpenStreetMap
              height={230}
              latitude={liveFix?.point.lat ?? ride?.pickupPoint.lat}
              longitude={liveFix?.point.lng ?? ride?.pickupPoint.lng}
              pickup={ride?.pickupPoint}
              dropoff={ride?.dropoffPoint}
              routeCoordinates={route?.coordinates}
              label="Live trip map"
            />
            {isActive ? (
              <View style={styles.mapOverlayBadge}>
                {liveFix && !isGpsStale ? (
                  <Pulse>
                    <View style={[styles.liveDot, { backgroundColor: theme.color.teal }]} />
                  </Pulse>
                ) : (
                  <Navigation
                    size={12}
                    color={isGpsStale ? theme.color.orange : theme.color.muted}
                  />
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
            {route ? (
              <View style={styles.etaBadge}>
                <Text style={styles.etaBadgeText}>
                  {formatDistanceKm(route.distanceKm)} · ~{formatEtaMinutes(route.durationMin)}
                </Text>
              </View>
            ) : null}
          </View>
        </FadeIn>

        {resolvedRideId && !hasLoadedRide ? (
          <View style={styles.card}>
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.color.teal} />
              <View>
                <Text style={styles.cardTitle}>Loading live trip...</Text>
                <Text style={styles.mutedText}>Connecting to your ride status</Text>
              </View>
            </View>
          </View>
        ) : null}

        {(!resolvedRideId || (hasLoadedRide && !ride)) && !error ? (
          <FadeIn delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {resolvedRideId ? 'Ride not found' : 'No active ride'}
              </Text>
              <Text style={[styles.mutedText, styles.spacedSix]}>
                {resolvedRideId
                  ? 'This trip may have expired or been removed.'
                  : 'Request a women-only ride or open destination search to start a trip.'}
              </Text>
              <SpringPressable
                onPress={() => router.push('/destination')}
                accessibilityRole="button"
                style={styles.primaryCta}
              >
                <Text style={styles.primaryCtaText}>Choose destination</Text>
              </SpringPressable>
            </View>
          </FadeIn>
        ) : null}

        {ride && meta ? (
          <>
            {showStartPin ? (
              <PopIn delay={60}>
                <View style={styles.pinCard}>
                  <View style={styles.pinIconWrap}>
                    <KeyRound size={20} color={theme.color.teal} />
                  </View>
                  <View style={styles.pinCopy}>
                    <Text style={styles.pinEyebrow}>4-DIGIT START PIN</Text>
                    <Text style={styles.pinCode}>{ride.startPin}</Text>
                    <Text style={styles.pinHint}>
                      Share this PIN with your captain when you board.
                    </Text>
                  </View>
                </View>
              </PopIn>
            ) : null}

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
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: meta.softBg, borderColor: meta.tone }
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: meta.tone }]}>
                      {ride.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.mutedText, styles.spacedEight]}>{meta.detail}</Text>

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
                                  done || current ? meta.tone : theme.color.border
                              }
                            ]}
                          />
                          <Text
                            style={[
                              styles.stepLabel,
                              {
                                color:
                                  done || current ? theme.color.white : theme.color.muted
                              }
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

                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={styles.routeRail}>
                      <View style={[styles.routeDot, { backgroundColor: theme.color.teal }]} />
                      <View style={styles.routeConnector} />
                    </View>
                    <View style={styles.routeTextWrap}>
                      <Text style={styles.microLabel}>PICKUP</Text>
                      <Text style={styles.routeAddress} numberOfLines={1}>
                        {ride.pickup}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.routeRow, styles.spacedFour]}>
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

                <View style={styles.metaRow}>
                  <Users size={14} color={theme.color.muted} />
                  <Text style={styles.metaText} numberOfLines={2}>
                    {ride.seats} {ride.seats === 1 ? 'seat' : 'seats'} · {ride.riderName}
                    {ride.note ? ` · ${ride.note}` : ''}
                  </Text>
                </View>
              </View>
            </FadeIn>

            {ride.captain ? (
              <PopIn delay={120}>
                <View style={styles.card}>
                  <View style={styles.captainRow}>
                    <View style={styles.captainAvatar}>
                      <CarFront size={24} color={theme.color.teal} />
                    </View>
                    <View style={styles.captainInfo}>
                      <View style={styles.captainNameRow}>
                        <Text style={styles.captainName}>{ride.captain.displayName}</Text>
                        <CheckCircle2 size={15} color={theme.color.teal} />
                      </View>
                      <View style={styles.ratingRow}>
                        <Star
                          size={13}
                          color={theme.color.orange}
                          fill={theme.color.orange}
                        />
                        <Text style={styles.ratingText}>
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

            <FadeIn delay={160}>
              <View style={styles.actionsRow}>
                <SpringPressable
                  onPress={() =>
                    router.push({ pathname: '/ride-chat', params: { rideId: ride.rideId } })
                  }
                  accessibilityRole="button"
                  style={styles.actionTile}
                >
                  <MessageCircle size={21} color={theme.color.teal} />
                  <Text style={styles.actionLabel}>Ride chat</Text>
                </SpringPressable>

                <SpringPressable
                  onPress={() => router.push('/safety')}
                  accessibilityRole="button"
                  style={[styles.actionTile, styles.safetyTile]}
                >
                  <Siren size={21} color={theme.color.danger} />
                  <Text style={[styles.actionLabel, { color: theme.color.danger }]}>
                    Safety SOS
                  </Text>
                </SpringPressable>

                <SpringPressable
                  onPress={() => void handleShare()}
                  accessibilityRole="button"
                  style={styles.actionTile}
                >
                  <Share2 size={21} color={theme.color.teal} />
                  <Text style={styles.actionLabel}>Share trip</Text>
                </SpringPressable>
              </View>
            </FadeIn>

            {canCancel ? (
              <SpringPressable
                onPress={handleCancel}
                disabled={cancelling}
                accessibilityRole="button"
                style={[styles.cancelButton, cancelling && styles.disabledBtn]}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color={theme.color.danger} />
                ) : (
                  <Text style={styles.cancelText}>Cancel ride</Text>
                )}
              </SpringPressable>
            ) : null}

            {ride.status === 'COMPLETED' || ride.status === 'CANCELLED' ? (
              <FadeIn delay={80}>
                <View style={styles.terminalCard}>
                  <View style={styles.terminalRow}>
                    <ShieldCheck size={20} color={theme.color.teal} />
                    <Text style={styles.terminalText}>
                      {ride.status === 'COMPLETED'
                        ? 'Ride complete. Request another women-only ride anytime.'
                        : 'Ready to try again? Request a new women-only ride.'}
                    </Text>
                  </View>
                  <SpringPressable
                    onPress={() => router.push('/destination')}
                    accessibilityRole="button"
                    style={[styles.primaryCta, styles.spacedFourteen]}
                  >
                    <Text style={styles.primaryCtaText}>Book another ride</Text>
                  </SpringPressable>
                </View>
              </FadeIn>
            ) : null}
          </>
        ) : null}

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <AlertCircle size={16} color={theme.color.danger} />
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
    backgroundColor: theme.color.surface
  },
  scroll: {
    width: '100%'
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 16,
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
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  womenOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  womenOnlyText: {
    color: theme.color.teal,
    fontSize: 11,
    fontFamily: theme.font.bold,
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
    backgroundColor: 'rgba(13, 13, 15, 0.88)',
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.pill,
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
    fontFamily: theme.font.semibold
  },
  etaBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(13, 13, 15, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5
  },
  etaBadgeText: {
    color: theme.color.teal,
    fontSize: 11,
    fontFamily: theme.font.bold
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  card: {
    marginTop: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 16
  },
  pinCard: {
    marginTop: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.45)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  pinIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pinCopy: {
    flex: 1
  },
  pinEyebrow: {
    color: theme.color.teal,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.6
  },
  pinCode: {
    color: theme.color.white,
    fontSize: 26,
    fontFamily: theme.font.bold,
    letterSpacing: 6,
    marginTop: 2
  },
  pinHint: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  cardTitle: {
    color: theme.color.white,
    fontSize: 18,
    fontFamily: theme.font.bold
  },
  mutedText: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular
  },
  spacedFour: {
    marginTop: 4
  },
  spacedSix: {
    marginTop: 6
  },
  spacedEight: {
    marginTop: 8
  },
  spacedFourteen: {
    marginTop: 14
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  statusTitle: {
    color: theme.color.white,
    fontSize: 18,
    fontFamily: theme.font.bold,
    marginLeft: 10,
    flex: 1
  },
  statusPill: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: theme.font.bold
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
    fontFamily: theme.font.semibold,
    marginTop: 6
  },
  divider: {
    height: 1,
    backgroundColor: theme.color.border,
    marginVertical: 14
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
    backgroundColor: theme.color.border,
    marginTop: 4
  },
  routeTextWrap: {
    flex: 1,
    marginLeft: 8
  },
  microLabel: {
    color: theme.color.muted,
    fontSize: 10,
    fontFamily: theme.font.bold,
    letterSpacing: 0.8
  },
  routeAddress: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.semibold,
    marginTop: 2
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.color.border
  },
  metaText: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    flex: 1
  },
  captainRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  captainAvatar: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  captainInfo: {
    flex: 1,
    marginLeft: 12
  },
  captainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  captainName: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  ratingText: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginLeft: 4
  },
  plateBadge: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center'
  },
  plateLabel: {
    color: theme.color.muted,
    fontSize: 9,
    fontFamily: theme.font.bold,
    letterSpacing: 0.8
  },
  plateText: {
    color: theme.color.white,
    fontFamily: theme.font.bold,
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
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },
  safetyTile: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderColor: 'rgba(248, 113, 113, 0.35)'
  },
  actionLabel: {
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.bold,
    marginTop: 6
  },
  primaryCta: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryCtaText: {
    color: theme.color.textOnAccent,
    fontFamily: theme.font.bold,
    fontSize: 14
  },
  cancelButton: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledBtn: {
    opacity: 0.6
  },
  cancelText: {
    color: theme.color.danger,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  terminalCard: {
    marginTop: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 16
  },
  terminalRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  terminalText: {
    flex: 1,
    marginLeft: 10,
    color: theme.color.white,
    fontSize: 13,
    fontFamily: theme.font.semibold,
    lineHeight: 19
  },
  errorBanner: {
    marginTop: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  errorText: {
    color: theme.color.danger,
    fontSize: 13,
    fontFamily: theme.font.semibold,
    flex: 1
  }
});
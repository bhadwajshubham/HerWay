import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRight,
  CarFront,
  Clock3,
  ShieldCheck,
  Star,
  Zap
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { OpenStreetMap } from '../src/components/OpenStreetMap';
import { createRide } from '../src/firebase/rides';
import { useIdentity } from '../src/firebase/useIdentity';
import { sortRideOptions } from '../src/domain/rideOptions';
import {
  fetchOsrmRoute,
  formatDistanceKm,
  formatEtaMinutes,
  type OsrmRouteResult
} from '../src/domain/osrm';

export const rideOptions = [
  {
    id: 'calm',
    title: 'HerWay Calm',
    detail: 'Verified woman captain · 4 min pickup',
    price: 180,
    eta: 4,
    Icon: ShieldCheck
  },
  {
    id: 'comfort',
    title: 'HerWay Comfort',
    detail: 'Extra space · 6 min pickup',
    price: 245,
    eta: 6,
    Icon: Star
  },
  {
    id: 'quick',
    title: 'Quick ride',
    detail: 'Nearest captain · 8 min pickup',
    price: 150,
    eta: 8,
    Icon: Zap
  }
] as const;

export default function RideOptionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destination?: string;
    lat?: string;
    lon?: string;
    pickupMode?: string;
  }>();
  const [selected, setSelected] = useState<(typeof rideOptions)[number]['id']>('calm');
  const [sort, setSort] = useState<'recommended' | 'price' | 'arrival'>('recommended');
  const [route, setRoute] = useState<OsrmRouteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const identity = useIdentity();

  const latitude = Number(params.lat);
  const longitude = Number(params.lon);
  const destination = typeof params.destination === 'string' ? params.destination.trim() : '';
  const pickupLabel = params.pickupMode === 'current' ? 'Current location' : 'HITEC City Gate 2';
  const pickupPoint =
    params.pickupMode === 'current' && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : { lat: 17.4435, lng: 78.3772 };
  const dropoffPoint =
    Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0
      ? { lat: latitude, lng: longitude }
      : { lat: 17.2403, lng: 78.4294 };

  useEffect(() => {
    const controller = new AbortController();
    void fetchOsrmRoute(pickupPoint, dropoffPoint, controller.signal)
      .then((result) => setRoute(result))
      .catch((routeError: unknown) => {
        if (!(routeError instanceof Error && routeError.name === 'AbortError')) {
          setRoute(null);
        }
      });
    return () => controller.abort();
  }, [dropoffPoint.lat, dropoffPoint.lng, pickupPoint.lat, pickupPoint.lng]);

  const sortedOptions = sortRideOptions(rideOptions, sort);

  const onRequestRide = useCallback(async () => {
    if (busy) return;
    if (!identity.ready) {
      Alert.alert('Sign in required', 'Sign in with Google to request a women-only ride.');
      return;
    }
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
          pickup: pickupLabel,
          dropoff: destination,
          pickupPoint,
          dropoffPoint,
          rideCategory: selected === 'comfort' ? 'premium' : 'standard',
          seats: 1,
          womenOnly: true
        }
      );
      router.push({ pathname: '/trip-live', params: { rideId } });
    } catch (error) {
      Alert.alert(
        'Could not request ride',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }, [busy, destination, dropoffPoint, identity, pickupLabel, pickupPoint, router, selected]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="RIDE SEARCH" tone="teal" />

        <Text accessibilityRole="header" style={styles.title}>
          Ride options
        </Text>

        <View style={styles.pillBanner}>
          <Text style={styles.pillBannerText}>
            Women-only rides · Verified captains · 4-digit Start PIN
          </Text>
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripHeaderRow}>
            <Text style={styles.cardEyebrow}>YOUR TRIP</Text>
            {route ? (
              <Text style={styles.routeSummary}>
                {formatDistanceKm(route.distanceKm)} · ~{formatEtaMinutes(route.durationMin)}
              </Text>
            ) : null}
          </View>

          <View style={styles.routeBlock}>
            <View style={styles.railCol}>
              <View style={styles.pickupDot} />
              <View style={styles.railLine} />
              <View style={styles.dropoffDot} />
            </View>
            <View style={styles.routeLabelsCol}>
              <View>
                <Text style={styles.microLabel}>PICKUP</Text>
                <Text numberOfLines={2} style={styles.routeValue}>
                  {pickupLabel}
                </Text>
              </View>
              <View>
                <Text style={styles.microLabel}>DROP-OFF</Text>
                <Text numberOfLines={2} style={styles.routeValue}>
                  {destination || 'Destination selected'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.mapWrap}>
            <OpenStreetMap
              height={180}
              latitude={dropoffPoint.lat}
              longitude={dropoffPoint.lng}
              pickup={pickupPoint}
              dropoff={dropoffPoint}
              routeCoordinates={route?.coordinates}
              label="OpenStreetMap route preview"
            />
          </View>
        </View>

        <View style={styles.sortRow}>
          {(['recommended', 'price', 'arrival'] as const).map((value) => {
            const active = sort === value;
            return (
              <SpringPressable
                key={value}
                onPress={() => setSort(value)}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${value}`}
                style={[styles.sortChip, active && styles.sortChipActive]}
              >
                <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                  {value}
                </Text>
              </SpringPressable>
            );
          })}
        </View>

        <View style={styles.optionsList}>
          {sortedOptions.map((option) => {
            const active = selected === option.id;
            const Icon = option.Icon;
            return (
              <SpringPressable
                key={option.id}
                onPress={() => setSelected(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.optionCard,
                  active && styles.optionCardActive,
                  pressed && styles.pressed
                ]}
              >
                <View style={[styles.optionIconWrap, active && styles.optionIconWrapActive]}>
                  <Icon size={22} color={active ? theme.color.teal : theme.color.muted} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <View style={styles.optionDetailRow}>
                    <Clock3 size={13} color={theme.color.muted} />
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </View>
                </View>
                <Text style={styles.optionPrice}>₹{option.price}</Text>
              </SpringPressable>
            );
          })}
        </View>

        <SpringPressable
          onPress={() => void onRequestRide()}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryCta, (pressed || busy) && styles.pressed]}
        >
          <CarFront size={19} color={theme.color.textOnAccent} />
          <Text style={styles.primaryCtaText}>
            {busy ? 'Requesting...' : 'Request women-only ride'}
          </Text>
          <ArrowRight size={18} color={theme.color.textOnAccent} />
        </SpringPressable>

        <SpringPressable
          onPress={() => router.push('/schedule-ride')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
        >
          <Clock3 size={18} color={theme.color.teal} />
          <Text style={styles.secondaryCtaText}>Schedule a ride request</Text>
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
  pillBanner: {
    minHeight: 44,
    marginTop: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  pillBannerText: {
    color: theme.color.teal,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.bold
  },
  tripCard: {
    marginTop: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 16
  },
  tripHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  cardEyebrow: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.5
  },
  routeSummary: {
    color: theme.color.teal,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12
  },
  railCol: {
    alignItems: 'center',
    width: 14,
    paddingTop: 4
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.color.teal
  },
  railLine: {
    width: 2,
    height: 34,
    backgroundColor: theme.color.border,
    marginVertical: 4
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.color.orange
  },
  routeLabelsCol: {
    flex: 1,
    marginLeft: 12,
    gap: 14
  },
  microLabel: {
    color: theme.color.muted,
    fontSize: 10,
    fontFamily: theme.font.bold,
    letterSpacing: 0.5
  },
  routeValue: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.bold,
    marginTop: 2
  },
  mapWrap: {
    marginTop: 14
  },
  sortRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8
  },
  sortChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sortChipActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  sortChipText: {
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.bold,
    textTransform: 'capitalize'
  },
  sortChipTextActive: {
    color: theme.color.teal
  },
  optionsList: {
    marginTop: 12,
    gap: theme.layout.cardGap
  },
  optionCard: {
    minHeight: 88,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  optionCardActive: {
    borderColor: theme.color.teal
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionIconWrapActive: {
    backgroundColor: theme.color.tealSoft,
    borderColor: 'rgba(45, 212, 191, 0.35)'
  },
  optionCopy: {
    flex: 1,
    marginLeft: 12
  },
  optionTitle: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  optionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4
  },
  optionDetail: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular
  },
  optionPrice: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  primaryCta: {
    minHeight: 54,
    marginTop: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9
  },
  primaryCtaText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  secondaryCta: {
    minHeight: 50,
    marginTop: 10,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.teal,
    backgroundColor: theme.color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  secondaryCtaText: {
    color: theme.color.teal,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  pressed: {
    opacity: 0.88
  }
});
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { CalendarClock, Check, MapPin, Send, ShieldCheck } from 'lucide-react-native';
import {
  ApiErrorResponseSchema,
  ScheduledRideCancellationResponseSchema,
  ScheduledRideListResponseSchema,
  ScheduledRideRequestSchema,
  ScheduledRideResponseSchema,
  type ScheduledRideListResponse
} from '@herway/shared';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDateTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day) ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute)
  ) {
    return null;
  }
  return date.toISOString();
}

function createIdempotencyKey(): string {
  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function tomorrowAtNine(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return formatLocalDateTime(date);
}

export default function ScheduleRideScreen() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() =>
    formatLocalDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000))
  );
  const [locationUseConsent, setLocationUseConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [requestKey, setRequestKey] = useState(createIdempotencyKey);
  const [cancellationKeys, setCancellationKeys] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<ScheduledRideListResponse['requests']>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    setHistoryError('');
    try {
      const token = await readFirebaseIdToken();
      if (!token) {
        setRequests([]);
        setHistoryError('Sign in to view scheduled requests.');
        return;
      }
      const response = await fetch(`${getApiUrl()}/api/v1/scheduled-rides/requests`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error('request_list_unavailable');
      const parsed = ScheduledRideListResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error('invalid_request_list');
      setRequests(parsed.data.requests);
    } catch {
      setHistoryError('Scheduled requests could not be loaded. Check your connection and retry.');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const submitRequest = async () => {
    const isoScheduledAt = parseLocalDateTime(scheduledAt);
    if (!isoScheduledAt) {
      setStatus('Enter a valid local date and time, such as 2026-11-23 09:30.');
      return;
    }
    if (!locationUseConsent) {
      setStatus('Confirm that HerWay may use these addresses to prepare your request.');
      return;
    }

    const parsed = ScheduledRideRequestSchema.safeParse({
      pickup,
      dropoff,
      rideCategory: 'standard',
      scheduledAt: isoScheduledAt,
      locationUseConsent: true,
      womenCaptainOnly: true
    });
    if (!parsed.success) {
      setStatus('Enter a pickup and destination with enough detail to find the route.');
      return;
    }

    setSubmitting(true);
    setStatus('');
    try {
      const token = await readFirebaseIdToken();
      if (!token) {
        setStatus('Sign in before requesting a scheduled ride.');
        return;
      }
      const response = await fetch(`${getApiUrl()}/api/v1/scheduled-rides/requests`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'idempotency-key': requestKey
        },
        body: JSON.stringify(parsed.data)
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = ApiErrorResponseSchema.safeParse(body);
        if (
          error.success &&
          ['SCHEDULE_TOO_SOON', 'SCHEDULE_TOO_FAR'].includes(error.data.error.code)
        ) {
          setStatus('Choose a time at least 30 minutes from now and within the next 30 days.');
        } else if (error.success && error.data.error.code === 'ROUTE_DISTANCE_UNAVAILABLE') {
          setStatus(
            'Route pricing is temporarily unavailable. Your request was not submitted; please retry.'
          );
        } else if (error.success && error.data.error.code === 'AUTH_UNAVAILABLE') {
          setStatus('Booking services are unavailable right now. Your request was not submitted.');
        } else if (response.status === 503) {
          setStatus(
            'A required service is unavailable. Your request was not submitted; please retry later.'
          );
        } else {
          setStatus(
            'We could not submit the request. It is not booked; check your connection and retry.'
          );
        }
        return;
      }
      const result = ScheduledRideResponseSchema.safeParse(body);
      if (!result.success) {
        setStatus(
          'The server response was incomplete. Check your scheduled requests before retrying.'
        );
        return;
      }
      setStatus(
        `Request saved · ₹${result.data.estimatedFareInr.toFixed(2)} estimate. This app cannot confirm or dispatch the ride yet, so this is not a booking.`
      );
      setRequestKey(createIdempotencyKey());
      await loadRequests();
    } catch {
      setStatus('Network error. Your request was not confirmed; retry safely when connected.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    setSubmitting(true);
    setStatus('');
    const cancellationKey = cancellationKeys[requestId] ?? createIdempotencyKey();
    setCancellationKeys((current) => ({ ...current, [requestId]: cancellationKey }));
    try {
      const token = await readFirebaseIdToken();
      if (!token) {
        setStatus('Sign in again to cancel this request.');
        return;
      }
      const response = await fetch(
        `${getApiUrl()}/api/v1/scheduled-rides/requests/${encodeURIComponent(requestId)}/cancel`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'idempotency-key': cancellationKey
          }
        }
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(
          'We could not confirm cancellation. Refresh your scheduled requests before retrying.'
        );
        return;
      }
      const result = ScheduledRideCancellationResponseSchema.safeParse(body);
      if (!result.success) {
        setStatus('The cancellation response was incomplete. Refresh your scheduled requests.');
        return;
      }
      setCancellationKeys((current) => {
        const next = { ...current };
        delete next[requestId];
        return next;
      });
      setStatus('Your unconfirmed scheduled ride request was cancelled.');
      await loadRequests();
    } catch {
      setStatus(
        'Network error. Cancellation was not confirmed; check request status before retrying.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader badge="SCHEDULE RIDE" tone="teal" />

          <View style={styles.heroIconWrap}>
            <CalendarClock size={24} color={theme.color.teal} />
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Schedule a ride
          </Text>
          <Text style={styles.subtitle}>
            Request a pickup 30 minutes to 30 days ahead. This version can save your request, but it
            cannot confirm or dispatch a captain.
          </Text>

          <View style={styles.formBlock}>
            <Text style={styles.fieldLabel}>PICKUP ADDRESS</Text>
            <TextInput
              value={pickup}
              onChangeText={setPickup}
              placeholder="Building, street, area"
              accessibilityLabel="Pickup address"
              maxLength={240}
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor={theme.color.muted}
            />

            <Text style={[styles.fieldLabel, styles.spacedTop]}>DESTINATION</Text>
            <TextInput
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Where are you going?"
              accessibilityLabel="Destination address"
              maxLength={240}
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor={theme.color.muted}
            />

            <Text style={[styles.fieldLabel, styles.spacedTop]}>PICKUP DATE AND LOCAL TIME</Text>
            <TextInput
              value={scheduledAt}
              onChangeText={setScheduledAt}
              placeholder="YYYY-MM-DD HH:mm"
              accessibilityLabel="Pickup date and time"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={theme.color.muted}
            />

            <View style={styles.presetsRow}>
              <SpringPressable
                onPress={() =>
                  setScheduledAt(formatLocalDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)))
                }
                accessibilityRole="button"
                style={({ pressed }) => [styles.presetChip, pressed && styles.pressed]}
              >
                <Text style={styles.presetText}>In 2 hours</Text>
              </SpringPressable>
              <SpringPressable
                onPress={() => setScheduledAt(tomorrowAtNine())}
                accessibilityRole="button"
                style={({ pressed }) => [styles.presetChip, pressed && styles.pressed]}
              >
                <Text style={styles.presetText}>Tomorrow · 9 AM</Text>
              </SpringPressable>
            </View>

            <Text style={styles.helperNote}>
              Uses this device&apos;s local time. Road distance and fare estimate are calculated at
              ₹11/km.
            </Text>
          </View>

          <View style={styles.policyCard}>
            <ShieldCheck size={20} color={theme.color.teal} />
            <View style={styles.policyCopy}>
              <Text style={styles.policyTitle}>Women captain only</Text>
              <Text style={styles.policyDetail}>
                The request will not relax this requirement if no verified captain is available.
              </Text>
            </View>
          </View>

          <SpringPressable
            onPress={() => setLocationUseConsent((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: locationUseConsent }}
            style={styles.consentRow}
          >
            <View style={[styles.checkbox, locationUseConsent && styles.checkboxChecked]}>
              {locationUseConsent ? <Check size={15} color={theme.color.textOnAccent} /> : null}
            </View>
            <Text style={styles.consentText}>
              I agree to save these addresses with my request to calculate road distance and the
              ₹11/km estimate. This does not enable live location tracking.
            </Text>
          </SpringPressable>

          <SpringPressable
            onPress={() => void submitRequest()}
            disabled={submitting}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.submitBtn,
              submitting && styles.submitBtnDisabled,
              pressed && !submitting && styles.pressed
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.color.textOnAccent} />
            ) : (
              <Send size={17} color={theme.color.textOnAccent} />
            )}
            <Text style={styles.submitBtnText}>
              {submitting ? 'Submitting...' : 'Save scheduled request'}
            </Text>
          </SpringPressable>

          {status ? (
            <Text accessibilityRole="alert" style={styles.statusAlert}>
              {status}
            </Text>
          ) : null}

          <View style={styles.historySection}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Your scheduled requests
            </Text>

            {loadingRequests ? (
              <ActivityIndicator
                accessibilityLabel="Loading scheduled requests"
                color={theme.color.teal}
                style={styles.historyLoader}
              />
            ) : historyError ? (
              <View>
                <Text accessibilityRole="alert" style={styles.statusAlert}>
                  {historyError}
                </Text>
                <SpringPressable
                  onPress={() => void loadRequests()}
                  accessibilityRole="button"
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </SpringPressable>
              </View>
            ) : requests.length === 0 ? (
              <Text style={styles.emptyHistory}>No saved scheduled requests.</Text>
            ) : (
              requests.map((rideRequest) => (
                <View key={rideRequest.requestId} style={styles.requestCard}>
                  <Text style={styles.reqPickup}>{rideRequest.pickup}</Text>
                  <Text style={styles.reqDropoff}>to {rideRequest.dropoff}</Text>
                  <Text style={styles.reqMeta}>
                    {new Date(rideRequest.scheduledAt).toLocaleString()} · ₹
                    {rideRequest.estimatedFareInr.toFixed(2)} estimate
                  </Text>
                  <View style={styles.reqFooter}>
                    <Text
                      style={[
                        styles.reqBadge,
                        rideRequest.status === 'CANCELLED' && styles.reqBadgeCancelled
                      ]}
                    >
                      {rideRequest.status === 'CANCELLED'
                        ? 'CANCELLED'
                        : 'UNCONFIRMED REQUEST'}
                    </Text>
                    {rideRequest.status === 'AWAITING_OPERATOR_CONFIRMATION' ? (
                      <SpringPressable
                        onPress={() => void cancelRequest(rideRequest.requestId)}
                        disabled={submitting}
                        accessibilityRole="button"
                        style={styles.cancelReqBtn}
                      >
                        <Text style={styles.cancelReqText}>Cancel request</Text>
                      </SpringPressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.disclaimerRow}>
            <MapPin size={14} color={theme.color.muted} />
            <Text style={styles.disclaimerText}>
              No captain is contacted, live tracking starts, or payment is taken. A saved request is
              not a confirmed ride.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.surface
  },
  flex: {
    flex: 1
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
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  title: {
    color: theme.color.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: theme.font.bold,
    marginTop: 14
  },
  subtitle: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  formBlock: {
    marginTop: 20
  },
  fieldLabel: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.4
  },
  spacedTop: {
    marginTop: 16
  },
  input: {
    minHeight: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    color: theme.color.white,
    paddingHorizontal: 14,
    marginTop: 6,
    fontSize: 14,
    fontFamily: theme.font.regular
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  presetChip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    justifyContent: 'center'
  },
  presetText: {
    color: theme.color.teal,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  helperNote: {
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.regular,
    marginTop: 8
  },
  policyCard: {
    marginTop: 18,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 14,
    flexDirection: 'row',
    gap: 11
  },
  policyCopy: {
    flex: 1
  },
  policyTitle: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  policyDetail: {
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.regular,
    marginTop: 3
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 16,
    minHeight: 48
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.color.muted,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.teal
  },
  consentText: {
    flex: 1,
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.regular
  },
  submitBtn: {
    minHeight: 52,
    marginTop: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  submitBtnDisabled: {
    opacity: 0.65
  },
  submitBtnText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  statusAlert: {
    color: theme.color.orange,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.semibold,
    marginTop: 12
  },
  historySection: {
    marginTop: 26
  },
  sectionTitle: {
    color: theme.color.white,
    fontSize: 17,
    fontFamily: theme.font.bold
  },
  historyLoader: {
    marginTop: 14
  },
  retryBtn: {
    minHeight: 42,
    justifyContent: 'center',
    marginTop: 4
  },
  retryText: {
    color: theme.color.teal,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  emptyHistory: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular,
    marginTop: 8
  },
  requestCard: {
    marginTop: 10,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 14
  },
  reqPickup: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  reqDropoff: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  reqMeta: {
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.semibold,
    marginTop: 8
  },
  reqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  reqBadge: {
    color: theme.color.teal,
    fontSize: 11,
    fontFamily: theme.font.bold
  },
  reqBadgeCancelled: {
    color: theme.color.muted
  },
  cancelReqBtn: {
    minHeight: 40,
    paddingHorizontal: 10,
    justifyContent: 'center'
  },
  cancelReqText: {
    color: theme.color.danger,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16
  },
  disclaimerText: {
    color: theme.color.muted,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: theme.font.regular,
    flex: 1
  },
  pressed: {
    opacity: 0.88
  }
});
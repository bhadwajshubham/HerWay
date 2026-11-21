import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { ArrowLeft, CalendarClock, Check, MapPin, Send, ShieldCheck } from 'lucide-react-native';
import {
  ApiErrorResponseSchema,
  ScheduledRideCancellationResponseSchema,
  ScheduledRideListResponseSchema,
  ScheduledRideRequestSchema,
  ScheduledRideResponseSchema,
  type ScheduledRideListResponse
} from '@herway/shared';
import { useRouter } from 'expo-router';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { theme } from '../src/theme';
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
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
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
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => formatLocalDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)));
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
        if (error.success && ['SCHEDULE_TOO_SOON', 'SCHEDULE_TOO_FAR'].includes(error.data.error.code)) {
          setStatus('Choose a time at least 30 minutes from now and within the next 30 days.');
        } else if (error.success && error.data.error.code === 'ROUTE_DISTANCE_UNAVAILABLE') {
          setStatus('Route pricing is temporarily unavailable. Your request was not submitted; please retry.');
        } else if (error.success && error.data.error.code === 'AUTH_UNAVAILABLE') {
          setStatus('Booking services are unavailable right now. Your request was not submitted.');
        } else if (response.status === 503) {
          setStatus('A required service is unavailable. Your request was not submitted; please retry later.');
        } else {
          setStatus('We could not submit the request. It is not booked; check your connection and retry.');
        }
        return;
      }
      const result = ScheduledRideResponseSchema.safeParse(body);
      if (!result.success) {
        setStatus('The server response was incomplete. Check your scheduled requests before retrying.');
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
        setStatus('We could not confirm cancellation. Refresh your scheduled requests before retrying.');
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
      setStatus('Network error. Cancellation was not confirmed; check request status before retrying.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    minHeight: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#34343B',
    backgroundColor: theme.color.surfaceDarkRaised,
    color: theme.color.white,
    paddingHorizontal: 14,
    marginTop: 7
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <SpringPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: theme.color.surfaceDarkRaised, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={21} color={theme.color.white} />
          </SpringPressable>

          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: theme.color.tealSoft, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <CalendarClock size={26} color={theme.color.teal} />
          </View>
          <Text accessibilityRole="header" style={{ color: theme.color.white, fontSize: 30, fontWeight: '900', marginTop: 16 }}>
            Schedule a ride
          </Text>
          <Text style={{ color: '#A7A7AD', fontSize: 14, lineHeight: 21, marginTop: 8 }}>
          Request a pickup 30 minutes to 30 days ahead. This version can save your request, but it cannot confirm or dispatch a captain.
          </Text>

          <View style={{ marginTop: 22 }}>
            <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800' }}>PICKUP ADDRESS</Text>
            <TextInput value={pickup} onChangeText={setPickup} placeholder="Building, street, area" accessibilityLabel="Pickup address" maxLength={240} autoCapitalize="words" style={inputStyle} placeholderTextColor="#777780" />
            <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 17 }}>DESTINATION</Text>
            <TextInput value={dropoff} onChangeText={setDropoff} placeholder="Where are you going?" accessibilityLabel="Destination address" maxLength={240} autoCapitalize="words" style={inputStyle} placeholderTextColor="#777780" />
            <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 17 }}>PICKUP DATE AND LOCAL TIME</Text>
            <TextInput value={scheduledAt} onChangeText={setScheduledAt} placeholder="YYYY-MM-DD HH:mm" accessibilityLabel="Pickup date and time" autoCapitalize="none" style={inputStyle} placeholderTextColor="#777780" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 9 }}>
              <SpringPressable
                onPress={() => setScheduledAt(formatLocalDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)))}
                accessibilityRole="button"
                style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 13, backgroundColor: theme.color.surfaceDarkRaised, borderWidth: 1, borderColor: '#34343B', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '800' }}>In 2 hours</Text>
              </SpringPressable>
              <SpringPressable
                onPress={() => setScheduledAt(tomorrowAtNine())}
                accessibilityRole="button"
                style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 13, backgroundColor: theme.color.surfaceDarkRaised, borderWidth: 1, borderColor: '#34343B', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '800' }}>Tomorrow · 9 AM</Text>
              </SpringPressable>
            </View>
            <Text style={{ color: '#A7A7AD', fontSize: 12, lineHeight: 18, marginTop: 6 }}>
              Uses this device’s local time. We’ll calculate the road distance and estimate the fare at ₹11/km.
            </Text>
          </View>

          <View style={{ marginTop: 18, borderRadius: 18, backgroundColor: theme.color.surfaceDarkRaised, padding: 15, flexDirection: 'row', gap: 11 }}>
            <ShieldCheck size={21} color={theme.color.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.color.white, fontSize: 14, fontWeight: '800' }}>Women captain only</Text>
              <Text style={{ color: '#A7A7AD', fontSize: 12, lineHeight: 18, marginTop: 4 }}>The request will not relax this requirement if no verified captain is available.</Text>
            </View>
          </View>

          <SpringPressable
            onPress={() => setLocationUseConsent((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: locationUseConsent }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 17, minHeight: 50 }}
          >
            <View style={{ width: 25, height: 25, borderRadius: 7, borderWidth: 1, borderColor: locationUseConsent ? theme.color.teal : '#777780', backgroundColor: locationUseConsent ? theme.color.teal : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {locationUseConsent ? <Check size={16} color={theme.color.white} /> : null}
            </View>
            <Text style={{ flex: 1, color: '#C9D5DB', fontSize: 12, lineHeight: 18 }}>
              I agree to save these addresses with my request and send them securely to Google Routes to calculate road distance and the ₹11/km estimate. This does not enable live location tracking.
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() => void submitRequest()}
            disabled={submitting}
            accessibilityRole="button"
            style={{ minHeight: 56, marginTop: 14, borderRadius: 17, backgroundColor: submitting ? '#52666B' : theme.color.orange, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }}
          >
            {submitting ? <ActivityIndicator color={theme.color.white} /> : <Send size={18} color={theme.color.white} />}
            <Text style={{ color: theme.color.white, fontWeight: '900' }}>{submitting ? 'Submitting…' : 'Save scheduled request'}</Text>
          </SpringPressable>
          {status ? <Text accessibilityRole="alert" style={{ color: '#FFD0AA', lineHeight: 19, marginTop: 12 }}>{status}</Text> : null}
          <View style={{ marginTop: 26 }}>
            <Text accessibilityRole="header" style={{ color: theme.color.white, fontSize: 18, fontWeight: '900' }}>Your scheduled requests</Text>
            {loadingRequests ? (
              <ActivityIndicator accessibilityLabel="Loading scheduled requests" color={theme.color.teal} style={{ marginTop: 14 }} />
            ) : historyError ? (
              <View>
                <Text accessibilityRole="alert" style={{ color: '#FFD0AA', lineHeight: 19, marginTop: 8 }}>{historyError}</Text>
                <SpringPressable onPress={() => void loadRequests()} accessibilityRole="button" style={{ minHeight: 48, justifyContent: 'center' }}>
                  <Text style={{ color: theme.color.teal, fontWeight: '800' }}>Retry</Text>
                </SpringPressable>
              </View>
            ) : requests.length === 0 ? (
              <Text style={{ color: '#A7A7AD', fontSize: 13, lineHeight: 19, marginTop: 8 }}>No saved scheduled requests.</Text>
            ) : requests.map((rideRequest) => (
              <View key={rideRequest.requestId} style={{ marginTop: 10, borderRadius: 17, backgroundColor: theme.color.surfaceDarkRaised, borderWidth: 1, borderColor: '#34343B', padding: 14 }}>
                <Text style={{ color: theme.color.white, fontSize: 14, fontWeight: '800' }}>{rideRequest.pickup}</Text>
                <Text style={{ color: '#A7A7AD', fontSize: 12, marginTop: 3 }}>to {rideRequest.dropoff}</Text>
                <Text style={{ color: '#C9D5DB', fontSize: 12, marginTop: 8 }}>{new Date(rideRequest.scheduledAt).toLocaleString()} · ₹{rideRequest.estimatedFareInr.toFixed(2)} estimate</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ color: rideRequest.status === 'CANCELLED' ? '#A7A7AD' : theme.color.teal, fontSize: 11, fontWeight: '800' }}>
                    {rideRequest.status === 'CANCELLED' ? 'CANCELLED' : 'UNCONFIRMED REQUEST'}
                  </Text>
                  {rideRequest.status === 'AWAITING_OPERATOR_CONFIRMATION' ? (
                    <SpringPressable onPress={() => void cancelRequest(rideRequest.requestId)} disabled={submitting} accessibilityRole="button" style={{ minHeight: 48, paddingHorizontal: 10, justifyContent: 'center' }}>
                      <Text style={{ color: '#FFC5BD', fontSize: 12, fontWeight: '800' }}>Cancel request</Text>
                    </SpringPressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15 }}>
            <MapPin size={14} color={theme.color.muted} />
            <Text style={{ color: '#A7A7AD', fontSize: 11, flex: 1 }}>No captain is contacted, live tracking starts, or payment is taken. A saved request is not a confirmed ride.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

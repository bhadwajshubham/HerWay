import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Building2, RefreshCw, ShieldCheck, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { AvailableCirclesResponseSchema, MembershipRequestResponseSchema } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

interface Circle {
  circleId: string;
  name?: string;
  status?: string;
  membershipStatus?: string;
  role?: string;
}

function parseCirclesResponse(value: unknown): Circle[] | null {
  if (typeof value !== 'object' || value === null || !('circles' in value)) return null;
  const circles = value.circles;
  if (!Array.isArray(circles)) return null;
  const parsed: Circle[] = [];
  for (const circle of circles) {
    if (typeof circle !== 'object' || circle === null || !('circleId' in circle)) return null;
    if (typeof circle.circleId !== 'string') return null;
    parsed.push({
      circleId: circle.circleId,
      name: 'name' in circle && typeof circle.name === 'string' ? circle.name : undefined,
      status: 'status' in circle && typeof circle.status === 'string' ? circle.status : undefined,
      membershipStatus: 'membershipStatus' in circle && typeof circle.membershipStatus === 'string' ? circle.membershipStatus : undefined,
      role: 'role' in circle && typeof circle.role === 'string' ? circle.role : undefined
    });
  }
  return parsed;
}

function createIdempotencyKey(): string {
  return `circle-member-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function WorkCircleScreen() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
  const [discoverError, setDiscoverError] = useState('');
  const [requestingCircleId, setRequestingCircleId] = useState<string | null>(null);
  const [membershipKeys, setMembershipKeys] = useState<Record<string, string>>({});

  const loadCircles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await readFirebaseIdToken();
      if (!token) {
        setError('Sign in to view your organization requests.');
        return;
      }
      const response = await fetch(`${getApiUrl()}/api/v1/circles`, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Circle list could not be loaded.');
      const parsed = parseCirclesResponse(await response.json());
      if (parsed === null) throw new Error('The server returned an invalid response.');
      setCircles(parsed);
      const availableResponse = await fetch(`${getApiUrl()}/api/v1/circles/available`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const availableBody: unknown = await availableResponse.json().catch(() => null);
      if (availableResponse.status === 403) {
        setAvailableCircles([]);
        setDiscoverError('Verify your company email with Firebase to find an approved Work Circle.');
      } else if (!availableResponse.ok) {
        setDiscoverError('Approved Work Circles could not be loaded. Retry when connected.');
      } else {
        const available = AvailableCirclesResponseSchema.safeParse(availableBody);
        if (!available.success) {
          setDiscoverError('The server returned an invalid Work Circle list.');
        } else {
          setAvailableCircles(available.data.circles.map((circle) => ({
            circleId: circle.circleId,
            name: circle.name,
            status: 'approved',
            membershipStatus: circle.membershipStatus
          })));
          setDiscoverError('');
        }
      }
    } catch {
      setError('Could not load your Work Circles. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestMembership = async (circleId: string) => {
    setRequestingCircleId(circleId);
    setDiscoverError('');
    const key = membershipKeys[circleId] ?? createIdempotencyKey();
    setMembershipKeys((current) => ({ ...current, [circleId]: key }));
    try {
      const token = await readFirebaseIdToken();
      if (!token) {
        setDiscoverError('Sign in with your verified company email to request access.');
        return;
      }
      const response = await fetch(
        `${getApiUrl()}/api/v1/circles/${encodeURIComponent(circleId)}/membership-requests`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            'idempotency-key': key
          },
          body: JSON.stringify({})
        }
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setDiscoverError(response.status === 409
          ? 'A membership request already exists or your access is already approved.'
          : 'Membership could not be requested. Check your verified work email and retry.');
        return;
      }
      const parsed = MembershipRequestResponseSchema.safeParse(body);
      if (!parsed.success) {
        setDiscoverError('The server returned an invalid membership response.');
        return;
      }
      setMembershipKeys((current) => {
        const next = { ...current };
        delete next[circleId];
        return next;
      });
      await loadCircles();
    } catch {
      setDiscoverError('Network error. Your request was not confirmed; retry when connected.');
    } finally {
      setRequestingCircleId(null);
    }
  };

  useEffect(() => {
    void loadCircles();
  }, [loadCircles]);

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
      >
        <SpringPressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: theme.color.surfaceDarkRaised, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={theme.color.white} />
        </SpringPressable>
        <Text accessibilityRole="header" style={{ color: theme.color.white, fontSize: 30, fontWeight: '800', marginTop: 24 }}>Work Circles</Text>
        <Text style={{ color: '#A7A7AD', fontSize: 14, lineHeight: 21, marginTop: 8 }}>
          Request access to your workplace or campus. Membership stays private until an organization is verified.
        </Text>

        <View style={{ marginTop: 20, borderRadius: 22, backgroundColor: theme.color.surfaceDarkRaised, borderWidth: 1, borderColor: '#34343B', padding: 18 }}>
          <Building2 size={24} color={theme.color.teal} />
          <Text style={{ color: theme.color.white, fontSize: 17, fontWeight: '900', marginTop: 12 }}>Your organizations</Text>
          {loading ? (
            <ActivityIndicator accessibilityLabel="Loading organizations" color={theme.color.teal} style={{ marginTop: 18 }} />
          ) : error ? (
            <View>
              <Text accessibilityRole="alert" style={{ color: '#FFD0AA', marginTop: 10 }}>{error}</Text>
              <SpringPressable onPress={() => void loadCircles()} accessibilityRole="button" style={{ minHeight: 48, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={16} color={theme.color.teal} /><Text style={{ color: theme.color.teal, fontWeight: '800' }}>Retry</Text>
              </SpringPressable>
            </View>
          ) : circles.length === 0 ? (
            <Text style={{ color: '#A7A7AD', lineHeight: 20, marginTop: 8 }}>You haven’t requested access to an organization yet.</Text>
          ) : (
            circles.map((circle) => (
              <View key={circle.circleId} style={{ borderTopWidth: 1, borderTopColor: '#34343B', marginTop: 14, paddingTop: 14 }}>
                <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>{circle.name ?? 'Organization'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <ShieldCheck size={15} color={theme.color.teal} />
                  <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '700' }}>Request {circle.status ?? 'pending'} · membership {circle.membershipStatus ?? 'pending'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ marginTop: 14, borderRadius: 22, backgroundColor: theme.color.surfaceDarkRaised, borderWidth: 1, borderColor: '#34343B', padding: 18 }}>
          <Text style={{ color: theme.color.white, fontSize: 17, fontWeight: '900' }}>Your verified company Circle</Text>
          <Text style={{ color: '#A7A7AD', fontSize: 12, lineHeight: 18, marginTop: 5 }}>
            Only approved organizations matching your verified company email appear here. No coworker roster is shown.
          </Text>
          {discoverError ? <Text accessibilityRole="alert" style={{ color: '#FFD0AA', lineHeight: 18, marginTop: 10 }}>{discoverError}</Text> : null}
          {!discoverError && availableCircles.length === 0 ? (
            <Text style={{ color: '#A7A7AD', fontSize: 13, lineHeight: 19, marginTop: 10 }}>No approved Work Circle matches your verified email domain yet.</Text>
          ) : availableCircles.map((circle) => (
            <View key={circle.circleId} style={{ borderTopWidth: 1, borderTopColor: '#34343B', marginTop: 12, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.color.white, fontSize: 14, fontWeight: '800' }}>{circle.name ?? 'Organization'}</Text>
                {circle.membershipStatus === 'approved' ? (
                  <Text style={{ color: theme.color.teal, fontSize: 11, marginTop: 4 }}>Access approved · chat and shared rides are not enabled</Text>
                ) : circle.membershipStatus === 'pending' ? (
                  <Text style={{ color: '#D6C28C', fontSize: 11, marginTop: 4 }}>Membership request pending review</Text>
                ) : null}
              </View>
              {circle.membershipStatus === 'not_requested' || circle.membershipStatus === 'rejected' ? (
                <SpringPressable onPress={() => void requestMembership(circle.circleId)} disabled={requestingCircleId === circle.circleId} accessibilityRole="button" style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 13, backgroundColor: theme.color.teal, alignItems: 'center', justifyContent: 'center' }}>
                  {requestingCircleId === circle.circleId ? <ActivityIndicator color={theme.color.white} /> : <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800' }}>Request access</Text>}
                </SpringPressable>
              ) : null}
            </View>
          ))}
        </View>

        <SpringPressable onPress={() => router.push('/work-circle-invite')} accessibilityRole="button" style={{ minHeight: 56, marginTop: 14, borderRadius: 16, backgroundColor: theme.color.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <Users size={19} color={theme.color.white} /><Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '900' }}>Request organization access</Text>
        </SpringPressable>
        <Text style={{ color: '#A7A7AD', fontSize: 12, lineHeight: 18, marginTop: 14 }}>
          A pending request does not verify employment, reveal coworkers, or create a ride. Organization review is required before members can be shown.
        </Text>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

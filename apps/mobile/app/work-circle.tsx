import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, RefreshCw, ShieldCheck, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { AvailableCirclesResponseSchema, MembershipRequestResponseSchema } from '@herway/shared';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
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
      membershipStatus:
        'membershipStatus' in circle && typeof circle.membershipStatus === 'string'
          ? circle.membershipStatus
          : undefined,
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
          setAvailableCircles(
            available.data.circles.map((circle) => ({
              circleId: circle.circleId,
              name: circle.name,
              status: 'approved',
              membershipStatus: circle.membershipStatus
            }))
          );
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
        setDiscoverError(
          response.status === 409
            ? 'A membership request already exists or your access is already approved.'
            : 'Membership could not be requested. Check your verified work email and retry.'
        );
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
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="WORK CIRCLE" tone="teal" />

        <Text accessibilityRole="header" style={styles.title}>
          Work Circles
        </Text>
        <Text style={styles.subtitle}>
          Request access to your workplace or campus. Membership stays private until an organization
          is verified.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIconWrap}>
            <Building2 size={21} color={theme.color.teal} />
          </View>
          <Text style={styles.cardTitle}>Your organizations</Text>

          {loading ? (
            <ActivityIndicator
              accessibilityLabel="Loading organizations"
              color={theme.color.teal}
              style={styles.loader}
            />
          ) : error ? (
            <View>
              <Text accessibilityRole="alert" style={styles.warningText}>
                {error}
              </Text>
              <SpringPressable
                onPress={() => void loadCircles()}
                accessibilityRole="button"
                style={styles.retryBtn}
              >
                <RefreshCw size={15} color={theme.color.teal} />
                <Text style={styles.retryText}>Retry</Text>
              </SpringPressable>
            </View>
          ) : circles.length === 0 ? (
            <Text style={styles.emptyText}>
              You haven&apos;t requested access to an organization yet.
            </Text>
          ) : (
            circles.map((circle) => (
              <View key={circle.circleId} style={styles.rowDivider}>
                <Text style={styles.orgName}>{circle.name ?? 'Organization'}</Text>
                <View style={styles.statusRow}>
                  <ShieldCheck size={14} color={theme.color.teal} />
                  <Text style={styles.statusLabel}>
                    Request {circle.status ?? 'pending'} · membership{' '}
                    {circle.membershipStatus ?? 'pending'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitleNoMargin}>Your verified company Circle</Text>
          <Text style={styles.cardHelper}>
            Only approved organizations matching your verified company email appear here. No
            coworker roster is shown.
          </Text>

          {discoverError ? (
            <Text accessibilityRole="alert" style={styles.warningText}>
              {discoverError}
            </Text>
          ) : null}

          {!discoverError && availableCircles.length === 0 ? (
            <Text style={styles.emptyText}>
              No approved Work Circle matches your verified email domain yet.
            </Text>
          ) : (
            availableCircles.map((circle) => (
              <View key={circle.circleId} style={styles.discoverRow}>
                <View style={styles.discoverCopy}>
                  <Text style={styles.orgName}>{circle.name ?? 'Organization'}</Text>
                  {circle.membershipStatus === 'approved' ? (
                    <Text style={styles.approvedMeta}>
                      Access approved · chat and shared rides are not enabled
                    </Text>
                  ) : circle.membershipStatus === 'pending' ? (
                    <Text style={styles.pendingMeta}>Membership request pending review</Text>
                  ) : null}
                </View>
                {circle.membershipStatus === 'not_requested' ||
                circle.membershipStatus === 'rejected' ? (
                  <SpringPressable
                    onPress={() => void requestMembership(circle.circleId)}
                    disabled={requestingCircleId === circle.circleId}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.smallCta, pressed && styles.pressed]}
                  >
                    {requestingCircleId === circle.circleId ? (
                      <ActivityIndicator size="small" color={theme.color.textOnAccent} />
                    ) : (
                      <Text style={styles.smallCtaText}>Request access</Text>
                    )}
                  </SpringPressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        <SpringPressable
          onPress={() => router.push('/work-circle-invite')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
        >
          <Users size={18} color={theme.color.textOnAccent} />
          <Text style={styles.primaryCtaText}>Request organization access</Text>
        </SpringPressable>

        <Text style={styles.footnote}>
          A pending request does not verify employment, reveal coworkers, or create a ride.
          Organization review is required before members can be shown.
        </Text>
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
  subtitle: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  card: {
    marginTop: 16,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 16
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold,
    marginTop: 12
  },
  cardTitleNoMargin: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  cardHelper: {
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.regular,
    marginTop: 5
  },
  loader: {
    marginTop: 16
  },
  warningText: {
    color: theme.color.orange,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.semibold,
    marginTop: 10
  },
  retryBtn: {
    minHeight: 44,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8
  },
  retryText: {
    color: theme.color.teal,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  emptyText: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular,
    marginTop: 10
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    marginTop: 12,
    paddingTop: 12
  },
  orgName: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6
  },
  statusLabel: {
    color: theme.color.teal,
    fontSize: 12,
    fontFamily: theme.font.semibold,
    flex: 1
  },
  discoverRow: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  discoverCopy: {
    flex: 1
  },
  approvedMeta: {
    color: theme.color.teal,
    fontSize: 11,
    fontFamily: theme.font.semibold,
    marginTop: 4
  },
  pendingMeta: {
    color: theme.color.orange,
    fontSize: 11,
    fontFamily: theme.font.semibold,
    marginTop: 4
  },
  smallCta: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  smallCtaText: {
    color: theme.color.textOnAccent,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  primaryCta: {
    minHeight: 54,
    marginTop: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  },
  primaryCtaText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  footnote: {
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.regular,
    marginTop: 14
  },
  pressed: {
    opacity: 0.88
  }
});
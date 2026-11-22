import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  CheckCircle2,
  MapPin,
  PhoneCall,
  Share2,
  ShieldCheck,
  Siren,
  TriangleAlert
} from 'lucide-react-native';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { createSOSCase, resolveSOSCase } from '../src/firebase/sos';
import { useIdentity } from '../src/firebase/useIdentity';

export default function SafetyScreen() {
  const identity = useIdentity();
  const [sosNote, setSosNote] = useState('');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [sosStatus, setSosStatus] = useState('');
  const [checkInLabel, setCheckInLabel] = useState('Standby — tap to confirm you are safe');
  const [busy, setBusy] = useState(false);

  const raiseSOS = useCallback(async () => {
    if (busy) return;
    if (!identity.ready || !identity.uid) {
      setSosStatus('Sign in to record an SOS case.');
      return;
    }
    setBusy(true);
    try {
      const caseId = await createSOSCase({
        userId: identity.uid,
        note: sosNote.trim() || 'Manual SOS triggered from Safety screen'
      });
      setActiveCaseId(caseId);
      setSosStatus(`SOS recorded (Case ${caseId.slice(0, 6)}). Call 112 for immediate help.`);
    } catch {
      setSosStatus('Could not record the SOS online. Call 112 directly.');
    } finally {
      setBusy(false);
    }
  }, [busy, identity, sosNote]);

  const resolveActiveSOS = useCallback(async () => {
    if (!activeCaseId || busy) return;
    setBusy(true);
    try {
      await resolveSOSCase(activeCaseId);
      setActiveCaseId(null);
      setSosStatus('Active SOS case marked as resolved.');
    } catch {
      setSosStatus('Could not mark the SOS case resolved. Try again.');
    } finally {
      setBusy(false);
    }
  }, [activeCaseId, busy]);

  const confirmDial = (number: string, title: string, description: string) => {
    Alert.alert(title, description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: `Call ${number}`,
        style: 'destructive',
        onPress: () => {
          void Linking.openURL(`tel:${number}`).catch(() =>
            Alert.alert('Call unavailable', `Dial ${number} directly from your phone dialer.`)
          );
        }
      }
    ]);
  };

  const shareCheckIn = async (mode: 'trip' | 'circle') => {
    try {
      const message =
        mode === 'trip'
          ? 'HerWay Live Safety Check-In: Share your active trip screen with your trusted contact for real-time route details.'
          : 'HerWay Trusted Circle Check-In: I am commuting safely. Let us coordinate pickup and arrival updates.';
      await Share.share({
        title: mode === 'trip' ? 'HerWay live trip sharing' : 'HerWay trusted circle',
        message
      });
    } catch {
      Alert.alert('Share unavailable', 'Could not open the share sheet on this device.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="SAFETY" tone="orange" />

        <Text accessibilityRole="header" style={styles.title}>
          Safety & support
        </Text>

        <View style={styles.noticeCard}>
          <TriangleAlert size={19} color={theme.color.orange} />
          <Text style={styles.noticeText}>
            Raising an SOS creates an auditable safety case tied to your account. Always call 112
            for immediate emergency response.
          </Text>
        </View>

        <View accessibilityRole="alert" style={styles.sosCard}>
          <Text style={styles.sosTitle}>Raise SOS</Text>
          <Text style={styles.sosBody}>
            Records an active SOS case and lets you attach a quick landmark or situation note.
          </Text>

          <TextInput
            value={sosNote}
            onChangeText={setSosNote}
            maxLength={200}
            placeholder="Optional note (e.g. near Mindspace Gate 3, route off)"
            placeholderTextColor={theme.color.muted}
            accessibilityLabel="SOS situation note"
            style={styles.sosInput}
          />

          <SpringPressable
            onPress={() => void raiseSOS()}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.sosBtn, (pressed || busy) && styles.pressed]}
          >
            <Text style={styles.sosBtnText}>{busy ? 'Recording SOS...' : 'Raise SOS'}</Text>
          </SpringPressable>

          {activeCaseId ? (
            <SpringPressable
              onPress={() => void resolveActiveSOS()}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.resolveBtn, (pressed || busy) && styles.pressed]}
            >
              <CheckCircle2 size={16} color={theme.color.teal} />
              <Text style={styles.resolveBtnText}>Mark SOS resolved</Text>
            </SpringPressable>
          ) : null}

          {sosStatus ? (
            <Text accessibilityRole="alert" style={styles.sosStatus}>
              {sosStatus}
            </Text>
          ) : null}
        </View>

        <SpringPressable
          onPress={() =>
            confirmDial(
              '112',
              'Call 112 emergency services?',
              'This opens your phone dialer to call 112. Your SOS case history remains recorded.'
            )
          }
          accessibilityRole="button"
          style={({ pressed }) => [styles.callCard, pressed && styles.pressed]}
        >
          <View style={styles.callIconWrap}>
            <Siren size={24} color={theme.color.white} />
          </View>
          <View style={styles.callCopy}>
            <Text style={styles.callTitle}>Call 112</Text>
            <Text style={styles.callSubtitle}>
              National Emergency Response dialer (Police, Fire, Ambulance)
            </Text>
          </View>
        </SpringPressable>

        <Text style={styles.sectionTitle}>Safety tools</Text>

        <View style={styles.toolsList}>
          <SpringPressable
            onPress={() => void shareCheckIn('trip')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
          >
            <View style={styles.toolIconWrap}>
              <MapPin size={19} color={theme.color.teal} />
            </View>
            <View style={styles.toolCopy}>
              <Text style={styles.toolTitle}>Live trip sharing</Text>
              <Text style={styles.toolDetail}>Share trip details with a trusted contact</Text>
            </View>
          </SpringPressable>

          <SpringPressable
            onPress={() => void shareCheckIn('circle')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
          >
            <View style={styles.toolIconWrap}>
              <Share2 size={19} color={theme.color.teal} />
            </View>
            <View style={styles.toolCopy}>
              <Text style={styles.toolTitle}>Trusted circle</Text>
              <Text style={styles.toolDetail}>Send a quick check-in message</Text>
            </View>
          </SpringPressable>

          <SpringPressable
            onPress={() =>
              confirmDial(
                '181',
                'Call 181 Women Helpline?',
                'Opens your phone dialer for the 24x7 Women Helpline.'
              )
            }
            accessibilityRole="button"
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
          >
            <View style={styles.toolIconWrap}>
              <PhoneCall size={19} color={theme.color.teal} />
            </View>
            <View style={styles.toolCopy}>
              <Text style={styles.toolTitle}>Helpline cards (181 · 112)</Text>
              <Text style={styles.toolDetail}>Direct women & emergency helpline dialer</Text>
            </View>
          </SpringPressable>

          <SpringPressable
            onPress={() =>
              setCheckInLabel(
                `Checked in safe at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              )
            }
            accessibilityRole="button"
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
          >
            <View style={styles.toolIconWrap}>
              <ShieldCheck size={19} color={theme.color.teal} />
            </View>
            <View style={styles.toolCopy}>
              <Text style={styles.toolTitle}>Safety check</Text>
              <Text style={styles.toolDetail}>{checkInLabel}</Text>
            </View>
          </SpringPressable>
        </View>
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
  noticeCard: {
    marginTop: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  noticeText: {
    flex: 1,
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular
  },
  sosCard: {
    marginTop: theme.layout.cardGap,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 16
  },
  sosTitle: {
    color: theme.color.danger,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  sosBody: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  sosInput: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    color: theme.color.white,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: theme.font.regular
  },
  sosBtn: {
    marginTop: 12,
    minHeight: theme.touchTarget,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.danger,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sosBtnText: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  resolveBtn: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    backgroundColor: theme.color.tealSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  resolveBtnText: {
    color: theme.color.teal,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  sosStatus: {
    color: theme.color.white,
    fontSize: 13,
    fontFamily: theme.font.semibold,
    marginTop: 10
  },
  callCard: {
    minHeight: 80,
    marginTop: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12
  },
  callIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  callCopy: {
    flex: 1
  },
  callTitle: {
    color: theme.color.white,
    fontSize: 18,
    fontFamily: theme.font.bold
  },
  callSubtitle: {
    color: '#FFE4E4',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  sectionTitle: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold,
    marginTop: 22,
    marginBottom: 12
  },
  toolsList: {
    gap: theme.layout.cardGap
  },
  toolCard: {
    minHeight: 68,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12
  },
  toolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toolCopy: {
    flex: 1
  },
  toolTitle: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.semibold
  },
  toolDetail: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  pressed: {
    opacity: 0.88
  }
});
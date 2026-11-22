import { useState } from 'react';
import { Check, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  EmergencyContactRequestSchema,
  OnboardingCompleteRequestSchema,
  ProfileUpsertRequestSchema
} from '@herway/shared';
import { readFirebaseIdToken } from '../src/auth/session';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { getApiUrl } from '../src/config/apiUrl';

function makeIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('+91');
  const [consentGranted, setConsentGranted] = useState(false);
  const [status, setStatus] = useState('');
  const [pendingSubmission, setPendingSubmission] = useState<{
    fingerprint: string;
    key: string;
  } | null>(null);

  const completeSetup = async () => {
    setStatus('Saving...');
    let token: string | null = null;
    try {
      token = await readFirebaseIdToken();
    } catch {
      setStatus('Secure sign-in storage is unavailable. Retry after reopening the app.');
      return;
    }
    if (!token) {
      setStatus('Verify your phone before onboarding.');
      return;
    }

    const profile = ProfileUpsertRequestSchema.safeParse({
      displayName,
      preferredLanguage: language,
      accessibilityPreferences: []
    });
    if (!profile.success) {
      setStatus('Enter a profile name of at least 2 characters.');
      return;
    }

    if (!consentGranted) {
      setStatus('Grant the service consent to continue.');
      return;
    }

    const contact = EmergencyContactRequestSchema.safeParse({
      displayName: contactName,
      relationship: 'family',
      phoneE164: contactPhone,
      isPrimary: true
    });
    if (!contact.success) {
      setStatus('Add a trusted contact using an international phone number.');
      return;
    }

    const onboarding = OnboardingCompleteRequestSchema.safeParse({
      profile: profile.data,
      consent: {
        purpose: 'service_account',
        consentVersion: 'phase-1-v1',
        status: 'granted'
      },
      emergencyContact: contact.data
    });
    if (!onboarding.success) {
      setStatus('Review your profile, consent, and trusted contact details.');
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const fingerprint = JSON.stringify(onboarding.data);
      const idempotencyKey =
        pendingSubmission?.fingerprint === fingerprint
          ? pendingSubmission.key
          : makeIdempotencyKey('onboarding');
      setPendingSubmission({ fingerprint, key: idempotencyKey });
      const response = await fetch(`${apiUrl}/api/v1/onboarding/complete`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey
        },
        body: JSON.stringify(onboarding.data)
      });
      if (!response.ok) throw new Error('Onboarding could not be saved');
      setPendingSubmission(null);
      setStatus('Setup complete.');
      router.replace('/');
    } catch {
      setStatus('Network or server error. No setup step was confirmed. Please retry.');
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
        <View style={styles.topRow}>
          <View style={styles.shieldBadge}>
            <ShieldCheck size={20} color={theme.color.teal} strokeWidth={2.1} />
          </View>
          <View style={styles.progressCol}>
            <Text style={styles.stepLabel}>SETUP 1 OF 1</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          Make it yours.
        </Text>
        <Text style={styles.subtitle}>
          A few details help HerWay keep your ride personal and your trusted circle connected.
        </Text>

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Profile name"
          placeholderTextColor={theme.color.muted}
          accessibilityLabel="Profile name"
          style={styles.input}
        />

        <View style={styles.langRow}>
          {(['en', 'hi', 'te'] as const).map((item) => {
            const active = language === item;
            return (
              <SpringPressable
                key={item}
                onPress={() => setLanguage(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.langChip, active && styles.langChipActive]}
              >
                <Text style={[styles.langText, active && styles.langTextActive]}>
                  {item.toUpperCase()}
                </Text>
              </SpringPressable>
            );
          })}
        </View>

        <TextInput
          value={contactName}
          onChangeText={setContactName}
          placeholder="Trusted contact name"
          placeholderTextColor={theme.color.muted}
          accessibilityLabel="Trusted contact name"
          style={styles.input}
        />

        <TextInput
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          placeholder="+91xxxxxxxxxx"
          placeholderTextColor={theme.color.muted}
          accessibilityLabel="Trusted contact phone number"
          style={styles.input}
        />

        <SpringPressable
          onPress={() => setConsentGranted((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentGranted }}
          style={[styles.consentCard, consentGranted && styles.consentCardActive]}
        >
          <View style={[styles.checkbox, consentGranted && styles.checkboxChecked]}>
            {consentGranted ? <Check size={14} color={theme.color.textOnAccent} /> : null}
          </View>
          <Text style={styles.consentText}>
            I consent to account and service processing. I can revoke this consent later.
          </Text>
        </SpringPressable>

        <SpringPressable
          onPress={completeSetup}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
        >
          <Text style={styles.primaryCtaText}>Complete setup</Text>
          <ChevronRight size={18} color={theme.color.textOnAccent} strokeWidth={2.2} />
        </SpringPressable>

        {status ? (
          <Text accessibilityRole="alert" style={styles.statusText}>
            {status}
          </Text>
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
  content: {
    width: '100%',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 18,
    paddingBottom: 112,
    gap: theme.layout.cardGap
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  shieldBadge: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressCol: {
    alignItems: 'flex-end'
  },
  stepLabel: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.5
  },
  progressTrack: {
    width: 76,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.border,
    marginTop: 6,
    overflow: 'hidden'
  },
  progressFill: {
    width: '100%',
    height: 4,
    backgroundColor: theme.color.teal
  },
  title: {
    color: theme.color.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: theme.font.bold,
    letterSpacing: -0.5
  },
  subtitle: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginBottom: 4
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    backgroundColor: theme.color.surfaceRaised,
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.semibold
  },
  langRow: {
    flexDirection: 'row',
    gap: theme.layout.cardGap
  },
  langChip: {
    flex: 1,
    minHeight: theme.touchTarget,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceRaised
  },
  langChipActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  langText: {
    color: theme.color.white,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  langTextActive: {
    color: theme.color.teal
  },
  consentCard: {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 14,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  consentCardActive: {
    borderColor: theme.color.teal
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.color.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  checkboxChecked: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.teal
  },
  consentText: {
    flex: 1,
    color: theme.color.white,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular
  },
  primaryCta: {
    minHeight: 54,
    marginTop: 4,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  primaryCtaText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  statusText: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.regular,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.88
  }
});
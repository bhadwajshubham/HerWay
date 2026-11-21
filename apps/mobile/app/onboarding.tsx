import { useState } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 112,
          gap: 12
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              backgroundColor: theme.color.surfaceDark,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={21} color={theme.color.white} strokeWidth={2.1} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: "#A7A7AD", fontSize: 12, fontWeight: '800' }}>
              SETUP 1 OF 1
            </Text>
            <View
              style={{
                width: 72,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#D9E3E8',
                marginTop: 6,
                overflow: 'hidden'
              }}
            >
              <View style={{ width: 72, height: 4, backgroundColor: theme.color.teal }} />
            </View>
          </View>
        </View>
        <Text
          accessibilityRole="header"
          style={{
            color: theme.color.white,
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '800',
            letterSpacing: -0.8
          }}
        >
          Make it yours.
        </Text>
        <Text style={{ color: "#A7A7AD", fontSize: 14, lineHeight: 21, marginBottom: 6 }}>
          A few details help HerWay keep your ride personal and your trusted circle connected.
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Profile name"
          style={{
            minHeight: 56,
            borderWidth: 1,
            borderColor: '#34343B',
            borderRadius: 16,
            paddingHorizontal: 16,
            backgroundColor: theme.color.surfaceDarkRaised,
            color: theme.color.white
          }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['en', 'hi', 'te'] as const).map((item) => (
            <SpringPressable
              key={item}
              onPress={() => setLanguage(item)}
              accessibilityRole="button"
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: language === item ? theme.color.teal : '#34343B',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.color.surfaceDarkRaised
              }}
            >
              <Text style={{ color: theme.color.white, fontWeight: '700' }}>
                {item.toUpperCase()}
              </Text>
            </SpringPressable>
          ))}
        </View>
        <TextInput
          value={contactName}
          onChangeText={setContactName}
          placeholder="Trusted contact name"
          style={{
            minHeight: 56,
            borderWidth: 1,
            borderColor: '#34343B',
            borderRadius: 16,
            paddingHorizontal: 16,
            backgroundColor: theme.color.surfaceDarkRaised,
            color: theme.color.white
          }}
        />
        <TextInput
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          placeholder="+91xxxxxxxxxx"
          style={{
            minHeight: 56,
            borderWidth: 1,
            borderColor: '#34343B',
            borderRadius: 16,
            paddingHorizontal: 16,
            backgroundColor: theme.color.surfaceDarkRaised,
            color: theme.color.white
          }}
        />
        <SpringPressable
          onPress={() => setConsentGranted((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentGranted }}
          style={{
            minHeight: 56,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: consentGranted ? theme.color.teal : '#34343B',
            padding: 14,
            backgroundColor: theme.color.surfaceDarkRaised
          }}
        >
          <Text style={{ color: theme.color.white }}>
            I consent to account and service processing. I can revoke this consent later.
          </Text>
        </SpringPressable>
        <SpringPressable
          onPress={completeSetup}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: 16,
            backgroundColor: theme.color.orange,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 9,
            opacity: pressed ? 0.88 : 1
          })}
        >
          <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
            Complete setup
          </Text>
          <ChevronRight size={18} color={theme.color.white} strokeWidth={2} />
        </SpringPressable>
        <Text accessibilityRole="alert" style={{ color: theme.color.muted }}>
          {status}
        </Text>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

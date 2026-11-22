import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Phone, ShieldCheck } from 'lucide-react-native';
import {
  createFirebaseOtpProvider,
  createFirebaseGoogleProvider,
  classifyFirebaseAuthError,
  firebaseAuthFailureMessage
} from '../src/auth/firebaseClient';
import { PhoneE164Schema } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { saveFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';

function makeIdempotencyKey(): string {
  return `auth-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function AuthScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    confirm(code: string): Promise<{ user: { getIdToken(): Promise<string> } }>;
  } | null>(null);

  const sendOtp = async () => {
    if (busy) return;
    const phoneResult = PhoneE164Schema.safeParse(phone);
    if (!phoneResult.success) {
      setStatus(firebaseAuthFailureMessage('invalid'));
      return;
    }
    setStatus('');
    setBusy(true);
    try {
      const result = await createFirebaseOtpProvider('herway-recaptcha').sendOtp(phoneResult.data);
      setConfirmation(result);
      setStatus('Code sent securely');
    } catch (error) {
      setStatus(firebaseAuthFailureMessage(classifyFirebaseAuthError(error)));
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (busy) return;
    setStatus('');
    setBusy(true);
    try {
      const credential = await createFirebaseGoogleProvider().signIn();
      const idToken = await credential.user.getIdToken();
      await saveFirebaseIdToken(idToken);
      await verifyWithApi(idToken);
      setStatus('Verified. Continue setting up your profile.');
      router.replace('/onboarding');
    } catch (error) {
      setStatus(firebaseAuthFailureMessage(classifyFirebaseAuthError(error)));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation || busy) return;
    if (!/^[0-9]{6}$/.test(otp)) {
      setStatus(firebaseAuthFailureMessage('invalid'));
      return;
    }
    setStatus('Verifying...');
    setBusy(true);
    try {
      const credential = await confirmation.confirm(otp);
      const idToken = await credential.user.getIdToken();
      await saveFirebaseIdToken(idToken);
      await verifyWithApi(idToken);
      setStatus('Verified. Continue to onboarding.');
      router.replace('/onboarding');
    } catch (error) {
      setStatus(firebaseAuthFailureMessage(classifyFirebaseAuthError(error)));
    } finally {
      setBusy(false);
    }
  };

  const verifyWithApi = async (idToken: string): Promise<void> => {
    const response = await fetch(`${getApiUrl()}/api/v1/auth/firebase/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': makeIdempotencyKey() },
      body: JSON.stringify({ idToken })
    });
    if (response.status === 401 || response.status === 403) {
      throw Object.assign(new Error('Server denied the Firebase identity'), {
        code: 'auth/unauthorized-domain'
      });
    }
    if (!response.ok) {
      throw Object.assign(new Error('Server verification failed'), {
        code: 'auth/network-request-failed'
      });
    }
  };

  const isError =
    status.toLowerCase().includes('failed') ||
    status.toLowerCase().includes('could') ||
    status.toLowerCase().includes('invalid');

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="SIGN IN" tone="teal" />

        <View style={styles.heroBlock}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <ShieldCheck size={20} color={theme.color.textOnAccent} strokeWidth={2.2} />
            </View>
            <Text style={styles.brandName}>HerWay</Text>
          </View>

          <Text style={styles.eyebrow}>WELCOME</Text>
          <Text style={styles.heroTitle}>
            Move with{`\n`}confidence.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text accessibilityRole="header" style={styles.cardTitle}>
              Sign in securely
            </Text>
            <View style={styles.privatePill}>
              <Check size={13} color={theme.color.teal} strokeWidth={2.6} />
              <Text style={styles.privateText}>Private</Text>
            </View>
          </View>

          <SpringPressable
            onPress={signInWithGoogle}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.googleBtn,
              (pressed || busy) && styles.pressed,
              pressed && styles.googleBtnPressed
            ]}
          >
            <View style={styles.googleBadge}>
              <Text style={styles.googleBadgeText}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </SpringPressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or use mobile</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
          <View style={styles.phoneInputWrap}>
            <Phone size={18} color={theme.color.teal} strokeWidth={2} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.color.muted}
              accessibilityLabel="Phone number in international format"
              style={styles.phoneInput}
            />
          </View>

          {confirmation ? (
            <>
              <Text style={[styles.fieldLabel, styles.otpLabel]}>6-DIGIT CODE</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="••••••"
                placeholderTextColor={theme.color.muted}
                accessibilityLabel="One-time password"
                style={styles.otpInput}
              />
            </>
          ) : null}

          <SpringPressable
            onPress={confirmation ? verifyOtp : sendOtp}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryCta, (pressed || busy) && styles.pressed]}
          >
            <Text style={styles.primaryCtaText}>
              {busy
                ? 'Please wait...'
                : confirmation
                  ? 'Verify securely'
                  : 'Send secure code'}
            </Text>
            <ArrowRight size={18} color={theme.color.textOnAccent} strokeWidth={2.2} />
          </SpringPressable>

          {status ? (
            <Text
              accessibilityRole="alert"
              style={[styles.statusText, isError && styles.statusError]}
            >
              {status}
            </Text>
          ) : null}
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
    flexGrow: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 112
  },
  heroBlock: {
    marginTop: 22,
    marginBottom: 22
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandName: {
    color: theme.color.white,
    fontSize: 20,
    fontFamily: theme.font.bold,
    letterSpacing: -0.3
  },
  eyebrow: {
    color: theme.color.teal,
    fontSize: 12,
    fontFamily: theme.font.bold,
    letterSpacing: 1,
    marginTop: 22
  },
  heroTitle: {
    color: theme.color.white,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: theme.font.bold,
    letterSpacing: -0.6,
    marginTop: 6
  },
  card: {
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 18
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  cardTitle: {
    color: theme.color.white,
    fontSize: 21,
    fontFamily: theme.font.bold,
    letterSpacing: -0.3
  },
  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  privateText: {
    color: theme.color.teal,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  googleBtn: {
    height: 54,
    marginTop: 18,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  googleBtnPressed: {
    borderColor: theme.color.teal
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.color.muted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleBadgeText: {
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.bold
  },
  googleBtnText: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.semibold
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.color.border
  },
  dividerText: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.semibold
  },
  fieldLabel: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.5,
    marginBottom: 8
  },
  otpLabel: {
    marginTop: 16
  },
  phoneInputWrap: {
    height: 54,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.semibold
  },
  otpInput: {
    height: 54,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    color: theme.color.white,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
    fontFamily: theme.font.bold
  },
  primaryCta: {
    height: 54,
    marginTop: 16,
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
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular,
    marginTop: 12
  },
  statusError: {
    color: theme.color.danger,
    fontFamily: theme.font.semibold
  },
  pressed: {
    opacity: 0.88
  }
});
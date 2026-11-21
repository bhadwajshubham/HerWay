import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
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
    let response: Response;
    try {
      response = await fetch(`${getApiUrl()}/api/v1/auth/firebase/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': makeIdempotencyKey() },
        body: JSON.stringify({ idToken })
      });
    } catch (error) {
      throw error;
    }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <ScreenHeader badge="DEMO SIGN-IN" />
        </View>
        <View
          style={{
            minHeight: 238,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 28,
            justifyContent: 'space-between'
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                backgroundColor: theme.color.teal,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={21} color={theme.color.white} strokeWidth={2.1} />
            </View>
            <Text
              style={{
                color: theme.color.white,
                fontSize: 20,
                fontWeight: '800',
                letterSpacing: -0.4
              }}
            >
              HerWay
            </Text>
          </View>
          <View>
            <Text style={{ color: '#9CB0BE', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 }}>
              WELCOME
            </Text>
            <Text
              style={{
                color: theme.color.white,
                fontSize: 32,
                lineHeight: 38,
                fontWeight: '800',
                letterSpacing: -1,
                marginTop: 8
              }}
            >
              Move with{`\n`}confidence.
            </Text>
          </View>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: theme.color.surfaceDark,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 112
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text
              accessibilityRole="header"
              style={{
                color: theme.color.white,
                fontSize: 23,
                fontWeight: '800',
                letterSpacing: -0.5
              }}
            >
              Sign in securely
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                backgroundColor: '#E8F5F3',
                paddingHorizontal: 10,
                paddingVertical: 7
              }}
            >
              <Check size={14} color={theme.color.teal} strokeWidth={2.5} />
              <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '800' }}>
                Private
              </Text>
            </View>
          </View>

          <SpringPressable
            onPress={signInWithGoogle}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 56,
              marginTop: 22,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: pressed ? theme.color.teal : '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            })}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: '#AEBCC5',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ color: theme.color.white, fontWeight: '900', fontSize: 12 }}>G</Text>
            </View>
            <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
              Continue with Google
            </Text>
          </SpringPressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#D9E3E8' }} />
            <Text style={{ color: '#78909C', fontSize: 12, fontWeight: '700' }}>or use mobile</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#D9E3E8' }} />
          </View>

          <Text
            style={{ color: "#A7A7AD", fontSize: 12, fontWeight: '800', marginBottom: 8 }}
          >
            MOBILE NUMBER
          </Text>
          <View
            style={{
              height: 56,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14
            }}
          >
            <Phone size={18} color={theme.color.teal} strokeWidth={2} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              accessibilityLabel="Phone number in international format"
              style={{
                flex: 1,
                height: '100%',
                color: theme.color.white,
                fontSize: 16,
                fontWeight: '700',
                paddingHorizontal: 10
              }}
            />
          </View>

          {confirmation ? (
            <>
              <Text
                style={{
                  color: "#A7A7AD",
                  fontSize: 12,
                  fontWeight: '800',
                  marginBottom: 8,
                  marginTop: 16
                }}
              >
                6-DIGIT CODE
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="••••••"
                accessibilityLabel="One-time password"
                style={{
                  height: 56,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#34343B',
                  backgroundColor: theme.color.surfaceDarkRaised,
                  color: theme.color.white,
                  textAlign: 'center',
                  fontSize: 20,
                  letterSpacing: 8,
                  fontWeight: '800'
                }}
              />
            </>
          ) : null}

          <SpringPressable
            onPress={confirmation ? verifyOtp : sendOtp}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 56,
              marginTop: 16,
              borderRadius: 16,
              backgroundColor: theme.color.orange,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              opacity: pressed ? 0.88 : 1
            })}
          >
            <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
              {confirmation ? 'Verify securely' : 'Send secure code'}
            </Text>
            <ArrowRight size={18} color={theme.color.white} strokeWidth={2} />
          </SpringPressable>

          {status ? (
            <Text
              accessibilityRole="alert"
              style={{
                color:
                  status.includes('failed') || status.includes('could')
                    ? theme.color.danger
                    : theme.color.muted,
                textAlign: 'center',
                fontSize: 13,
                lineHeight: 19,
                marginTop: 12
              }}
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

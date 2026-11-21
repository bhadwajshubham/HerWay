import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Building2, Send, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CircleCreateRequestSchema } from '@herway/shared';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

function idempotencyKey(): string {
  return `circle-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function WorkCircleInviteScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestKey, setRequestKey] = useState(idempotencyKey());

  const submit = async () => {
    const parsed = CircleCreateRequestSchema.safeParse({ name, organizationDomain: domain });
    if (!parsed.success) {
      setStatus('Enter an organization name and a valid email domain, such as example.org.');
      return;
    }
    setSubmitting(true);
    setStatus('');
    try {
      const token = await readFirebaseIdToken();
      if (!token) {
        setStatus('Sign in before requesting organization access.');
        return;
      }
      const response = await fetch(`${getApiUrl()}/api/v1/circles`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'idempotency-key': requestKey
        },
        body: JSON.stringify(parsed.data)
      });
      if (!response.ok) {
        setStatus(response.status === 409
          ? 'This request is already being processed. Retry in a moment.'
          : 'We could not submit the request. Check your connection and retry.');
        return;
      }
      setRequestKey(idempotencyKey());
      router.replace('/work-circle');
    } catch {
      setStatus('Network error. Your request was not confirmed; retry safely.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.color.lavender, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
          <Building2 size={25} color={theme.color.white} />
        </View>
        <Text accessibilityRole="header" style={{ color: theme.color.white, fontSize: 29, fontWeight: '900', marginTop: 16 }}>Request organization access</Text>
        <Text style={{ color: '#A7A7AD', fontSize: 14, lineHeight: 21, marginTop: 8 }}>
          Submit your workplace or campus for review. HerWay will not show coworkers or coordinate rides until membership verification is implemented and approved.
        </Text>
        <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 22, marginBottom: 7 }}>ORGANIZATION NAME</Text>
        <TextInput value={name} onChangeText={(value) => { setName(value); setRequestKey(idempotencyKey()); }} placeholder="Company or campus" accessibilityLabel="Organization name" maxLength={120} style={{ minHeight: 56, borderRadius: 15, borderWidth: 1, borderColor: '#34343B', backgroundColor: theme.color.surfaceDarkRaised, color: theme.color.white, paddingHorizontal: 15 }} />
        <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 16, marginBottom: 7 }}>ORGANIZATION EMAIL DOMAIN</Text>
        <TextInput value={domain} onChangeText={(value) => { setDomain(value); setRequestKey(idempotencyKey()); }} placeholder="example.org" accessibilityLabel="Organization email domain" autoCapitalize="none" keyboardType="email-address" maxLength={254} style={{ minHeight: 56, borderRadius: 15, borderWidth: 1, borderColor: '#34343B', backgroundColor: theme.color.surfaceDarkRaised, color: theme.color.white, paddingHorizontal: 15 }} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, borderRadius: 16, backgroundColor: theme.color.surfaceDarkRaised, padding: 14 }}>
          <ShieldCheck size={20} color={theme.color.teal} />
          <Text style={{ flex: 1, color: '#C9D5DB', fontSize: 12, lineHeight: 18 }}>A request is not proof of employment or campus membership. Your organization must be reviewed before member access is approved.</Text>
        </View>
        <SpringPressable onPress={() => void submit()} disabled={submitting} accessibilityRole="button" style={{ minHeight: 56, marginTop: 18, borderRadius: 16, backgroundColor: submitting ? '#52666B' : theme.color.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          {submitting ? <ActivityIndicator color={theme.color.white} /> : <Send size={18} color={theme.color.white} />}
          <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '900' }}>{submitting ? 'Submitting…' : 'Submit for review'}</Text>
        </SpringPressable>
        {status ? <Text accessibilityRole="alert" style={{ color: '#FFD0AA', lineHeight: 19, marginTop: 12 }}>{status}</Text> : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

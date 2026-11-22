import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { ArrowLeft, Send, ShieldCheck } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RideChatMessage } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { FadeIn } from '../src/components/motion';
import { sendRideMessage, subscribeRideMessages } from '../src/firebase/rides';
import { useIdentity } from '../src/firebase/useIdentity';

export default function RideChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const identity = useIdentity();
  const [messages, setMessages] = useState<RideChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!params.rideId) return;
    return subscribeRideMessages(
      params.rideId,
      setMessages,
      (error) => setStatus(error.message)
    );
  }, [params.rideId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const onSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !params.rideId || !identity.ready) {
      setStatus('Sign in to send a message.');
      return;
    }
    setDraft('');
    setStatus('');
    try {
      await sendRideMessage(
        params.rideId,
        { uid: identity.uid, displayName: identity.displayName },
        body
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send the message.');
    }
  }, [draft, identity, params.rideId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderColor: '#34343B'
          }}
        >
          <SpringPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={22} color={theme.color.white} />
          </SpringPressable>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ color: theme.color.white, fontSize: 18, fontWeight: '900' }}>Ride chat</Text>
            <Text style={{ color: '#A7A7AD', fontSize: 12 }}>Only you and your captain</Text>
          </View>
          <ShieldCheck size={20} color={theme.color.teal} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 10 }}
        >
          {messages.length === 0 ? (
            <Text style={{ color: '#A7A7AD', textAlign: 'center', marginTop: 40 }}>
              Say hello to your captain. Messages are visible only to this ride.
            </Text>
          ) : null}
          {messages.map((message, index) => {
            const mine = message.senderUid === identity.uid;
            return (
              <FadeIn key={message.messageId} delay={Math.min(index, 6) * 30}>
                <View
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    borderRadius: 18,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: mine ? theme.color.teal : theme.color.surfaceDarkRaised,
                    borderWidth: mine ? 0 : 1,
                    borderColor: '#34343B'
                  }}
                >
                  <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800' }}>
                    {mine ? 'You' : message.senderName}
                  </Text>
                  <Text style={{ color: theme.color.white, fontSize: 15, marginTop: 3 }}>
                    {message.body}
                  </Text>
                </View>
              </FadeIn>
            );
          })}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 16,
            borderTopWidth: 1,
            borderColor: '#34343B'
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message your captain"
            placeholderTextColor="#6C6C75"
            onSubmitEditing={() => void onSend()}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              color: theme.color.white,
              paddingHorizontal: 14
            }}
          />
          <SpringPressable
            onPress={() => void onSend()}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: theme.color.orange,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={20} color={theme.color.white} />
          </SpringPressable>
        </View>
        {status ? (
          <Text accessibilityRole="alert" style={{ color: theme.color.danger, paddingHorizontal: 16 }}>
            {status}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

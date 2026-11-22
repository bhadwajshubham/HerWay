import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowBigUp, MessageCircle, ShieldCheck } from 'lucide-react-native';
import { CommunityPostCreateSchema, type CommunityPost } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { FadeIn } from '../src/components/motion';
import { createCommunityPost, subscribeCommunityPosts, upvotePost } from '../src/firebase/community';
import { useIdentity } from '../src/firebase/useIdentity';

const CATEGORIES: { id: CommunityPost['category']; label: string }[] = [
  { id: 'share_request', label: 'Share request' },
  { id: 'route_tip', label: 'Route tip' },
  { id: 'safety_note', label: 'Safety note' },
  { id: 'general', label: 'General' }
];

export default function CommunityScreen() {
  const identity = useIdentity();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [nickname, setNickname] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CommunityPost['category']>('general');
  const [status, setStatus] = useState('');

  useEffect(() => subscribeCommunityPosts(setPosts, (error) => setStatus(error.message)), []);

  const onPost = useCallback(async () => {
    if (!identity.ready) {
      setStatus('Sign in with Google to post.');
      return;
    }
    const parsed = CommunityPostCreateSchema.safeParse({ nickname: nickname.trim(), category, body: body.trim() });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? 'Check your post.');
      return;
    }
    setStatus('');
    try {
      await createCommunityPost(identity.uid, parsed.data);
      setBody('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not post.');
    }
  }, [body, category, identity, nickname]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: 20,
          paddingBottom: 112
        }}
      >
        <ScreenHeader badge="COMMUNITY" tone="teal" />
        <FadeIn delay={40}>
          <Text style={{ color: theme.color.white, fontSize: 30, fontWeight: '900', marginTop: 18 }}>
            HerWay Circle
          </Text>
          <Text style={{ color: '#A7A7AD', fontSize: 14, marginTop: 6 }}>
            Local ride requests, route tips and safety notes from women near you.
          </Text>
        </FadeIn>

        <FadeIn delay={80}>
          <View
            style={{
              marginTop: 18,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              padding: 16
            }}
          >
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Your nickname"
              placeholderTextColor="#6C6C75"
              accessibilityLabel="Nickname"
              style={{ color: theme.color.white, minHeight: 44 }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {CATEGORIES.map((item) => (
                <SpringPressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: category === item.id }}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: category === item.id ? theme.color.teal : '#34343B',
                    backgroundColor: category === item.id ? theme.color.tealSoft : 'transparent',
                    paddingHorizontal: 12,
                    paddingVertical: 7
                  }}
                >
                  <Text
                    style={{
                      color: category === item.id ? theme.color.teal : '#BBD0DA',
                      fontSize: 12,
                      fontWeight: '800'
                    }}
                  >
                    {item.label}
                  </Text>
                </SpringPressable>
              ))}
            </View>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share a ride request, tip or note…"
              placeholderTextColor="#6C6C75"
              accessibilityLabel="Post body"
              multiline
              style={{ color: theme.color.white, minHeight: 72, marginTop: 8 }}
            />
            <SpringPressable
              onPress={() => void onPost()}
              accessibilityRole="button"
              style={{
                marginTop: 8,
                minHeight: 48,
                borderRadius: 14,
                backgroundColor: theme.color.orange,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ color: theme.color.white, fontWeight: '900' }}>Post to Circle</Text>
            </SpringPressable>
          </View>
        </FadeIn>

        <View style={{ marginTop: 20, gap: 12 }}>
          {posts.length === 0 ? (
            <Text style={{ color: '#A7A7AD', textAlign: 'center', marginTop: 16 }}>
              No posts yet. Start the conversation.
            </Text>
          ) : null}
          {posts.map((post, index) => (
            <FadeIn key={post.postId} delay={Math.min(index, 8) * 40}>
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#34343B',
                  backgroundColor: theme.color.surfaceDarkRaised,
                  padding: 16
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ShieldCheck size={16} color={theme.color.teal} />
                  <Text style={{ color: theme.color.white, fontWeight: '900', marginLeft: 6 }}>
                    {post.nickname}
                  </Text>
                  <View
                    style={{
                      marginLeft: 'auto',
                      borderRadius: 999,
                      backgroundColor: theme.color.lavender,
                      paddingHorizontal: 8,
                      paddingVertical: 3
                    }}
                  >
                    <Text style={{ color: theme.color.ink, fontSize: 10, fontWeight: '800' }}>
                      {post.category.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#DCE7EC', fontSize: 15, marginTop: 10, lineHeight: 21 }}>
                  {post.body}
                </Text>
                <SpringPressable
                  onPress={() => void upvotePost(post.postId).catch(() => setStatus('Could not upvote.'))}
                  accessibilityRole="button"
                  accessibilityLabel="Upvote post"
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}
                >
                  <ArrowBigUp size={18} color={theme.color.orange} />
                  <Text style={{ color: '#BBD0DA', fontSize: 13 }}>{post.upvotes}</Text>
                  <MessageCircle size={15} color="#6C6C75" />
                </SpringPressable>
              </View>
            </FadeIn>
          ))}
        </View>

        {status ? (
          <Text accessibilityRole="alert" style={{ color: theme.color.danger, marginTop: 14 }}>
            {status}
          </Text>
        ) : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

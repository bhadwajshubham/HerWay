import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowBigUp, MessageCircle, ShieldCheck } from 'lucide-react-native';
import { CommunityPostCreateSchema, type CommunityPost } from '@herway/shared';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
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
  const [posting, setPosting] = useState(false);

  useEffect(() => subscribeCommunityPosts(setPosts, (error) => setStatus(error.message)), []);

  const onPost = useCallback(async () => {
    if (posting) return;
    if (!identity.ready || !identity.uid) {
      setStatus('Sign in to post to HerWay Circle.');
      return;
    }
    const parsed = CommunityPostCreateSchema.safeParse({
      nickname: nickname.trim(),
      category,
      body: body.trim()
    });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? 'Check your post details.');
      return;
    }
    setPosting(true);
    setStatus('');
    try {
      await createCommunityPost(identity.uid, parsed.data);
      setBody('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not publish post.');
    } finally {
      setPosting(false);
    }
  }, [body, category, identity, nickname, posting]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="COMMUNITY" tone="teal" />

        <FadeIn delay={40}>
          <Text accessibilityRole="header" style={styles.title}>
            HerWay Circle
          </Text>
          <Text style={styles.subtitle}>
            Corridor updates, shift-pool notes, and safety tips from women in your network.
          </Text>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.composerCard}>
            <Text style={styles.cardEyebrow}>POST TO CIRCLE</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Your nickname (e.g. Ananya_HITEC)"
              placeholderTextColor={theme.color.muted}
              accessibilityLabel="Nickname"
              style={styles.nickInput}
            />

            <View style={styles.categoryRow}>
              {CATEGORIES.map((item) => {
                const selected = category === item.id;
                return (
                  <SpringPressable
                    key={item.id}
                    onPress={() => setCategory(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <Text
                      style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}
                    >
                      {item.label}
                    </Text>
                  </SpringPressable>
                );
              })}
            </View>

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share a commute shift tip, corridor note, or pool request..."
              placeholderTextColor={theme.color.muted}
              accessibilityLabel="Post body"
              multiline
              style={styles.bodyInput}
            />

            <SpringPressable
              onPress={() => void onPost()}
              disabled={posting}
              accessibilityRole="button"
              style={({ pressed }) => [styles.postBtn, (pressed || posting) && styles.pressed]}
            >
              <Text style={styles.postBtnText}>
                {posting ? 'Publishing...' : 'Post to Circle'}
              </Text>
            </SpringPressable>
          </View>
        </FadeIn>

        <View style={styles.feedList}>
          {posts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No posts yet. Start the conversation for your commute corridor.
              </Text>
            </View>
          ) : null}

          {posts.map((post, index) => (
            <FadeIn key={post.postId} delay={Math.min(index, 8) * 40}>
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <ShieldCheck size={16} color={theme.color.teal} />
                  <Text style={styles.postAuthor}>{post.nickname}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{post.category.replace('_', ' ')}</Text>
                  </View>
                </View>

                <Text style={styles.postBody}>{post.body}</Text>

                <View style={styles.postFooter}>
                  <SpringPressable
                    onPress={() =>
                      void upvotePost(post.postId).catch(() =>
                        setStatus('Could not update upvote.')
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Upvote post"
                    style={styles.upvoteBtn}
                  >
                    <ArrowBigUp size={18} color={theme.color.orange} />
                    <Text style={styles.upvoteCount}>{post.upvotes}</Text>
                  </SpringPressable>
                  <View style={styles.noteIndicator}>
                    <MessageCircle size={14} color={theme.color.muted} />
                    <Text style={styles.noteText}>Circle note</Text>
                  </View>
                </View>
              </View>
            </FadeIn>
          ))}
        </View>

        {status ? (
          <Text accessibilityRole="alert" style={styles.statusError}>
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
  composerCard: {
    marginTop: 18,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 16
  },
  cardEyebrow: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.5,
    marginBottom: 8
  },
  nickInput: {
    color: theme.color.white,
    minHeight: 44,
    fontSize: 14,
    fontFamily: theme.font.semibold,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  categoryChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  categoryChipActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  categoryChipText: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.semibold
  },
  categoryChipTextActive: {
    color: theme.color.teal,
    fontFamily: theme.font.bold
  },
  bodyInput: {
    color: theme.color.white,
    minHeight: 74,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    paddingHorizontal: 12,
    paddingTop: 10
  },
  postBtn: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  postBtnText: {
    color: theme.color.textOnAccent,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  feedList: {
    marginTop: 20,
    gap: theme.layout.cardGap
  },
  emptyCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: theme.font.regular,
    textAlign: 'center'
  },
  postCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 16
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  postAuthor: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.bold,
    marginLeft: 6
  },
  tagBadge: {
    marginLeft: 'auto',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.tealSoft,
    paddingHorizontal: 9,
    paddingVertical: 3
  },
  tagText: {
    color: theme.color.teal,
    fontSize: 10,
    fontFamily: theme.font.bold,
    textTransform: 'capitalize'
  },
  postBody: {
    color: theme.color.white,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 10
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.color.border
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  upvoteCount: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  noteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  noteText: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.regular
  },
  statusError: {
    color: theme.color.danger,
    fontSize: 13,
    fontFamily: theme.font.semibold,
    marginTop: 14,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.88
  }
});
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Globe2, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { theme } from '../src/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

const LANGUAGES = ['English', 'Hindi', 'Telugu'] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const [womenOnly, setWomenOnly] = useState(true);
  const [displayName, setDisplayName] = useState('Rider');
  const [languageIndex, setLanguageIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const token = await readFirebaseIdToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/v1/me`, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        displayName?: string | null;
        preferredLanguage?: 'en' | 'hi' | 'te';
      };
      if (!active) return;
      if (payload.displayName) setDisplayName(payload.displayName);
      setLanguageIndex(
        payload.preferredLanguage === 'hi' ? 1 : payload.preferredLanguage === 'te' ? 2 : 0
      );
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const cycleLanguage = () => {
    setLanguageIndex((current) => (current + 1) % LANGUAGES.length);
  };

  const language = LANGUAGES[languageIndex] ?? 'English';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="HERWAY PROFILE" tone="teal" />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserRound size={28} color={theme.color.teal} />
          </View>
          <View style={styles.profileCopy}>
            <Text accessibilityRole="header" style={styles.profileName}>
              {displayName}
            </Text>
            <Text style={styles.profileSub}>Verified HerWay member · HITEC City</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ride & commute preferences</Text>

        <View style={styles.prefCard}>
          <SpringPressable
            onPress={() => setWomenOnly((value) => !value)}
            accessibilityRole="switch"
            accessibilityState={{ checked: womenOnly }}
            style={styles.prefRow}
          >
            <View style={styles.iconBoxTeal}>
              <ShieldCheck size={20} color={theme.color.teal} />
            </View>
            <View style={styles.prefCopy}>
              <Text style={styles.prefTitle}>Women-only rides</Text>
              <Text style={styles.prefDetail}>Required for every HerWay ride & pool</Text>
            </View>
            <View style={[styles.switchTrack, womenOnly && styles.switchTrackOn]}>
              <View style={[styles.switchThumb, womenOnly && styles.switchThumbOn]} />
            </View>
          </SpringPressable>

          <View style={styles.rowDivider} />

          <SpringPressable
            onPress={cycleLanguage}
            accessibilityRole="button"
            accessibilityLabel="Cycle preferred language"
            style={styles.prefRow}
          >
            <View style={styles.iconBoxOrange}>
              <Globe2 size={20} color={theme.color.orange} />
            </View>
            <View style={styles.prefCopy}>
              <Text style={styles.prefTitle}>Language</Text>
              <Text style={styles.prefDetail}>{language} · Tap to switch</Text>
            </View>
            <Text style={styles.langPill}>{language}</Text>
          </SpringPressable>
        </View>

        <SpringPressable
          onPress={() => router.push('/auth')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.signInBtn, pressed && styles.pressed]}
        >
          <LogOut size={18} color={theme.color.white} />
          <Text style={styles.signInBtnText}>Manage account / sign-in</Text>
        </SpringPressable>
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
  profileCard: {
    marginTop: 20,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileCopy: {
    flex: 1,
    marginLeft: 14
  },
  profileName: {
    color: theme.color.white,
    fontSize: 19,
    fontFamily: theme.font.bold
  },
  profileSub: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 3
  },
  sectionTitle: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold,
    marginTop: 22,
    marginBottom: 12
  },
  prefCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    overflow: 'hidden'
  },
  prefRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12
  },
  iconBoxTeal: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBoxOrange: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  prefCopy: {
    flex: 1
  },
  prefTitle: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  prefDetail: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  switchTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  switchTrackOn: {
    backgroundColor: theme.color.teal,
    borderColor: theme.color.teal
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.color.muted,
    alignSelf: 'flex-start'
  },
  switchThumbOn: {
    backgroundColor: theme.color.textOnAccent,
    alignSelf: 'flex-end'
  },
  rowDivider: {
    height: 1,
    backgroundColor: theme.color.border,
    marginHorizontal: 14
  },
  langPill: {
    color: theme.color.teal,
    fontSize: 12,
    fontFamily: theme.font.bold,
    backgroundColor: theme.color.tealSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill
  },
  signInBtn: {
    minHeight: 52,
    marginTop: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  },
  signInBtnText: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  pressed: {
    opacity: 0.88
  }
});
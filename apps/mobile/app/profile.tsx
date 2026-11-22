import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Globe2,
  LogOut,
  ShieldCheck,
  UserRound
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { readFirebaseIdToken } from '../src/auth/session';
import { getApiUrl } from '../src/config/apiUrl';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

export default function ProfileScreen() {
  const router = useRouter();
  const [womenOnly, setWomenOnly] = useState(true);
  const [displayName, setDisplayName] = useState('Rider');
  const [language, setLanguage] = useState('English');

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
      setLanguage(
        payload.preferredLanguage === 'hi'
          ? 'Hindi'
          : payload.preferredLanguage === 'te'
            ? 'Telugu'
            : 'English'
      );
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

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
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <SpringPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: theme.color.surfaceDarkRaised,
              borderWidth: 1,
              borderColor: '#34343B',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={22} color={theme.color.white} />
          </SpringPressable>
          <View
            style={{
              borderRadius: 999,
              backgroundColor: theme.color.tealSoft,
              paddingHorizontal: 12,
              paddingVertical: 7
            }}
          >
            <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '800' }}>
              HERWAY PROFILE
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 24,
            borderRadius: 24,
            backgroundColor: theme.color.surfaceDark,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.color.lavender,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UserRound size={30} color={theme.color.white} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: theme.color.white, fontSize: 20, fontWeight: '900' }}>
              {displayName}
            </Text>
            <Text style={{ color: '#BBD0DA', fontSize: 13, marginTop: 4 }}>
              Verified HerWay member
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: theme.color.white,
            fontSize: 16,
            fontWeight: '800',
            marginTop: 24,
            marginBottom: 10
          }}
        >
          Ride preferences
        </Text>
        <View
          style={{
            borderRadius: 20,
            backgroundColor: theme.color.surfaceDarkRaised,
            borderWidth: 1,
            borderColor: '#34343B',
            overflow: 'hidden'
          }}
        >
          <SpringPressable
            onPress={() => setWomenOnly((value) => !value)}
            accessibilityRole="switch"
            accessibilityState={{ checked: womenOnly }}
            style={{
              minHeight: 72,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.color.tealSoft,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={21} color={theme.color.teal} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
                Women-only rides
              </Text>
              <Text style={{ color: "#A7A7AD", fontSize: 12, marginTop: 3 }}>
                Required for every HerWay ride
              </Text>
            </View>
            <View
              style={{
                width: 46,
                height: 28,
                borderRadius: 14,
                backgroundColor: womenOnly ? theme.color.teal : '#AAB8C1',
                justifyContent: 'center',
                paddingHorizontal: 3
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: theme.color.surfaceDarkRaised,
                  alignSelf: womenOnly ? 'flex-end' : 'flex-start'
                }}
              />
            </View>
          </SpringPressable>
          <View style={{ height: 1, backgroundColor: '#34343B', marginHorizontal: 14 }} />
          <View
            style={{
              minHeight: 72,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.color.lavender,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Globe2 size={21} color={theme.color.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
                Language
              </Text>
              <Text style={{ color: "#A7A7AD", fontSize: 12, marginTop: 3 }}>
                {language}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.color.muted} />
          </View>
        </View>

        <SpringPressable
          onPress={() => router.push('/auth')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 56,
            marginTop: 18,
            borderRadius: 16,
            backgroundColor: theme.color.surfaceDarkRaised,
            borderWidth: 1,
            borderColor: '#34343B',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            opacity: pressed ? 0.88 : 1
          })}
        >
          <LogOut size={18} color={theme.color.white} />
          <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
            Open existing sign-in
          </Text>
        </SpringPressable>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

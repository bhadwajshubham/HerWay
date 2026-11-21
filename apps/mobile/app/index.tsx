import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import {
  Briefcase,
  GraduationCap,
  Home,
  MapPin,
  MoreHorizontal,
  Search,
  Share2,
  ShieldCheck,
  Building2,
  Siren,
  UserRound
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { DemoBanner } from '../src/components/DemoBanner';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

const quickActions = [
  { label: 'Home', detail: 'Saved place', Icon: Home },
  { label: 'Work', detail: 'Saved place', Icon: Briefcase },
  { label: 'Campus', detail: 'Partner campus', Icon: GraduationCap },
  { label: 'More', detail: 'Browse', Icon: MoreHorizontal }
] as const;

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 112
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text style={{ color: '#A7A7AD', fontSize: 14 }}>Welcome back</Text>
            <Text
              accessibilityRole="header"
              style={{ color: theme.color.orange, fontSize: 31, fontWeight: '900', marginTop: 2 }}
            >
              HerWay
            </Text>
          </View>
          <DemoBanner />
        </View>

        <Text
          accessibilityRole="header"
          style={{
            color: theme.color.orange,
            fontSize: 40,
            lineHeight: 43,
            fontWeight: '900',
            letterSpacing: -0.8,
            marginTop: 28
          }}
        >
          Where are you{`\n`}going?
        </Text>

        <SpringPressable
          onPress={() => router.push('/destination')}
          accessibilityRole="button"
          accessibilityLabel="Choose destination"
          style={({ pressed }) => ({
            minHeight: 64,
            marginTop: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: pressed ? theme.color.orange : '#34343B',
            backgroundColor: '#18181C',
            justifyContent: 'center',
            paddingHorizontal: 18,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 14,
            elevation: 8
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Search size={20} color={theme.color.orange} />
            <Text style={{ color: '#F5F5F7', fontSize: 16, fontWeight: '800' }}>Where to?</Text>
          </View>
        </SpringPressable>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          {quickActions.map((action) => (
            <SpringPressable
              key={action.label}
              onPress={() => router.push('/destination')}
              accessibilityRole="button"
              style={{ alignItems: 'center', width: 72 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: '#18181C',
                  borderWidth: 1,
                  borderColor: '#34343B',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <action.Icon size={24} color={theme.color.orange} />
              </View>
              <Text
                numberOfLines={1}
                style={{ color: '#F5F5F7', fontSize: 13, fontWeight: '800', marginTop: 8 }}
              >
                {action.label}
              </Text>
              <Text numberOfLines={1} style={{ color: '#9D9DA6', fontSize: 11, marginTop: 2 }}>
                {action.detail}
              </Text>
            </SpringPressable>
          ))}
        </View>

        <SpringPressable
          onPress={() => router.push('/trip-live')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: 26,
            borderRadius: 22,
            backgroundColor: '#18181C',
            borderWidth: 1,
            borderColor: '#34343B',
            padding: 18,
            opacity: pressed ? 0.92 : 1,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.24,
            shadowRadius: 12,
            elevation: 6
          })}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.color.white, fontSize: 17, fontWeight: '800' }}>
                Trip preview
              </Text>
              <Text style={{ color: '#BBD0DA', fontSize: 13, marginTop: 5 }}>No active trip</Text>
            </View>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: theme.color.orange,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MapPin size={24} color={theme.color.white} />
            </View>
          </View>
        </SpringPressable>

        <Text
          style={{
            color: '#F5F5F7',
            fontSize: 17,
            fontWeight: '900',
            marginTop: 26,
            marginBottom: 12
          }}
        >
          Safety & confidence
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <SpringPressable
            onPress={() => router.push('/safety')}
            accessibilityRole="button"
            style={{
              width: '48%',
              minHeight: 76,
              borderRadius: 18,
              backgroundColor: '#18181C',
              borderWidth: 1,
              borderColor: '#34343B',
              justifyContent: 'center',
              paddingHorizontal: 14
            }}
          >
            <Siren size={21} color={theme.color.orange} />
            <Text style={{ color: '#F5F5F7', fontSize: 14, fontWeight: '800', marginTop: 7 }}>
              Safety & SOS
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() => router.push('/trip-live')}
            accessibilityRole="button"
            style={{
              width: '48%',
              minHeight: 76,
              borderRadius: 18,
              backgroundColor: '#18181C',
              borderWidth: 1,
              borderColor: '#34343B',
              justifyContent: 'center',
              paddingHorizontal: 14
            }}
          >
            <Share2 size={21} color={theme.color.teal} />
            <Text style={{ color: '#F5F5F7', fontSize: 14, fontWeight: '800', marginTop: 7 }}>
              Share trip
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() => router.push('/work-circle')}
            accessibilityRole="button"
            style={{
              width: '48%',
              minHeight: 76,
              borderRadius: 18,
              backgroundColor: '#18181C',
              borderWidth: 1,
              borderColor: '#34343B',
              justifyContent: 'center',
              paddingHorizontal: 14
            }}
          >
            <Building2 size={21} color="#9FCFC6" />
            <Text style={{ color: '#F5F5F7', fontSize: 14, fontWeight: '800', marginTop: 7 }}>
              Work Circle
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            style={{
              width: '48%',
              minHeight: 76,
              borderRadius: 18,
              backgroundColor: '#25232B',
              borderWidth: 1,
              borderColor: '#46414F',
              justifyContent: 'center',
              paddingHorizontal: 14
            }}
          >
            <UserRound size={21} color="#CFC5EC" />
            <Text style={{ color: '#F5F5F7', fontSize: 14, fontWeight: '800', marginTop: 7 }}>
              My profile
            </Text>
          </SpringPressable>
        </View>

        <View
          style={{
            marginTop: 18,
            borderRadius: 18,
            backgroundColor: '#11283A',
            borderWidth: 1,
            borderColor: '#21495A',
            padding: 16
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <ShieldCheck size={20} color="#9FCFC6" />
            <Text
              style={{
                flex: 1,
                marginLeft: 10,
                color: '#E8EEF2',
                fontSize: 13,
                lineHeight: 19,
                fontWeight: '700'
              }}
            >
              Ride booking and dispatch are not available yet. No ride is requested from this screen.
            </Text>
          </View>
        </View>
      </ScrollView>

      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

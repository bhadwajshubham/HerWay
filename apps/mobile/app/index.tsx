import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Briefcase,
  Building2,
  CarFront,
  GraduationCap,
  Home,
  MapPin,
  MoreHorizontal,
  Search,
  Share2,
  ShieldCheck,
  Siren,
  UserRound
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

const quickActions = [
  { label: 'Home', detail: 'Saved place', Icon: Home },
  { label: 'Work', detail: 'Mindspace / HITEC', Icon: Briefcase },
  { label: 'Campus', detail: 'Partner campus', Icon: GraduationCap },
  { label: 'More', detail: 'Browse', Icon: MoreHorizontal }
] as const;

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text accessibilityRole="header" style={styles.brandTitle}>
              HerWay
            </Text>
          </View>
          <SpringPressable
            onPress={() => router.push('/community')}
            accessibilityRole="button"
            accessibilityLabel="Open community"
            style={({ pressed }) => [styles.circleBadge, pressed && styles.pressed]}
          >
            <Text style={styles.circleBadgeText}>CIRCLE</Text>
          </SpringPressable>
        </View>

        <Text accessibilityRole="header" style={styles.heroHeadline}>
          Where are you{`\n`}going?
        </Text>

        <SpringPressable
          onPress={() => router.push('/destination')}
          accessibilityRole="button"
          accessibilityLabel="Choose destination"
          style={({ pressed }) => [styles.searchBox, pressed && styles.searchBoxPressed]}
        >
          <Search size={19} color={theme.color.teal} />
          <Text style={styles.searchPlaceholder}>Search destination or office corridor</Text>
        </SpringPressable>

        <View style={styles.quickRow}>
          {quickActions.map((action) => (
            <SpringPressable
              key={action.label}
              onPress={() => router.push('/destination')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}
            >
              <View style={styles.quickIconWrap}>
                <action.Icon size={21} color={theme.color.teal} />
              </View>
              <Text numberOfLines={1} style={styles.quickLabel}>
                {action.label}
              </Text>
              <Text numberOfLines={1} style={styles.quickDetail}>
                {action.detail}
              </Text>
            </SpringPressable>
          ))}
        </View>

        <SpringPressable
          onPress={() => router.push('/trip-live')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}
        >
          <View style={styles.tripCardRow}>
            <View style={styles.tripCopy}>
              <Text style={styles.tripTitle}>Live trip & PIN</Text>
              <Text style={styles.tripSub}>No active trip · OSRM route & start PIN</Text>
            </View>
            <View style={styles.tripPinIcon}>
              <MapPin size={22} color={theme.color.textOnAccent} />
            </View>
          </View>
        </SpringPressable>

        <Text style={styles.sectionTitle}>Commute & safety</Text>

        <View style={styles.grid}>
          <SpringPressable
            onPress={() => router.push('/ride-share')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tileCard, pressed && styles.pressed]}
          >
            <Share2 size={20} color={theme.color.teal} />
            <Text style={styles.tileTitle}>Daily commute pool</Text>
            <Text style={styles.tileSub}>Carpool & scooty shifts</Text>
          </SpringPressable>

          <SpringPressable
            onPress={() => router.push('/safety')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tileCard, pressed && styles.pressed]}
          >
            <Siren size={20} color={theme.color.orange} />
            <Text style={styles.tileTitle}>Safety & SOS</Text>
            <Text style={styles.tileSub}>112 dialer & SOS log</Text>
          </SpringPressable>

          <SpringPressable
            onPress={() => router.push('/work-circle')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tileCard, pressed && styles.pressed]}
          >
            <Building2 size={20} color={theme.color.teal} />
            <Text style={styles.tileTitle}>Work Circle</Text>
            <Text style={styles.tileSub}>Verified company access</Text>
          </SpringPressable>

          <SpringPressable
            onPress={() => router.push('/captain')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tileCard, pressed && styles.pressed]}
          >
            <CarFront size={20} color={theme.color.orange} />
            <Text style={styles.tileTitle}>Drive with HerWay</Text>
            <Text style={styles.tileSub}>Captain dispatch & PIN</Text>
          </SpringPressable>

          <SpringPressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tileCard, styles.fullTile, pressed && styles.pressed]}
          >
            <UserRound size={20} color={theme.color.teal} />
            <Text style={styles.tileTitle}>My profile & account</Text>
            <Text style={styles.tileSub}>Preferences, verification, and session</Text>
          </SpringPressable>
        </View>

        <View style={styles.assuranceBanner}>
          <ShieldCheck size={20} color={theme.color.teal} />
          <Text style={styles.assuranceText}>
            Women-only commute pooling and ride requests with PIN verification and live route
            monitoring.
          </Text>
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
    width: '100%',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 112
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  greeting: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.regular
  },
  brandTitle: {
    color: theme.color.orange,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: theme.font.bold,
    marginTop: 2
  },
  circleBadge: {
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  circleBadgeText: {
    color: theme.color.teal,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.6
  },
  heroHeadline: {
    color: theme.color.white,
    fontSize: 36,
    lineHeight: 42,
    fontFamily: theme.font.bold,
    letterSpacing: -0.6,
    marginTop: 24
  },
  searchBox: {
    minHeight: 58,
    marginTop: 16,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10
  },
  searchBoxPressed: {
    borderColor: theme.color.teal
  },
  searchPlaceholder: {
    color: theme.color.white,
    fontSize: 15,
    fontFamily: theme.font.semibold,
    flex: 1
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18
  },
  quickItem: {
    alignItems: 'center',
    flex: 1
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickLabel: {
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.bold,
    marginTop: 7
  },
  quickDetail: {
    color: theme.color.muted,
    fontSize: 10,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  tripCard: {
    marginTop: 22,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 16
  },
  tripCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  tripCopy: {
    flex: 1
  },
  tripTitle: {
    color: theme.color.white,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  tripSub: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 4
  },
  tripPinIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    color: theme.color.white,
    fontSize: 17,
    fontFamily: theme.font.bold,
    marginTop: 24,
    marginBottom: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.layout.cardGap
  },
  tileCard: {
    width: '48.2%',
    minHeight: 84,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  fullTile: {
    width: '100%'
  },
  tileTitle: {
    color: theme.color.white,
    fontSize: 14,
    fontFamily: theme.font.bold,
    marginTop: 8
  },
  tileSub: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.regular,
    marginTop: 2
  },
  assuranceBanner: {
    marginTop: 16,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  assuranceText: {
    flex: 1,
    color: theme.color.white,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.font.semibold
  },
  pressed: {
    opacity: 0.88
  }
});
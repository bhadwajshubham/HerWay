import { usePathname, useRouter } from 'expo-router';
import { Home, MapPin, Siren, UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { theme } from '../theme';
import { SpringPressable } from './SpringPressable';

const navigationItems = [
  { label: 'Home', route: '/', Icon: Home },
  { label: 'Trip', route: '/trip-live', Icon: MapPin },
  { label: 'Safety', route: '/safety', Icon: Siren },
  { label: 'Profile', route: '/profile', Icon: UserRound }
] as const;

export function StickyBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        maxWidth: 720,
        alignSelf: 'center',
        bottom: 14,
        height: 76,
        borderRadius: 24,
        backgroundColor: theme.color.surfaceDarkRaised,
        borderWidth: 1,
        borderColor: theme.color.borderDark,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 12
      }}
      accessibilityRole="toolbar"
      accessibilityLabel="Primary navigation"
    >
      {navigationItems.map((item) => {
        const active = pathname === item.route;
        const Icon = item.Icon;
        return (
          <SpringPressable
            key={item.label}
            onPress={() => {
              if (active) return;
              if (item.route === '/') router.replace('/');
              else router.push(item.route);
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 68,
              height: 58,
              borderRadius: 18,
              backgroundColor: active ? '#2B1E14' : 'transparent'
            }}
          >
            <Icon size={21} color={active ? theme.color.orange : '#BBD0DA'} />
            <Text
              style={{
                color: active ? theme.color.orange : '#BBD0DA',
                fontSize: 11,
                fontWeight: active ? '900' : '700',
                marginTop: 4
              }}
            >
              {item.label}
            </Text>
          </SpringPressable>
        );
      })}
    </View>
  );
}

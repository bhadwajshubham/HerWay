import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { SpringPressable } from './SpringPressable';

interface ScreenHeaderProps {
  badge?: string;
  tone?: 'teal' | 'orange';
}

export function ScreenHeader({ badge, tone = 'teal' }: ScreenHeaderProps) {
  const router = useRouter();
  const isOrange = tone === 'orange';

  const handleBack = () => {
    if (typeof router.canGoBack === 'function' && !router.canGoBack()) {
      router.replace('/');
      return;
    }
    router.back();
  };

  return (
    <View style={styles.row}>
      <SpringPressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <ArrowLeft size={20} color={theme.color.white} />
      </SpringPressable>
      {badge ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isOrange ? theme.color.orangeSoft : theme.color.tealSoft,
              borderColor: isOrange ? 'rgba(255, 106, 0, 0.35)' : 'rgba(45, 212, 191, 0.35)'
            }
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isOrange ? theme.color.orange : theme.color.teal }
            ]}
          >
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.layout.cardGap
  },
  backButton: {
    width: theme.touchTarget,
    height: theme.touchTarget,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    minHeight: 34,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontSize: 12,
    fontFamily: theme.font.bold
  }
});
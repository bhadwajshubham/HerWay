import { ArrowLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { SpringPressable } from './SpringPressable';

interface ScreenHeaderProps {
  badge?: string;
  tone?: 'teal' | 'orange';
}

export function ScreenHeader({ badge, tone = 'teal' }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <SpringPressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{
          width: theme.touchTarget,
          height: theme.touchTarget,
          borderRadius: 16,
          backgroundColor: theme.color.surfaceDarkRaised,
          borderWidth: 1,
          borderColor: theme.color.borderDark,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <ArrowLeft size={22} color={theme.color.white} />
      </SpringPressable>
      {badge ? (
        <View
          style={{
            minHeight: 36,
            borderRadius: 999,
            backgroundColor: tone === 'orange' ? theme.color.orangeSoft : theme.color.tealSoft,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text
            style={{
              color: tone === 'orange' ? theme.color.orange : theme.color.teal,
              fontSize: 12,
              fontFamily: theme.font.bold
            }}
          >
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

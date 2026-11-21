import { Text, View } from 'react-native';
import { theme } from '../theme';

export function DemoBanner() {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Demo mode"
      style={{
        minHeight: 36,
        borderRadius: 999,
        backgroundColor: theme.color.tealSoft,
        borderWidth: 1,
        borderColor: '#B7DDD7',
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Text style={{ color: theme.color.teal, fontSize: 12, fontWeight: '900' }}>
        DEMO ONLY
      </Text>
    </View>
  );
}

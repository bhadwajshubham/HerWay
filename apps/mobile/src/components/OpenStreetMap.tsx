import { Linking, Pressable, Text, View } from 'react-native';
import { theme } from '../theme';

export function OpenStreetMap({
  height = 230,
  label = 'OpenStreetMap preview',
}: {
  height?: number;
  latitude?: number;
  longitude?: number;
  label?: string;
}) {
  return (
    <View
      accessibilityLabel={label}
      style={{
        height,
        backgroundColor: '#DDE8ED',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.color.border,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <Text style={{ color: theme.color.ink, fontWeight: '700' }}>Map preview unavailable</Text>
      <Pressable
        onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}
        accessibilityRole="link"
        accessibilityLabel="Open OpenStreetMap attribution"
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          minHeight: 48,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: theme.color.border,
          paddingHorizontal: 10,
          justifyContent: 'center'
        }}
      >
        <Text style={{ color: theme.color.ink, fontSize: 12, fontWeight: '800' }}>
          © OpenStreetMap contributors
        </Text>
      </Pressable>
    </View>
  );
}

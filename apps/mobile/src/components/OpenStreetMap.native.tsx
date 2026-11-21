import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Linking, Pressable, Text, View } from 'react-native';
import { theme } from '../theme';

interface OpenStreetMapProps {
  latitude?: number;
  longitude?: number;
  height?: number;
  label?: string;
}

export function OpenStreetMap({
  latitude = 17.4435,
  longitude = 78.3772,
  height = 230,
  label = 'OpenStreetMap preview'
}: OpenStreetMapProps) {
  return (
    <View
      accessibilityLabel={label}
      style={{
        height,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#DDE8ED',
        borderWidth: 1,
        borderColor: theme.color.border
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Text style={{ color: theme.color.ink, fontWeight: '700', textAlign: 'center' }}>
          Map preview unavailable
        </Text>
      </View>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        <Marker coordinate={{ latitude, longitude }} pinColor={theme.color.teal} />
      </MapView>
      <Pressable
        onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}
        accessibilityRole="link"
        accessibilityLabel="Open OpenStreetMap attribution"
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          minHeight: 48,
          maxWidth: '82%',
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

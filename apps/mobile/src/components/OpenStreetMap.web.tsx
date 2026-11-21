import { createElement } from 'react';
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
  const zoom = 14;
  const scale = 2 ** zoom;
  const tileX = Math.floor(((longitude + 180) / 360) * scale);
  const tileY = Math.floor(
    ((1 -
      Math.log(Math.tan((latitude * Math.PI) / 180) + 1 / Math.cos((latitude * Math.PI) / 180)) /
        Math.PI) /
      2) *
      scale
  );
  const tiles = [-1, 0, 1].flatMap((yOffset) =>
    [-1, 0, 1].map((xOffset) => ({
      x: tileX + xOffset,
      y: tileY + yOffset
    }))
  );
  return (
    <View
      accessibilityLabel={label}
      style={{
        height,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: theme.color.surfaceDarkRaised,
        borderWidth: 1,
        borderColor: theme.color.borderDark
      }}
    >
      <View
        accessibilityLabel={label}
        style={{
          position: 'absolute',
          top: -90,
          left: -90,
          width: 768,
          height: 768,
          flexDirection: 'row',
          flexWrap: 'wrap',
          backgroundColor: '#DDE8ED'
        }}
      >
        {tiles.map((tile) =>
          createElement('img', {
            key: `${tile.x}-${tile.y}`,
            src: `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`,
            alt: '',
            width: 256,
            height: 256,
            loading: 'lazy',
            style: { display: 'block' }
          })
        )}
      </View>
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

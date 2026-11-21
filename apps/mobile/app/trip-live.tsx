import { Alert, SafeAreaView, ScrollView, Share, Text, View } from 'react-native';
import { ArrowLeft, Phone, Share2, ShieldCheck, Siren } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { OpenStreetMap } from '../src/components/OpenStreetMap';

export default function TripLiveScreen() {
  const router = useRouter();
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
              DEMO TRIP
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <OpenStreetMap height={230} label="HerWay demo trip OpenStreetMap preview" />
        </View>

        <View
          style={{
            marginTop: 16,
            borderRadius: 22,
            backgroundColor: theme.color.surfaceDarkRaised,
            borderWidth: 1,
            borderColor: '#34343B',
            padding: 18
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.color.teal }}
            />
            <Text
              style={{ color: theme.color.white, fontSize: 20, fontWeight: '900', marginLeft: 10 }}
            >
              No active trip
            </Text>
          </View>
          <Text style={{ color: "#A7A7AD", marginTop: 6 }}>Illustrative ETA: 4 minutes · no active ride</Text>
          <View style={{ height: 1, backgroundColor: '#34343B', marginVertical: 16 }} />
          <Text style={{ color: theme.color.white, fontSize: 16, fontWeight: '800' }}>
            Sample route · no captain assigned
          </Text>
          <Text style={{ color: "#A7A7AD", fontSize: 13, marginTop: 4 }}>
            Sample vehicle and plate shown for preview only
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <SpringPressable
            onPress={() => router.push('/safety')}
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: 72,
              borderRadius: 18,
              backgroundColor: theme.color.surfaceDark,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Siren size={21} color={theme.color.white} />
            <Text
              style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 5 }}
            >
              Safety
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() =>
              Share.share({
                title: 'Demo trip preview',
                message: 'Demo trip only. No live location or real trip is being shared.'
              })
            }
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: 72,
              borderRadius: 18,
              backgroundColor: theme.color.surfaceDarkRaised,
              borderWidth: 1,
              borderColor: '#34343B',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Share2 size={21} color={theme.color.teal} />
            <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 5 }}>
              Share demo trip
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() =>
              Alert.alert(
                'Sample call',
                'This is a demo. No real phone call or captain number is used.'
              )
            }
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: 72,
              borderRadius: 18,
              backgroundColor: theme.color.surfaceDarkRaised,
              borderWidth: 1,
              borderColor: '#34343B',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Phone size={21} color={theme.color.teal} />
            <Text style={{ color: theme.color.white, fontSize: 12, fontWeight: '800', marginTop: 5 }}>
              Call sample
            </Text>
          </SpringPressable>
        </View>

        <View
          style={{
            marginTop: 14,
            borderRadius: 16,
            backgroundColor: theme.color.tealSoft,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <ShieldCheck size={20} color={theme.color.teal} />
          <Text
            style={{
              flex: 1,
              marginLeft: 10,
              color: theme.color.white,
              fontSize: 13,
              fontWeight: '700'
            }}
          >
            Safety tools are UI previews only. No live tracking is active.
          </Text>
        </View>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

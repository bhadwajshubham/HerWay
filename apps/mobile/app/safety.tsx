import { Alert, Linking, SafeAreaView, ScrollView, Share, Text, View } from 'react-native';
import {
  ArrowLeft,
  MapPin,
  PhoneCall,
  Share2,
  ShieldCheck,
  Siren,
  TriangleAlert
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

export default function SafetyScreen() {
  const router = useRouter();
  const call112 = () => {
    Alert.alert(
      'Call emergency services?',
      'This places a direct call to 112. HerWay operator and trusted-contact escalation is unavailable in this build.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          style: 'destructive',
          onPress: () => {
            void Linking.openURL('tel:112').catch(() =>
              Alert.alert('Call unavailable', 'Use your phone to call 112 directly.')
            );
          }
        }
      ]
    );
  };

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
              Safety
            </Text>
          </View>
        </View>

        <Text
          accessibilityRole="header"
          style={{
            color: theme.color.white,
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '800',
            marginTop: 24
          }}
        >
          Safety & support
        </Text>
        <View
          style={{
            marginTop: 14,
            borderRadius: 16,
            backgroundColor: '#18181C',
            borderWidth: 1,
            borderColor: '#34343B',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <TriangleAlert size={20} color="#FF6A00" />
          <Text
            style={{ flex: 1, marginLeft: 10, color: '#F5F5F7', fontSize: 13, fontWeight: '700' }}
          >
            Emergency calls are available from this screen. HerWay does not yet notify an operator or trusted contact.
          </Text>
        </View>

        <View
          accessibilityRole="alert"
          style={{
            marginTop: 14,
            borderRadius: 20,
            backgroundColor: '#18181C',
            borderWidth: 1,
            borderColor: '#34343B',
            padding: 16
          }}
        >
          <Text style={{ color: theme.color.danger, fontSize: 16, fontWeight: '900' }}>
            HerWay SOS is unavailable
          </Text>
          <Text style={{ color: theme.color.white, fontSize: 13, lineHeight: 19, marginTop: 5 }}>
            This build cannot alert an operator or trusted contacts. Call 112 directly if you need emergency help.
          </Text>
        </View>

        <SpringPressable
          onPress={call112}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 86,
            marginTop: 18,
            borderRadius: 22,
            backgroundColor: theme.color.danger,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            opacity: pressed ? 0.88 : 1
          })}
        >
          <Siren size={30} color={theme.color.white} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: theme.color.white, fontSize: 18, fontWeight: '900' }}>
              Call 112
            </Text>
            <Text style={{ color: '#FFDADA', fontSize: 12, marginTop: 3 }}>
              Places a direct emergency call; HerWay escalation is unavailable
            </Text>
          </View>
        </SpringPressable>

        <Text
          style={{
            color: theme.color.white,
            fontSize: 16,
            fontWeight: '800',
            marginTop: 22,
            marginBottom: 10
          }}
        >
          Safety tools
        </Text>
        {[
          { label: 'Live trip sharing', detail: 'Share location UI preview', Icon: MapPin },
          { label: 'Trusted circle', detail: 'One-tap sharing preview', Icon: Share2 },
          { label: 'Helpline cards', detail: 'Local emergency numbers', Icon: PhoneCall },
          { label: 'Safety check', detail: 'Periodic ride check-in UI', Icon: ShieldCheck }
        ].map((item) => {
          const Icon = item.Icon;
          return (
            <SpringPressable
              key={item.label}
              onPress={() => {
                if (item.label === 'Live trip sharing') {
                  Share.share({
                    title: 'HerWay trip sharing',
                    message: 'Trip sharing must be confirmed in a live ride.'
                  });
                } else if (item.label === 'Trusted circle') {
                  Share.share({
                    title: 'HerWay trusted circle',
                    message: 'Contacts are notified only after trip-sharing consent.'
                  });
                } else if (item.label === 'Helpline cards') {
                  call112();
                } else {
                  Alert.alert('Safety check', 'Safety check-ins will be scheduled only during an active ride.');
                }
              }}
              accessibilityRole="button"
              style={{
                minHeight: 72,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: '#34343B',
                backgroundColor: theme.color.surfaceDarkRaised,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                marginBottom: 10
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: theme.color.tealSoft,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={20} color={theme.color.teal} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '800' }}>
                  {item.label}
                </Text>
                <Text style={{ color: "#A7A7AD", fontSize: 12, marginTop: 3 }}>
                  {item.detail}
                </Text>
              </View>
            </SpringPressable>
          );
        })}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Clock3, MapPin, Send, ShieldCheck } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';

export default function WorkCircleRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const name = typeof params.name === 'string' && params.name ? params.name : 'Verified coworker';
  const [destination, setDestination] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

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
          Request a coworker ride
        </Text>
        <Text style={{ color: "#A7A7AD", fontSize: 14, lineHeight: 21, marginTop: 8 }}>
          Send a ride request to {name}. Independent consent and operator review are required.
        </Text>

        <View
          style={{ marginTop: 18, borderRadius: 20, backgroundColor: theme.color.surfaceDark, padding: 16 }}
        >
          <Text style={{ color: '#BBD0DA', fontSize: 12, fontWeight: '800' }}>RECIPIENT</Text>
          <Text style={{ color: theme.color.white, fontSize: 20, fontWeight: '900', marginTop: 5 }}>
            {name}
          </Text>
          <Text style={{ color: '#79D7C8', fontSize: 12, marginTop: 5 }}>
            Northstar Labs · fictional preview coworker
          </Text>
        </View>

        <Text
          style={{
            color: theme.color.white,
            fontSize: 16,
            fontWeight: '800',
            marginTop: 22,
            marginBottom: 10
          }}
        >
          Preview route
        </Text>
        {[
          { label: 'Choose pickup', detail: 'Select on the map', Icon: MapPin },
          { label: 'Choose destination', detail: 'Select on the map', Icon: MapPin }
        ].map((option) => (
          <SpringPressable
            key={option.label}
            onPress={() => setDestination(option.label)}
            accessibilityRole="radio"
            accessibilityState={{ checked: destination === option.label }}
            style={{
              minHeight: 68,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: destination === option.label ? theme.color.teal : '#34343B',
              backgroundColor: theme.color.surfaceDarkRaised,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              marginBottom: 8
            }}
          >
            <option.Icon size={20} color={theme.color.teal} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '900' }}>
                {option.label}
              </Text>
              <Text style={{ color: "#A7A7AD", fontSize: 12, marginTop: 3 }}>
                {option.detail}
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: destination === option.label ? theme.color.teal : '#9DAFB9',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {destination === option.label ? (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.color.teal
                  }}
                />
              ) : null}
            </View>
          </SpringPressable>
        ))}

        <View
          style={{
            minHeight: 64,
            marginTop: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#34343B',
            backgroundColor: theme.color.surfaceDarkRaised,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14
          }}
        >
          <Clock3 size={20} color={theme.color.teal} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: theme.color.white, fontSize: 15, fontWeight: '900' }}>7:30 PM</Text>
            <Text style={{ color: "#A7A7AD", fontSize: 12, marginTop: 3 }}>
              Fictional sample time
            </Text>
          </View>
        </View>

        <SpringPressable
          onPress={() => setConsent((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          style={{
            minHeight: 86,
            marginTop: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: consent ? theme.color.teal : '#34343B',
            backgroundColor: theme.color.surfaceDarkRaised,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: consent ? theme.color.teal : '#9DAFB9',
              backgroundColor: consent ? theme.color.teal : theme.color.white,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {consent ? (
              <Text style={{ color: theme.color.white, fontWeight: '900' }}>✓</Text>
            ) : null}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: theme.color.white, fontSize: 14, fontWeight: '900' }}>
              I choose to create this preview
            </Text>
            <Text style={{ color: "#A7A7AD", fontSize: 12, lineHeight: 18, marginTop: 4 }}>
              Independent consent: it also requires {name}'s separate action.
            </Text>
          </View>
        </SpringPressable>

        <SpringPressable
          disabled={!consent || sent}
          onPress={() => setSent(true)}
          accessibilityRole="button"
          style={{
            minHeight: 56,
            marginTop: 14,
            borderRadius: 16,
            backgroundColor: consent && !sent ? theme.color.teal : '#AAB8C1',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={19} color={theme.color.white} />
          <Text
            style={{ color: theme.color.white, fontSize: 15, fontWeight: '900', marginLeft: 8 }}
          >
            {sent ? 'Request sent' : 'Send request'}
          </Text>
        </SpringPressable>

        {sent ? (
          <View
            style={{
              marginTop: 12,
              borderRadius: 14,
              backgroundColor: theme.color.tealSoft,
              padding: 13
            }}
          >
            <Text
              style={{
                color: theme.color.teal,
                fontSize: 13,
                fontWeight: '800',
                textAlign: 'center'
              }}
            >
              Preview status: waiting for independent consent
            </Text>
            <Text
              style={{ color: "#A7A7AD", fontSize: 12, textAlign: 'center', marginTop: 4 }}
            >
              No real message or ride was created.
            </Text>
          </View>
        ) : null}

        <View
          style={{
            marginTop: 18,
            borderRadius: 18,
            backgroundColor: '#18181C',
            borderWidth: 1,
            borderColor: '#F1D59C',
            padding: 14,
            flexDirection: 'row'
          }}
        >
          <ShieldCheck size={18} color="#FF6A00" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ color: theme.color.white, fontSize: 13, fontWeight: '900' }}>
              No guarantee or real matching
            </Text>
            <Text style={{ color: "#A7A7AD", fontSize: 12, lineHeight: 18, marginTop: 4 }}>
              Names, organizations, routes, times, verification, and responses shown here are sample
              data. This screen does not arrange, track, or dispatch rides.
            </Text>
          </View>
        </View>
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

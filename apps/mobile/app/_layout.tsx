import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

void SplashScreen.preventAutoHideAsync();

const IS_WEB = Platform.OS === 'web';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={IS_WEB ? styles.webBackdrop : styles.nativeRoot}>
      <View style={IS_WEB ? styles.webShell : styles.nativeRoot}>
        <StatusBar style="light" backgroundColor="#0D0D0F" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
            contentStyle: styles.stackContent
          }}
        >
          <Stack.Screen
            name="safety"
            options={{
              presentation: 'modal',
              gestureEnabled: true
            }}
          />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeRoot: {
    flex: 1,
    backgroundColor: '#0D0D0F'
  },
  webBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: '#050507',
    alignItems: 'center'
  },
  webShell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#0D0D0F',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#262830',
    overflow: 'hidden'
  },
  stackContent: {
    backgroundColor: '#0D0D0F'
  }
});
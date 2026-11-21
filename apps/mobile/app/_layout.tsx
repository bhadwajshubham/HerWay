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
import { TextStyle } from 'react-native';

void SplashScreen.preventAutoHideAsync();

const defaultFontStyle: TextStyle = { fontFamily: 'Inter_400Regular' };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          contentStyle: defaultFontStyle
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
    </>
  );
}

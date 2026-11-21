import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { FcmDeviceRegistrationSchema } from '@herway/shared';
import { readFirebaseIdToken } from '../auth/session';
import { getApiUrl } from '../config/apiUrl';

export async function registerCurrentDevice(appVariant: 'rider' | 'driver'): Promise<void> {
  if (Platform.OS === 'web') return;

  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: (Constants.expoConfig?.extra?.easProjectId as string | undefined) ?? undefined
  });
  const token = tokenResponse.data;
  const idToken = await readFirebaseIdToken();
  if (!idToken) return;

  const payload = FcmDeviceRegistrationSchema.parse({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVariant
  });
  const apiUrl = getApiUrl();
  await fetch(`${apiUrl}/api/v1/notifications/devices`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
      'idempotency-key': `device-${token.slice(-12)}-${appVariant}`
    },
    body: JSON.stringify(payload)
  });
}

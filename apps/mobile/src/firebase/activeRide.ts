import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACTIVE_RIDE_KEY = 'herway_active_ride_id';
let memoryRideId: string | null = null;

export async function setActiveRideId(rideId: string | null): Promise<void> {
  memoryRideId = rideId;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (rideId) {
          window.localStorage.setItem(ACTIVE_RIDE_KEY, rideId);
        } else {
          window.localStorage.removeItem(ACTIVE_RIDE_KEY);
        }
      }
      return;
    }
    if (rideId) {
      await SecureStore.setItemAsync(ACTIVE_RIDE_KEY, rideId);
    } else {
      await SecureStore.deleteItemAsync(ACTIVE_RIDE_KEY);
    }
  } catch {
    // Keep in-memory fallback if storage is unavailable
  }
}

export async function getActiveRideId(): Promise<string | null> {
  if (memoryRideId) return memoryRideId;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(ACTIVE_RIDE_KEY);
        if (value) memoryRideId = value;
        return value;
      }
      return memoryRideId;
    }
    const stored = await SecureStore.getItemAsync(ACTIVE_RIDE_KEY);
    if (stored) memoryRideId = stored;
    return stored;
  } catch {
    return memoryRideId;
  }
}

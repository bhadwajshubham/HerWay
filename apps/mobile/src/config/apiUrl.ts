import Constants from 'expo-constants';

export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return (
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    'http://127.0.0.1:3000'
  );
}

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'herway.firebase.idToken';

export async function saveFirebaseIdToken(idToken: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, idToken);
}

export async function readFirebaseIdToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearFirebaseIdToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

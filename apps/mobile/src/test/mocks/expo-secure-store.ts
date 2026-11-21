// expo-secure-store mock for testing
const store = new Map<string, string>();

export const SecureStore = {
  async setItemAsync(key: string, value: string): Promise<void> {
    store.set(key, value);
  },
  async getItemAsync(key: string): Promise<string | null> {
    return store.get(key) ?? null;
  },
  async deleteItemAsync(key: string): Promise<void> {
    store.delete(key);
  }
};

export default SecureStore;
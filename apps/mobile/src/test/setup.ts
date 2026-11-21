// vitest setup for mobile tests
import { vi } from 'vitest';

// Mock react-native platform
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: Record<string, unknown>) => obj.web ?? obj.default
  }
}));

// Mock expo-notifications
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  setNotificationHandler: () => {}
}));

// Mock expo-splash-screen
vi.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: async () => {},
  hideAsync: async () => {}
}));

// Mock expo-status-bar
vi.mock('expo-status-bar', () => ({
  StatusBar: () => null
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

// Mock react-native-screens
vi.mock('react-native-screens', () => ({
  enableScreens: () => {}
}));

// Suppress console.error in tests unless explicitly testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && (firstArg.includes('Warning:') || firstArg.includes('act('))) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
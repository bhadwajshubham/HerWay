import { defineConfig } from 'vitest/config';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-reanimated': path.resolve(__dirname, 'src/test/mocks/react-native-reanimated.ts'),
      'expo-constants': path.resolve(__dirname, 'src/test/mocks/expo-constants.ts'),
      'expo-secure-store': path.resolve(__dirname, 'src/test/mocks/expo-secure-store.ts'),
      'expo-router': path.resolve(__dirname, 'src/test/mocks/expo-router.tsx'),
      'lucide-react-native': path.resolve(__dirname, 'src/test/mocks/lucide-react-native.tsx'),
      '@expo-google-fonts/inter': path.resolve(__dirname, 'src/test/mocks/expo-google-fonts-inter.ts'),
      'firebase/app': path.resolve(__dirname, 'src/test/mocks/firebase-app.ts'),
      'firebase/auth': path.resolve(__dirname, 'src/test/mocks/firebase-auth.ts')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['src/auth/firebaseClient.test.ts'],
    setupFiles: ['./src/test/setup.ts']
  }
});
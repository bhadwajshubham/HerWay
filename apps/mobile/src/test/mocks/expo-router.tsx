// expo-router mock for testing
import { ReactNode } from 'react';

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    back: () => {}
  };
}

export function useLocalSearchParams() {
  return {};
}

export function Stack({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function StackScreen() {
  return null;
}
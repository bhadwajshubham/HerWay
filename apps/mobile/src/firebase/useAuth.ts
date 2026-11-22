import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './client';

export interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
}

export function useAuth(): AuthState & { signOutUser(): Promise<void> } {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(
        getFirebaseAuth(),
        (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        },
        (authError) => {
          setError(authError.message);
          setLoading(false);
        }
      );
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Auth unavailable');
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, [configured]);

  const signOutUser = async (): Promise<void> => {
    if (!configured) return;
    await signOut(getFirebaseAuth());
  };

  return { user, loading, configured, error, signOutUser };
}

import { useAuth } from './useAuth';

export interface Identity {
  uid: string;
  displayName: string;
  ready: boolean;
  error: string | null;
}

function pickDisplayName(user: { displayName?: string | null; email?: string | null } | null): string {
  if (!user) return 'Guest';
  if (user.displayName && user.displayName.trim().length > 0) return user.displayName.trim();
  if (user.email) {
    const local = user.email.split('@')[0];
    if (local && local.length > 0) return local;
  }
  return 'HerWay member';
}

export function useIdentity(): Identity {
  const { user, loading, error } = useAuth();
  return {
    uid: user?.uid ?? '',
    displayName: pickDisplayName(user),
    ready: !loading && Boolean(user),
    error
  };
}

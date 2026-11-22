import {
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore';
import type { CommunityPost, CommunityPostCreate } from '@herway/shared';
import { getFirestoreDb } from './client';

const POSTS = 'communityPosts';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

function mapPost(id: string, data: Record<string, unknown>): CommunityPost {
  return {
    postId: id,
    authorUid: String(data.authorUid ?? ''),
    nickname: String(data.nickname ?? ''),
    category: (data.category as CommunityPost['category']) ?? 'general',
    body: String(data.body ?? ''),
    createdAt: toMillis(data.createdAt),
    upvotes: Number(data.upvotes ?? 0)
  };
}

export function subscribeCommunityPosts(
  onChange: (posts: CommunityPost[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const q = query(collection(db, POSTS), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((entry) => mapPost(entry.id, entry.data()))),
    (error) => onError?.(error)
  );
}

export async function createCommunityPost(
  authorUid: string,
  input: CommunityPostCreate
): Promise<string> {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, POSTS), {
    authorUid,
    nickname: input.nickname,
    category: input.category,
    body: input.body,
    upvotes: 0,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function upvotePost(postId: string): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, POSTS, postId), { upvotes: increment(1) });
}

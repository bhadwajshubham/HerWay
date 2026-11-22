import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import type { GeoPoint } from '@herway/shared';
import { getFirestoreDb } from './client';

const LIVE = 'liveLocation';
const CURRENT = 'current';

export interface LiveFix {
  point: GeoPoint;
  updatedAt: number;
}

export async function publishLiveLocation(rideId: string, point: GeoPoint): Promise<void> {
  const db = getFirestoreDb();
  await setDoc(doc(db, 'rideRequests', rideId, LIVE, CURRENT), {
    lat: point.lat,
    lng: point.lng,
    updatedAt: Date.now()
  });
}

export function subscribeLiveLocation(
  rideId: string,
  onChange: (fix: LiveFix | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  return onSnapshot(
    doc(db, 'rideRequests', rideId, LIVE, CURRENT),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      const data = snapshot.data();
      onChange({
        point: { lat: Number(data.lat), lng: Number(data.lng) },
        updatedAt: Number(data.updatedAt)
      });
    },
    (error) => onError?.(error)
  );
}

export function watchDeviceLocation(
  onPoint: (point: GeoPoint) => void,
  onError?: (message: string) => void
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.('Live location is not available on this device.');
    return () => undefined;
  }
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onPoint({ lat: position.coords.latitude, lng: position.coords.longitude });
    },
    () => onError?.('Location permission was denied.'),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
  return () => navigator.geolocation.clearWatch(watchId);
}

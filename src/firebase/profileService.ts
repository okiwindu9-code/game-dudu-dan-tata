import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  BagId,
  CarpetId,
  EquippedLoadout,
  GlassesId,
  HatId,
  PlayerSaveStore,
  ShirtId,
} from '../types/game';
import { OperationType, db, handleFirestoreError } from './config';

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function sanitizeDisplayName(raw: string | null | undefined): string {
  const cleaned = (raw || 'Pemain').trim().slice(0, 40);
  return cleaned.length > 0 ? cleaned : 'Pemain';
}

function sanitizePhotoUrl(raw: string | null | undefined): string {
  return (raw || '').trim().slice(0, 512);
}

function sanitizeLoadout(eq?: Partial<EquippedLoadout>): EquippedLoadout {
  return {
    hat: typeof eq?.hat === 'string' ? (eq.hat.slice(0, 40) as HatId) : null,
    glasses: typeof eq?.glasses === 'string' ? (eq.glasses.slice(0, 40) as GlassesId) : null,
    shirt: typeof eq?.shirt === 'string' ? (eq.shirt.slice(0, 40) as ShirtId) : null,
    bag: typeof eq?.bag === 'string' ? (eq.bag.slice(0, 40) as BagId) : null,
  };
}

function sanitizeStorePayload(store: PlayerSaveStore) {
  const ownedItems = Array.isArray(store.ownedItems)
    ? Array.from(
        new Set(
          store.ownedItems
            .filter((x): x is string => typeof x === 'string' && x.length > 0)
            .map((x) => x.slice(0, 40)),
        ),
      ).slice(0, 50)
    : [];

  return {
    tataBest: clampInt(store.tataBest, 0, 10000000),
    duduBest: clampInt(store.duduBest, 0, 10000000),
    bestCombo: clampInt(store.bestCombo, 0, 10000),
    totalPoints: clampInt(store.totalPoints, 0, 100000000),
    rupiahBalance: clampInt(store.rupiahBalance, 0, 1000000000),
    exchangeCount: clampInt(store.exchangeCount, 0, 100000),
    ownedItems,
    equippedByChar: {
      dudu: sanitizeLoadout(store.equippedByChar?.dudu),
      tata: sanitizeLoadout(store.equippedByChar?.tata),
    },
    equippedCarpet: (store.equippedCarpet || 'default').slice(0, 40) as CarpetId,
    boosterCounts: {
      boost_speed: clampInt(store.boosterCounts?.boost_speed ?? 0, 0, 999),
      boost_time2x: clampInt(store.boosterCounts?.boost_time2x ?? 0, 0, 999),
    },
    armedBoosters: {
      speedBoost: Boolean(store.armedBoosters?.speedBoost),
      time2xBoost: Boolean(store.armedBoosters?.time2xBoost),
    },
  };
}

function parseCloudDoc(data: Record<string, unknown>, fallback: PlayerSaveStore): PlayerSaveStore {
  const eq = (data.equippedByChar as Record<string, Partial<EquippedLoadout>> | undefined) || {};
  const boosters = (data.boosterCounts as Record<string, number> | undefined) || {};
  const armed = (data.armedBoosters as Record<string, boolean> | undefined) || {};

  return {
    tataBest: typeof data.tataBest === 'number' ? data.tataBest : fallback.tataBest,
    duduBest: typeof data.duduBest === 'number' ? data.duduBest : fallback.duduBest,
    bestCombo: typeof data.bestCombo === 'number' ? data.bestCombo : fallback.bestCombo,
    totalPoints: typeof data.totalPoints === 'number' ? data.totalPoints : fallback.totalPoints,
    rupiahBalance:
      typeof data.rupiahBalance === 'number' ? data.rupiahBalance : fallback.rupiahBalance,
    exchangeCount:
      typeof data.exchangeCount === 'number' ? data.exchangeCount : fallback.exchangeCount,
    ownedItems: Array.isArray(data.ownedItems)
      ? data.ownedItems.filter((x): x is string => typeof x === 'string')
      : fallback.ownedItems,
    equippedByChar: {
      dudu: sanitizeLoadout(eq.dudu),
      tata: sanitizeLoadout(eq.tata),
    },
    equippedCarpet:
      typeof data.equippedCarpet === 'string'
        ? (data.equippedCarpet as CarpetId)
        : fallback.equippedCarpet,
    boosterCounts: {
      boost_speed: typeof boosters.boost_speed === 'number' ? boosters.boost_speed : 0,
      boost_time2x: typeof boosters.boost_time2x === 'number' ? boosters.boost_time2x : 0,
    },
    armedBoosters: {
      speedBoost: Boolean(armed.speedBoost),
      time2xBoost: Boolean(armed.time2xBoost),
    },
  };
}

export async function loadOrCreateCloudProfile(
  user: User,
  localFallback: PlayerSaveStore,
): Promise<PlayerSaveStore> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap.exists()) {
    return parseCloudDoc(snap.data() as Record<string, unknown>, localFallback);
  }

  const payload = {
    uid: user.uid,
    displayName: sanitizeDisplayName(user.displayName),
    photoURL: sanitizePhotoUrl(user.photoURL),
    ...sanitizeStorePayload(localFallback),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return localFallback;
}

export async function syncCloudProfile(user: User, store: PlayerSaveStore): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  const payload = {
    displayName: sanitizeDisplayName(user.displayName),
    photoURL: sanitizePhotoUrl(user.photoURL),
    ...sanitizeStorePayload(store),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

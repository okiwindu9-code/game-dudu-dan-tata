import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  CarpetId,
  CharacterId,
  CostumeId,
  EquippedLoadout,
  GlassesId,
  HatId,
  PlayerDirectoryEntry,
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

function generateNumericPlayerCode(): string {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function sanitizeLoadout(eq?: Partial<EquippedLoadout>): EquippedLoadout {
  return {
    hat: typeof eq?.hat === 'string' ? (eq.hat.slice(0, 40) as HatId) : null,
    glasses: typeof eq?.glasses === 'string' ? (eq.glasses.slice(0, 40) as GlassesId) : null,
    shirt: typeof eq?.shirt === 'string' ? (eq.shirt.slice(0, 40) as ShirtId) : null,
    costume: typeof eq?.costume === 'string' ? (eq.costume.slice(0, 40) as CostumeId) : null,
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

function parseCloudDoc(
  data: Record<string, unknown>,
  fallback: PlayerSaveStore,
): { store: PlayerSaveStore; playerCode: string | null } {
  const eq = (data.equippedByChar as Record<string, Partial<EquippedLoadout>> | undefined) || {};
  const boosters = (data.boosterCounts as Record<string, number> | undefined) || {};
  const armed = (data.armedBoosters as Record<string, boolean> | undefined) || {};
  const rawCode = typeof data.playerCode === 'string' && /^[0-9]{6}$/.test(data.playerCode)
    ? data.playerCode
    : null;

  return {
    playerCode: rawCode,
    store: {
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
    },
  };
}

async function allocateUniquePlayerCode(user: User): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = generateNumericPlayerCode();
    const path = `playerDirectory/${candidate}`;
    const ref = doc(db, 'playerDirectory', candidate);
    try {
      const snap = await getDoc(ref);
      if (!snap.exists() || snap.data()?.uid === user.uid) {
        return candidate;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
  throw new Error('Gagal membuat ID pemain unik, silakan coba lagi.');
}

async function upsertDirectoryEntry(
  user: User,
  playerCode: string,
  store: PlayerSaveStore,
  preferredChar: CharacterId,
): Promise<void> {
  const path = `playerDirectory/${playerCode}`;
  const ref = doc(db, 'playerDirectory', playerCode);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const baseFields = {
    displayName: sanitizeDisplayName(user.displayName),
    photoURL: sanitizePhotoUrl(user.photoURL),
    preferredChar,
    duduBest: clampInt(store.duduBest, 0, 10000000),
    tataBest: clampInt(store.tataBest, 0, 10000000),
    updatedAt: serverTimestamp(),
  };

  try {
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        playerCode,
        uid: user.uid,
        ...baseFields,
      });
    } else if (existingSnap.data()?.uid === user.uid) {
      await updateDoc(ref, baseFields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function lookupPlayerByCode(rawCode: string): Promise<PlayerDirectoryEntry | null> {
  const code = rawCode.trim();
  if (!/^[0-9]{6}$/.test(code)) {
    return null;
  }
  const path = `playerDirectory/${code}`;
  const ref = doc(db, 'playerDirectory', code);
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  if (!snap.exists()) return null;
  const d = snap.data() as Record<string, unknown>;
  return {
    playerCode: String(d.playerCode || code),
    uid: String(d.uid || ''),
    displayName: String(d.displayName || 'Pemain'),
    photoURL: String(d.photoURL || ''),
    preferredChar: d.preferredChar === 'tata' ? 'tata' : 'dudu',
    duduBest: typeof d.duduBest === 'number' ? d.duduBest : 0,
    tataBest: typeof d.tataBest === 'number' ? d.tataBest : 0,
  };
}

export async function loadOrCreateCloudProfile(
  user: User,
  localFallback: PlayerSaveStore,
  preferredChar: CharacterId,
): Promise<{ store: PlayerSaveStore; playerCode: string }> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap.exists()) {
    const parsed = parseCloudDoc(snap.data() as Record<string, unknown>, localFallback);
    const code = parsed.playerCode || (await allocateUniquePlayerCode(user));

    // Migrate legacy docs missing playerCode or still holding old bag loadout shape
    const rawEq = (snap.data() as Record<string, unknown>).equippedByChar as
      | Record<string, Record<string, unknown>>
      | undefined;
    const needsMigration =
      !parsed.playerCode ||
      !rawEq?.dudu ||
      !('costume' in rawEq.dudu) ||
      'bag' in rawEq.dudu;

    if (needsMigration) {
      try {
        await updateDoc(ref, {
          playerCode: code,
          displayName: sanitizeDisplayName(user.displayName),
          photoURL: sanitizePhotoUrl(user.photoURL),
          ...sanitizeStorePayload(parsed.store),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    await upsertDirectoryEntry(user, code, parsed.store, preferredChar);
    return { store: parsed.store, playerCode: code };
  }

  const playerCode = await allocateUniquePlayerCode(user);
  const payload = {
    uid: user.uid,
    playerCode,
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

  await upsertDirectoryEntry(user, playerCode, localFallback, preferredChar);
  return { store: localFallback, playerCode };
}

export async function syncCloudProfile(
  user: User,
  playerCode: string,
  store: PlayerSaveStore,
  preferredChar: CharacterId,
): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  const payload = {
    playerCode,
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

  await upsertDirectoryEntry(user, playerCode, store, preferredChar);
}

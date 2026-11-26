import type { User } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  CharacterId,
  InGameDuration,
  TurnPlayerResult,
  TurnRoom,
} from '../types/game';
import { OperationType, db, handleFirestoreError } from './config';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function sanitizePlayerName(raw: string | null | undefined): string {
  const trimmed = (raw || 'Pemain').trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : 'Pemain';
}

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function sanitizeTurnResult(res: TurnPlayerResult): TurnPlayerResult {
  return {
    score: clampInt(res.score, 0, 10000000),
    maxCombo: clampInt(res.maxCombo, 0, 10000),
    itemsCaught: clampInt(res.itemsCaught, 0, 10000),
    hazardsHit: clampInt(res.hazardsHit, 0, 10),
    livesLeft: clampInt(res.livesLeft, 0, 3),
    durationUsed: clampInt(res.durationUsed, 0, 300),
  };
}

function mapDocToRoom(data: Record<string, unknown>): TurnRoom {
  return {
    roomCode: String(data.roomCode || ''),
    durationSec: (Number(data.durationSec) as InGameDuration) || 60,
    status: (data.status as TurnRoom['status']) || 'waiting',
    player1Uid: String(data.player1Uid || ''),
    player1Name: String(data.player1Name || 'Player 1'),
    player1Char: (data.player1Char as CharacterId) || 'dudu',
    player2Uid: typeof data.player2Uid === 'string' ? data.player2Uid : null,
    player2Name: typeof data.player2Name === 'string' ? data.player2Name : null,
    player2Char:
      data.player2Char === 'dudu' || data.player2Char === 'tata'
        ? data.player2Char
        : null,
    player1Result: (data.player1Result as TurnPlayerResult | null) ?? null,
    player2Result: (data.player2Result as TurnPlayerResult | null) ?? null,
    winnerUid: typeof data.winnerUid === 'string' ? data.winnerUid : null,
  };
}

export async function createTurnRoom(
  user: User,
  charId: CharacterId,
  durationSec: InGameDuration,
): Promise<TurnRoom> {
  const player1Name = sanitizePlayerName(user.displayName);

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = generateRoomCode();
    const path = `rooms/${code}`;
    const ref = doc(db, 'rooms', code);

    let existing;
    try {
      existing = await getDoc(ref);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }

    if (existing.exists()) {
      continue;
    }

    const payload = {
      roomCode: code,
      durationSec,
      status: 'waiting' as const,
      player1Uid: user.uid,
      player1Name,
      player1Char: charId,
      player2Uid: null,
      player2Name: null,
      player2Char: null,
      player1Result: null,
      player2Result: null,
      winnerUid: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }

    return {
      roomCode: code,
      durationSec,
      status: 'waiting',
      player1Uid: user.uid,
      player1Name,
      player1Char: charId,
      player2Uid: null,
      player2Name: null,
      player2Char: null,
      player1Result: null,
      player2Result: null,
      winnerUid: null,
    };
  }

  throw new Error('Gagal membuat kode room unik, silakan coba lagi.');
}

export async function joinTurnRoom(
  rawCode: string,
  user: User,
  charId: CharacterId,
): Promise<TurnRoom> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    throw new Error('Kode room harus 6 huruf/angka (contoh: DT4829).');
  }

  const path = `rooms/${code}`;
  const ref = doc(db, 'rooms', code);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    throw new Error(`Room ${code} tidak ditemukan.`);
  }

  const room = mapDocToRoom(snap.data() as Record<string, unknown>);
  if (room.status !== 'waiting' || room.player2Uid !== null) {
    throw new Error(`Room ${code} sudah penuh atau pertandingan sudah berjalan.`);
  }

  const player2Name = sanitizePlayerName(user.displayName);

  try {
    await updateDoc(ref, {
      player2Uid: user.uid,
      player2Name,
      player2Char: charId,
      status: 'player1_turn',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  return {
    ...room,
    player2Uid: user.uid,
    player2Name,
    player2Char: charId,
    status: 'player1_turn',
  };
}

export function subscribeTurnRoom(
  roomCode: string,
  onData: (room: TurnRoom | null) => void,
  onError: (error: Error) => void,
): () => void {
  const path = `rooms/${roomCode}`;
  const ref = doc(db, 'rooms', roomCode);

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapDocToRoom(snap.data() as Record<string, unknown>));
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function submitPlayer1TurnResult(
  roomCode: string,
  result: TurnPlayerResult,
): Promise<void> {
  const path = `rooms/${roomCode}`;
  const ref = doc(db, 'rooms', roomCode);

  try {
    await updateDoc(ref, {
      player1Result: sanitizeTurnResult(result),
      status: 'player2_turn',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitPlayer2TurnResult(
  room: TurnRoom,
  result: TurnPlayerResult,
): Promise<void> {
  const path = `rooms/${room.roomCode}`;
  const ref = doc(db, 'rooms', room.roomCode);
  const cleanP2 = sanitizeTurnResult(result);
  const p1Score = room.player1Result?.score ?? 0;

  let winnerUid = 'draw';
  if (cleanP2.score > p1Score && room.player2Uid) {
    winnerUid = room.player2Uid;
  } else if (p1Score > cleanP2.score) {
    winnerUid = room.player1Uid;
  }

  try {
    await updateDoc(ref, {
      player2Result: cleanP2,
      winnerUid,
      status: 'finished',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelWaitingRoom(roomCode: string): Promise<void> {
  const path = `rooms/${roomCode}`;
  const ref = doc(db, 'rooms', roomCode);

  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

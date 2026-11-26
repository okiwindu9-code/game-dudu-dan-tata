import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  CharacterId,
  CollectibleType,
  InGameDuration,
  LiveMatchState,
  PlayerDirectoryEntry,
  TurnMatch,
  TurnPlayerResult,
} from '../types/game';
import { OperationType, db, handleFirestoreError } from './config';
import { lookupPlayerByCode } from './profileService';

function sanitizeName(raw: string | null | undefined): string {
  const trimmed = (raw || 'Pemain').trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : 'Pemain';
}

function sanitizePhoto(raw: string | null | undefined): string {
  return (raw || '').trim().slice(0, 512);
}

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function clampNum(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val * 100) / 100));
}

function generateMatchId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `M_${Date.now()}_${rand}`;
}

function sanitizeLiveState(ls: LiveMatchState): LiveMatchState {
  const items = Array.isArray(ls.items)
    ? ls.items.slice(0, 14).map((it) => ({
        id: clampInt(it.id, 0, 10000000),
        type: String(it.type || 'strawberry').slice(0, 20) as CollectibleType,
        x: clampNum(it.x, -15, 15),
        y: clampNum(it.y, -2, 16),
      }))
    : [];

  return {
    turnUid: String(ls.turnUid).slice(0, 128),
    charId: ls.charId === 'tata' ? 'tata' : 'dudu',
    x: clampNum(ls.x, -15, 15),
    y: clampNum(ls.y, -1, 15),
    vx: clampNum(ls.vx, -40, 40),
    vy: clampNum(ls.vy ?? 0, -40, 40),
    score: clampInt(ls.score, 0, 10000000),
    timeLeft: clampInt(ls.timeLeft, 0, 300),
    lives: clampInt(ls.lives, 0, 3),
    combo: clampInt(ls.combo, 0, 10000),
    maxCombo: clampInt(ls.maxCombo, 0, 10000),
    itemsCaught: clampInt(ls.itemsCaught, 0, 10000),
    feverActive: Boolean(ls.feverActive),
    seq: clampInt(ls.seq, 0, 1000000),
    eventLabel: String(ls.eventLabel || '').slice(0, 40),
    items,
  };
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

function mapDocToMatch(data: Record<string, unknown>): TurnMatch {
  return {
    matchId: String(data.matchId || ''),
    durationSec: (Number(data.durationSec) as InGameDuration) || 60,
    status: (data.status as TurnMatch['status']) || 'invited',
    player1Uid: String(data.player1Uid || ''),
    player1Code: String(data.player1Code || ''),
    player1Name: String(data.player1Name || 'Player 1'),
    player1Char: data.player1Char === 'tata' ? 'tata' : 'dudu',
    player1Photo: String(data.player1Photo || ''),
    player2Uid: String(data.player2Uid || ''),
    player2Code: String(data.player2Code || ''),
    player2Name: String(data.player2Name || 'Player 2'),
    player2Char: data.player2Char === 'tata' ? 'tata' : 'dudu',
    player2Photo: String(data.player2Photo || ''),
    liveState: (data.liveState as LiveMatchState | null) ?? null,
    player1Result: (data.player1Result as TurnPlayerResult | null) ?? null,
    player2Result: (data.player2Result as TurnPlayerResult | null) ?? null,
    winnerUid: typeof data.winnerUid === 'string' ? data.winnerUid : null,
  };
}

export async function sendMabarInvite(
  user: User,
  myCode: string,
  myChar: CharacterId,
  targetCodeRaw: string,
  durationSec: InGameDuration,
): Promise<{ match: TurnMatch; targetPlayer: PlayerDirectoryEntry }> {
  const targetCode = targetCodeRaw.trim();
  if (!/^[0-9]{6}$/.test(targetCode)) {
    throw new Error('ID Pemain teman harus 6 digit angka (contoh: 482915).');
  }

  const target = await lookupPlayerByCode(targetCode);
  if (!target) {
    throw new Error(`ID Pemain ${targetCode} tidak ditemukan. Pastikan teman sudah login Google.`);
  }

  const matchId = generateMatchId();
  const path = `matches/${matchId}`;
  const ref = doc(db, 'matches', matchId);

  const player1Name = sanitizeName(user.displayName);
  const player1Photo = sanitizePhoto(user.photoURL);

  const payload = {
    matchId,
    durationSec,
    status: 'invited' as const,
    player1Uid: user.uid,
    player1Code: myCode,
    player1Name,
    player1Char: myChar,
    player1Photo,
    player2Uid: target.uid,
    player2Code: target.playerCode,
    player2Name: sanitizeName(target.displayName),
    player2Char: target.preferredChar,
    player2Photo: sanitizePhoto(target.photoURL),
    liveState: null,
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
    targetPlayer: target,
    match: {
      matchId,
      durationSec,
      status: 'invited',
      player1Uid: user.uid,
      player1Code: myCode,
      player1Name,
      player1Char: myChar,
      player1Photo,
      player2Uid: target.uid,
      player2Code: target.playerCode,
      player2Name: sanitizeName(target.displayName),
      player2Char: target.preferredChar,
      player2Photo: sanitizePhoto(target.photoURL),
      liveState: null,
      player1Result: null,
      player2Result: null,
      winnerUid: null,
    },
  };
}

export async function acceptMabarInvite(
  matchId: string,
  user: User,
  charId: CharacterId,
): Promise<void> {
  const path = `matches/${matchId}`;
  const ref = doc(db, 'matches', matchId);

  try {
    await updateDoc(ref, {
      player2Name: sanitizeName(user.displayName),
      player2Char: charId,
      player2Photo: sanitizePhoto(user.photoURL),
      status: 'player1_turn',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function declineOrCancelInvite(matchId: string): Promise<void> {
  const path = `matches/${matchId}`;
  const ref = doc(db, 'matches', matchId);

  try {
    await updateDoc(ref, {
      status: 'declined',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function pushLiveMatchState(
  matchId: string,
  liveState: LiveMatchState,
): Promise<void> {
  const path = `matches/${matchId}/live/state`;
  const ref = doc(db, 'matches', matchId, 'live', 'state');

  try {
    await setDoc(ref, sanitizeLiveState(liveState));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeLiveMatchState(
  matchId: string,
  onFrame: (frame: LiveMatchState | null) => void,
  onError: (error: Error) => void,
): () => void {
  const path = `matches/${matchId}/live/state`;
  const ref = doc(db, 'matches', matchId, 'live', 'state');

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onFrame(null);
        return;
      }
      const raw = snap.data() as LiveMatchState;
      onFrame(sanitizeLiveState(raw));
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

export async function finishPlayer1Turn(
  matchId: string,
  result: TurnPlayerResult,
): Promise<void> {
  const path = `matches/${matchId}`;
  const ref = doc(db, 'matches', matchId);

  try {
    await updateDoc(ref, {
      player1Result: sanitizeTurnResult(result),
      liveState: null,
      status: 'player2_turn',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function finishPlayer2Turn(
  match: TurnMatch,
  result: TurnPlayerResult,
): Promise<void> {
  const path = `matches/${match.matchId}`;
  const ref = doc(db, 'matches', match.matchId);
  const cleanP2 = sanitizeTurnResult(result);
  const p1Score = match.player1Result?.score ?? 0;

  let winnerUid = 'draw';
  if (cleanP2.score > p1Score) {
    winnerUid = match.player2Uid;
  } else if (p1Score > cleanP2.score) {
    winnerUid = match.player1Uid;
  }

  try {
    await updateDoc(ref, {
      player2Result: cleanP2,
      winnerUid,
      liveState: null,
      status: 'finished',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeMatch(
  matchId: string,
  onData: (match: TurnMatch | null) => void,
  onError: (error: Error) => void,
): () => void {
  const path = `matches/${matchId}`;
  const ref = doc(db, 'matches', matchId);

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapDocToMatch(snap.data() as Record<string, unknown>));
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

export function subscribeIncomingInvites(
  uid: string,
  onInvites: (invites: TurnMatch[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, 'matches'), where('player2Uid', '==', uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => mapDocToMatch(d.data() as Record<string, unknown>))
        .filter((m) => m.status === 'invited');
      onInvites(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'matches');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

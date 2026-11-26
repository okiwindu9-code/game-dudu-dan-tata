import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { soundEngine } from './audio/soundEngine';
import { CharacterDashboard } from './components/CharacterDashboard';
import { ExchangeModal } from './components/ExchangeModal';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import {
  AuthErrorDetail,
  auth,
  parseAuthError,
  signInWithGooglePopup,
  signOutFirebase,
} from './firebase/config';
import {
  loadOrCreateCloudProfile,
  syncCloudProfile,
} from './firebase/profileService';
import {
  acceptMabarInvite,
  declineOrCancelInvite,
  finishPlayer1Turn,
  finishPlayer2Turn,
  pushLiveMatchState,
  sendMabarInvite,
  subscribeIncomingInvites,
  subscribeMatch,
} from './firebase/matchService';
import { GameEngine } from './three/GameEngine';
import {
  ActiveBoosters,
  CarpetId,
  CharacterId,
  CostumeId,
  EquippedLoadout,
  ExchangeTier,
  FloatingPopup,
  GamePhase,
  GlassesId,
  HatId,
  HudSnapshot,
  InGameDuration,
  LiveMatchState,
  MAX_PLAYER_LIVES,
  PlayerSaveStore,
  ShirtId,
  ShopItem,
  TIME_MODES,
  TurnMatch,
  TurnPlayerResult,
} from './types/game';

const STORAGE_KEY = 'dudu_tata_save_v3';
const PREV_STORAGE_KEY = 'dudu_tata_save_v2';

const DEFAULT_LOADOUT: EquippedLoadout = {
  hat: null,
  glasses: null,
  shirt: null,
  costume: null,
};

function createDefaultSaveStore(): PlayerSaveStore {
  return {
    tataBest: 0,
    duduBest: 0,
    bestCombo: 0,
    totalPoints: 0,
    rupiahBalance: 0,
    exchangeCount: 0,
    ownedItems: [],
    equippedByChar: {
      dudu: { ...DEFAULT_LOADOUT },
      tata: { ...DEFAULT_LOADOUT },
    },
    equippedCarpet: 'default',
    boosterCounts: {
      boost_speed: 0,
      boost_time2x: 0,
    },
    armedBoosters: {
      speedBoost: false,
      time2xBoost: false,
    },
  };
}

function loadSaveStore(): PlayerSaveStore {
  const base = createDefaultSaveStore();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(PREV_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PlayerSaveStore>;
      return {
        tataBest: typeof p.tataBest === 'number' ? p.tataBest : 0,
        duduBest: typeof p.duduBest === 'number' ? p.duduBest : 0,
        bestCombo: typeof p.bestCombo === 'number' ? p.bestCombo : 0,
        totalPoints: typeof p.totalPoints === 'number' ? p.totalPoints : 0,
        rupiahBalance: typeof p.rupiahBalance === 'number' ? p.rupiahBalance : 0,
        exchangeCount: typeof p.exchangeCount === 'number' ? p.exchangeCount : 0,
        ownedItems: Array.isArray(p.ownedItems) ? p.ownedItems : [],
        equippedByChar: {
          dudu: {
            hat: p.equippedByChar?.dudu?.hat ?? null,
            glasses: p.equippedByChar?.dudu?.glasses ?? null,
            shirt: p.equippedByChar?.dudu?.shirt ?? null,
            costume: p.equippedByChar?.dudu?.costume ?? null,
          },
          tata: {
            hat: p.equippedByChar?.tata?.hat ?? null,
            glasses: p.equippedByChar?.tata?.glasses ?? null,
            shirt: p.equippedByChar?.tata?.shirt ?? null,
            costume: p.equippedByChar?.tata?.costume ?? null,
          },
        },
        equippedCarpet: p.equippedCarpet ?? 'default',
        boosterCounts: {
          boost_speed: p.boosterCounts?.boost_speed ?? 0,
          boost_time2x: p.boosterCounts?.boost_time2x ?? 0,
        },
        armedBoosters: {
          speedBoost: Boolean(p.armedBoosters?.speedBoost),
          time2xBoost: Boolean(p.armedBoosters?.time2xBoost),
        },
      };
    }
  } catch {
    // ignore storage errors
  }
  return base;
}

function persistSaveStore(store: PlayerSaveStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage errors
  }
}

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  timeLeft: TIME_MODES[60].durationSec,
  lives: MAX_PLAYER_LIVES,
  maxLives: MAX_PLAYER_LIVES,
  combo: 0,
  maxCombo: 0,
  multiplier: 1,
  feverActive: false,
  feverProgress: 0,
  feverTimeLeft: 0,
  itemsCaught: 0,
  hazardsHit: 0,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('dudu');
  const [durationMode, setDurationMode] = useState<InGameDuration>(60);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const [hazardFlash, setHazardFlash] = useState(false);
  const [bombReturnNotice, setBombReturnNotice] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [saveStore, setSaveStore] = useState<PlayerSaveStore>(loadSaveStore);
  const [roundBoosters, setRoundBoosters] = useState<ActiveBoosters>({
    speedBoost: false,
    time2xBoost: false,
  });
  const [overModal, setOverModal] = useState<'none' | 'exchange' | 'shop'>('none');
  const [lastRecordInfo, setLastRecordInfo] = useState<{
    previousBest: number;
    isNewRecord: boolean;
  }>({ previousBest: 0, isNewRecord: false });

  // Firebase Cloud Profile & Direct-Invite Live Turn-Based Mabar state
  const [user, setUser] = useState<User | null>(null);
  const [playerCode, setPlayerCode] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<TurnMatch | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<TurnMatch[]>([]);
  const [localRole, setLocalRole] = useState<'player1' | 'player2' | null>(null);
  const [activeDuelTurn, setActiveDuelTurn] = useState<{
    matchId: string;
    role: 'player1' | 'player2';
    durationSec: InGameDuration;
  } | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<AuthErrorDetail | null>(null);
  const [matchBusy, setMatchBusy] = useState(false);

  const selectedCharRef = useRef<CharacterId>(selectedCharacter);
  selectedCharRef.current = selectedCharacter;

  const saveStoreRef = useRef<PlayerSaveStore>(saveStore);
  saveStoreRef.current = saveStore;

  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

  const userRef = useRef<User | null>(user);
  userRef.current = user;

  const playerCodeRef = useRef<string | null>(playerCode);
  playerCodeRef.current = playerCode;

  const activeMatchRef = useRef<TurnMatch | null>(activeMatch);
  activeMatchRef.current = activeMatch;

  const localRoleRef = useRef<'player1' | 'player2' | null>(localRole);
  localRoleRef.current = localRole;

  const activeDuelTurnRef = useRef(activeDuelTurn);
  activeDuelTurnRef.current = activeDuelTurn;

  const liveStreamBusyRef = useRef(false);
  const launchedMatchPhaseRef = useRef<string | null>(null);

  const saveAndSync = useCallback((next: PlayerSaveStore) => {
    saveStoreRef.current = next;
    setSaveStore(next);
    persistSaveStore(next);
    const curUser = userRef.current;
    const code = playerCodeRef.current;
    if (curUser && code) {
      setCloudSynced(false);
      syncCloudProfile(curUser, code, next, selectedCharRef.current)
        .then(() => setCloudSynced(true))
        .catch((err) => {
          console.error('Cloud profile sync failed:', err);
        });
    }
  }, []);

  // Auth listener -> loads or creates Firestore Cloud Profile + unique 6-digit playerCode
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setPlayerCode(null);
        setCloudSynced(false);
        setActiveMatchId(null);
        setActiveMatch(null);
        setIncomingInvites([]);
        setLocalRole(null);
        setActiveDuelTurn(null);
        return;
      }
      setAuthError(null);
      try {
        const result = await loadOrCreateCloudProfile(
          nextUser,
          saveStoreRef.current,
          selectedCharRef.current,
        );
        setPlayerCode(result.playerCode);
        saveStoreRef.current = result.store;
        setSaveStore(result.store);
        persistSaveStore(result.store);
        engineRef.current?.applyLoadouts(
          result.store.equippedByChar,
          result.store.equippedCarpet,
        );
        setCloudSynced(true);
      } catch (err) {
        console.error('Failed loading cloud profile:', err);
      }
    });
    return () => unsub();
  }, []);

  // Incoming mabar invites listener
  useEffect(() => {
    if (!user) {
      setIncomingInvites([]);
      return;
    }
    const unsub = subscribeIncomingInvites(
      user.uid,
      (invites) => setIncomingInvites(invites),
      (err) => console.error('Incoming invites listener error:', err),
    );
    return () => unsub();
  }, [user]);

  const startMyDuelTurn = useCallback((match: TurnMatch, role: 'player1' | 'player2') => {
    const turnChar = role === 'player1' ? match.player1Char : match.player2Char;
    launchedMatchPhaseRef.current = `${match.matchId}:${match.status}:${role}`;
    setSelectedCharacter(turnChar);
    engineRef.current?.setSelectedCharacter(turnChar);
    setActiveDuelTurn({
      matchId: match.matchId,
      role,
      durationSec: match.durationSec,
    });
    setRoundBoosters({ speedBoost: false, time2xBoost: false });
    setBombReturnNotice(null);
    setOverModal('none');
    setShowInviteModal(false);
    setPopups([]);
    setHud({
      ...INITIAL_HUD,
      lives: MAX_PLAYER_LIVES,
      maxLives: MAX_PLAYER_LIVES,
      timeLeft: match.durationSec,
    });
    setPhase('playing');
    engineRef.current?.startGame(
      turnChar,
      match.durationSec,
      { speedBoost: false, time2xBoost: false },
      { streamLive: true },
    );
  }, []);

  const enterSpectatorArena = useCallback(
    (charId: CharacterId, durationSec: number) => {
      setOverModal('none');
      setShowInviteModal(false);
      setPopups([]);
      setHud({
        ...INITIAL_HUD,
        lives: MAX_PLAYER_LIVES,
        maxLives: MAX_PLAYER_LIVES,
        timeLeft: durationSec,
      });
      setPhase('spectating');
      engineRef.current?.startSpectating(charId, durationSec);
    },
    [],
  );

  // Live Match subscription -> Drives automatic 3D arena entry, live spectating, and turn transitions
  useEffect(() => {
    if (!user || !activeMatchId) {
      setActiveMatch(null);
      launchedMatchPhaseRef.current = null;
      return;
    }

    const unsub = subscribeMatch(
      activeMatchId,
      (match) => {
        if (!match) {
          setActiveMatch(null);
          setActiveMatchId(null);
          setLocalRole(null);
          launchedMatchPhaseRef.current = null;
          return;
        }
        setActiveMatch(match);

        const role =
          localRoleRef.current ||
          (user.uid === match.player2Uid ? 'player2' : 'player1');

        if (match.status === 'declined') {
          setActiveDuelTurn(null);
          setActiveMatchId(null);
          setActiveMatch(null);
          setLocalRole(null);
          launchedMatchPhaseRef.current = null;
          if (phaseRef.current === 'spectating' || phaseRef.current === 'playing') {
            engineRef.current?.returnToMenu();
            setPhase('menu');
          }
          setMatchError('Undangan mabar dibatalkan atau ditolak.');
          return;
        }

        if (match.status === 'player1_turn') {
          const key = `${match.matchId}:player1_turn:${role}`;
          if (role === 'player1') {
            if (launchedMatchPhaseRef.current !== key) {
              startMyDuelTurn(match, 'player1');
            }
          } else {
            if (phaseRef.current !== 'spectating') {
              launchedMatchPhaseRef.current = key;
              enterSpectatorArena(match.player1Char, match.durationSec);
            }
            if (match.liveState) {
              engineRef.current?.applyRemoteLiveState(match.liveState);
              setHud((prev) => ({
                ...prev,
                score: match.liveState!.score,
                timeLeft: match.liveState!.timeLeft,
                lives: match.liveState!.lives,
                combo: match.liveState!.combo,
                maxCombo: match.liveState!.maxCombo,
                itemsCaught: match.liveState!.itemsCaught,
                feverActive: match.liveState!.feverActive,
                multiplier:
                  (1 + Math.min(4, Math.floor(match.liveState!.combo / 4))) *
                  (match.liveState!.feverActive ? 2 : 1),
              }));
            }
          }
          return;
        }

        if (match.status === 'player2_turn') {
          if (role === 'player1') {
            // Player 1 watches Player 2 live in the 3D arena while waiting for match result!
            if (phaseRef.current !== 'spectating' && phaseRef.current !== 'playing') {
              enterSpectatorArena(match.player2Char, match.durationSec);
            }
            if (match.liveState) {
              engineRef.current?.applyRemoteLiveState(match.liveState);
              setHud((prev) => ({
                ...prev,
                score: match.liveState!.score,
                timeLeft: match.liveState!.timeLeft,
                lives: match.liveState!.lives,
                combo: match.liveState!.combo,
                maxCombo: match.liveState!.maxCombo,
                itemsCaught: match.liveState!.itemsCaught,
                feverActive: match.liveState!.feverActive,
                multiplier:
                  (1 + Math.min(4, Math.floor(match.liveState!.combo / 4))) *
                  (match.liveState!.feverActive ? 2 : 1),
              }));
            }
          } else {
            // Player 2 stays on 3D arena and sees "Giliranmu Sekarang! Mulai Main" CTA
            if (phaseRef.current !== 'playing' && phaseRef.current !== 'spectating') {
              enterSpectatorArena(match.player2Char, match.durationSec);
            }
          }
          return;
        }

        if (match.status === 'finished') {
          setActiveDuelTurn(null);
          launchedMatchPhaseRef.current = null;
          if (phaseRef.current === 'spectating' || phaseRef.current === 'playing') {
            engineRef.current?.returnToMenu();
            setPhase('menu');
          }
          setShowInviteModal(true);
        }
      },
      (err) => {
        setMatchError(err.message);
      },
    );

    return () => unsub();
  }, [activeMatchId, enterSpectatorArena, startMyDuelTurn, user]);

  const handlePopup = useCallback((popup: FloatingPopup) => {
    setPopups((prev) => [...prev.slice(-8), popup]);
    window.setTimeout(() => {
      setPopups((prev) => prev.filter((item) => item.id !== popup.id));
    }, 850);
  }, []);

  const handleHazardHit = useCallback(() => {
    setHazardFlash(true);
    window.setTimeout(() => {
      setHazardFlash(false);
    }, 180);
  }, []);

  const handleLiveFrame = useCallback((frame: Omit<LiveMatchState, 'turnUid'>) => {
    const duel = activeDuelTurnRef.current;
    const curUser = userRef.current;
    if (!duel || !curUser || liveStreamBusyRef.current) return;

    liveStreamBusyRef.current = true;
    pushLiveMatchState(duel.matchId, {
      ...frame,
      turnUid: curUser.uid,
    })
      .catch((err) => {
        console.error('Live stream frame skipped:', err);
      })
      .finally(() => {
        liveStreamBusyRef.current = false;
      });
  }, []);

  const finalizeDuelTurn = useCallback(
    async (
      finalHud: HudSnapshot,
      duel: { matchId: string; role: 'player1' | 'player2'; durationSec: InGameDuration },
    ) => {
      const charId = selectedCharRef.current;
      const current = saveStoreRef.current;
      const updated: PlayerSaveStore = {
        ...current,
        tataBest:
          charId === 'tata' ? Math.max(current.tataBest, finalHud.score) : current.tataBest,
        duduBest:
          charId === 'dudu' ? Math.max(current.duduBest, finalHud.score) : current.duduBest,
        bestCombo: Math.max(current.bestCombo, finalHud.maxCombo),
        totalPoints: current.totalPoints + finalHud.score,
      };
      saveAndSync(updated);

      const turnResult: TurnPlayerResult = {
        score: finalHud.score,
        maxCombo: finalHud.maxCombo,
        itemsCaught: finalHud.itemsCaught,
        hazardsHit: finalHud.hazardsHit,
        livesLeft: finalHud.lives,
        durationUsed: Math.max(1, duel.durationSec - finalHud.timeLeft),
      };

      setActiveDuelTurn(null);
      setPopups([]);
      setOverModal('none');

      if (duel.role === 'player1') {
        const curMatch = activeMatchRef.current;
        if (curMatch) {
          enterSpectatorArena(curMatch.player2Char, curMatch.durationSec);
        } else {
          engineRef.current?.returnToMenu();
          setPhase('menu');
        }
        try {
          await finishPlayer1Turn(duel.matchId, turnResult);
        } catch (err) {
          setMatchError(
            err instanceof Error ? err.message : 'Gagal mengirim skor giliran ke server.',
          );
        }
      } else {
        engineRef.current?.returnToMenu();
        setPhase('menu');
        setShowInviteModal(true);
        try {
          if (activeMatchRef.current) {
            await finishPlayer2Turn(activeMatchRef.current, turnResult);
          }
        } catch (err) {
          setMatchError(
            err instanceof Error ? err.message : 'Gagal menyelesaikan pertandingan.',
          );
        }
      }
    },
    [enterSpectatorArena, saveAndSync],
  );

  const handleGameOver = useCallback(
    (finalHud: HudSnapshot) => {
      const duel = activeDuelTurnRef.current;
      if (duel) {
        void finalizeDuelTurn(finalHud, duel);
        return;
      }

      const charId = selectedCharRef.current;
      const current = saveStoreRef.current;
      const prevBest = charId === 'dudu' ? current.duduBest : current.tataBest;
      const isNewRecord = finalHud.score > prevBest && finalHud.score > 0;

      const updated: PlayerSaveStore = {
        ...current,
        tataBest:
          charId === 'tata' ? Math.max(current.tataBest, finalHud.score) : current.tataBest,
        duduBest:
          charId === 'dudu' ? Math.max(current.duduBest, finalHud.score) : current.duduBest,
        bestCombo: Math.max(current.bestCombo, finalHud.maxCombo),
        totalPoints: current.totalPoints + finalHud.score,
      };

      setLastRecordInfo({ previousBest: prevBest, isNewRecord });
      saveAndSync(updated);
      setPhase('gameover');
    },
    [finalizeDuelTurn, saveAndSync],
  );

  const handleLivesDepleted = useCallback(
    (finalHud: HudSnapshot) => {
      const duel = activeDuelTurnRef.current;
      if (duel) {
        void finalizeDuelTurn(finalHud, duel);
        return;
      }

      const charId = selectedCharRef.current;
      const current = saveStoreRef.current;

      const updated: PlayerSaveStore = {
        ...current,
        tataBest:
          charId === 'tata' ? Math.max(current.tataBest, finalHud.score) : current.tataBest,
        duduBest:
          charId === 'dudu' ? Math.max(current.duduBest, finalHud.score) : current.duduBest,
        bestCombo: Math.max(current.bestCombo, finalHud.maxCombo),
        totalPoints: current.totalPoints + finalHud.score,
      };

      saveAndSync(updated);
      setPopups([]);
      setOverModal('none');
      setBombReturnNotice(
        finalHud.score > 0
          ? `Nyawa habis terkena bom! +${finalHud.score} poin tetap masuk celengan.`
          : 'Nyawa habis terkena 3 bom! Hati-hati hindari bom hitam ya.',
      );
      setPhase('menu');
    },
    [finalizeDuelTurn, saveAndSync],
  );

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onPopup: handlePopup,
      onGameOver: handleGameOver,
      onLivesDepleted: handleLivesDepleted,
      onHazardHit: handleHazardHit,
      onLiveFrame: handleLiveFrame,
    });
    engineRef.current = engine;

    const initialStore = saveStoreRef.current;
    engine.applyLoadouts(initialStore.equippedByChar, initialStore.equippedCarpet);

    return () => {
      soundEngine.stopBgm();
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleGameOver, handleHazardHit, handleLiveFrame, handleLivesDepleted, handlePopup]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (phaseRef.current === 'playing') {
          engineRef.current?.setPaused(true);
          setPhase('paused');
        } else if (phaseRef.current === 'paused') {
          engineRef.current?.setPaused(false);
          setPhase('playing');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectCharacter = (id: CharacterId) => {
    soundEngine.playClick();
    setSelectedCharacter(id);
    engineRef.current?.setSelectedCharacter(id);
  };

  const handleSelectDuration = (mode: InGameDuration) => {
    soundEngine.playClick();
    setDurationMode(mode);
    engineRef.current?.setDurationMode(mode);
  };

  const handleStartGame = () => {
    soundEngine.playClick();
    const cur = saveStoreRef.current;
    const active: ActiveBoosters = {
      speedBoost: cur.armedBoosters.speedBoost && cur.boosterCounts.boost_speed > 0,
      time2xBoost: cur.armedBoosters.time2xBoost && cur.boosterCounts.boost_time2x > 0,
    };

    if (active.speedBoost || active.time2xBoost) {
      const nextSpeedCount = active.speedBoost
        ? Math.max(0, cur.boosterCounts.boost_speed - 1)
        : cur.boosterCounts.boost_speed;
      const nextTimeCount = active.time2xBoost
        ? Math.max(0, cur.boosterCounts.boost_time2x - 1)
        : cur.boosterCounts.boost_time2x;

      const nextStore: PlayerSaveStore = {
        ...cur,
        boosterCounts: {
          boost_speed: nextSpeedCount,
          boost_time2x: nextTimeCount,
        },
        armedBoosters: {
          speedBoost: nextSpeedCount > 0 ? cur.armedBoosters.speedBoost : false,
          time2xBoost: nextTimeCount > 0 ? cur.armedBoosters.time2xBoost : false,
        },
      };
      saveAndSync(nextStore);
    }

    setActiveDuelTurn(null);
    setRoundBoosters(active);
    setBombReturnNotice(null);
    setOverModal('none');
    setPopups([]);
    const baseSec = TIME_MODES[durationMode].durationSec;
    setHud({
      ...INITIAL_HUD,
      lives: MAX_PLAYER_LIVES,
      maxLives: MAX_PLAYER_LIVES,
      timeLeft: active.time2xBoost ? baseSec * 2 : baseSec,
    });
    setPhase('playing');
    engineRef.current?.startGame(selectedCharacter, durationMode, active);
  };

  const handleGoogleLogin = async () => {
    soundEngine.playClick();
    setMatchError(null);
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      const parsed = parseAuthError(err);
      setAuthError(parsed);
      setMatchError(parsed.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleLogout = async () => {
    soundEngine.playClick();
    setAuthError(null);
    await signOutFirebase();
  };

  const handleSendInvite = async (
    targetCode: string,
    myChar: CharacterId,
    duration: InGameDuration,
  ) => {
    if (!user || !playerCode) return;
    soundEngine.playClick();
    setMatchError(null);
    setMatchBusy(true);
    try {
      const { match } = await sendMabarInvite(user, playerCode, myChar, targetCode, duration);
      setLocalRole('player1');
      setActiveMatch(match);
      setActiveMatchId(match.matchId);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'Gagal mengirim undangan mabar.');
    } finally {
      setMatchBusy(false);
    }
  };

  const handleAcceptInvite = async (match: TurnMatch, myChar: CharacterId) => {
    if (!user) return;
    soundEngine.playClick();
    setMatchError(null);
    setMatchBusy(true);
    try {
      setLocalRole('player2');
      setActiveMatch({ ...match, player2Char: myChar, status: 'player1_turn' });
      setActiveMatchId(match.matchId);
      await acceptMabarInvite(match.matchId, user, myChar);
      enterSpectatorArena(match.player1Char, match.durationSec);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'Gagal menerima undangan.');
    } finally {
      setMatchBusy(false);
    }
  };

  const handleDeclineInvite = async (matchId: string) => {
    soundEngine.playClick();
    try {
      await declineOrCancelInvite(matchId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOutgoingInvite = async (matchId: string) => {
    soundEngine.playClick();
    try {
      await declineOrCancelInvite(matchId);
    } catch (err) {
      console.error(err);
    }
    setActiveMatchId(null);
    setActiveMatch(null);
    setLocalRole(null);
  };

  const handleClearMatch = () => {
    soundEngine.playClick();
    setActiveMatchId(null);
    setActiveMatch(null);
    setLocalRole(null);
    setMatchError(null);
    launchedMatchPhaseRef.current = null;
  };

  const handleTogglePause = () => {
    soundEngine.playClick();
    if (phase === 'playing') {
      engineRef.current?.setPaused(true);
      setPhase('paused');
    } else if (phase === 'paused') {
      engineRef.current?.setPaused(false);
      setPhase('playing');
    }
  };

  const handleBackToMenu = () => {
    soundEngine.playClick();
    setActiveDuelTurn(null);
    setActiveMatchId(null);
    setActiveMatch(null);
    setLocalRole(null);
    launchedMatchPhaseRef.current = null;
    setOverModal('none');
    setPopups([]);
    engineRef.current?.returnToMenu();
    setPhase('menu');
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.playClick();
      if (phase === 'playing') {
        soundEngine.startBgm(hud.feverActive);
      }
    }
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    soundEngine.setVibrationEnabled(next);
    if (next) {
      soundEngine.vibrate(25);
    }
    soundEngine.playClick();
  };

  const handleExchangePoints = (tier: ExchangeTier) => {
    const prev = saveStoreRef.current;
    if (prev.totalPoints < tier.pointsCost) return;
    const next: PlayerSaveStore = {
      ...prev,
      totalPoints: prev.totalPoints - tier.pointsCost,
      rupiahBalance: prev.rupiahBalance + tier.rupiahValue,
      exchangeCount: prev.exchangeCount + 1,
    };
    saveAndSync(next);
    soundEngine.playExchangeCoin();
  };

  const handleBuyShopItem = (item: ShopItem) => {
    const cur = saveStoreRef.current;
    if (cur.rupiahBalance < item.priceRupiah) return;

    if (item.category === 'booster') {
      const nextSpeed =
        item.id === 'boost_speed'
          ? cur.boosterCounts.boost_speed + 1
          : cur.boosterCounts.boost_speed;
      const nextTime =
        item.id === 'boost_time2x'
          ? cur.boosterCounts.boost_time2x + 1
          : cur.boosterCounts.boost_time2x;
      const next: PlayerSaveStore = {
        ...cur,
        rupiahBalance: cur.rupiahBalance - item.priceRupiah,
        boosterCounts: {
          boost_speed: nextSpeed,
          boost_time2x: nextTime,
        },
        armedBoosters: {
          speedBoost: item.id === 'boost_speed' ? true : cur.armedBoosters.speedBoost,
          time2xBoost: item.id === 'boost_time2x' ? true : cur.armedBoosters.time2xBoost,
        },
      };
      saveAndSync(next);
      soundEngine.playExchangeCoin();
      return;
    }

    if (cur.ownedItems.includes(item.id)) return;

    const updatedOwned = [...cur.ownedItems, item.id];
    const nextEquippedByChar: Record<CharacterId, EquippedLoadout> = {
      dudu: { ...cur.equippedByChar.dudu },
      tata: { ...cur.equippedByChar.tata },
    };
    let nextCarpet = cur.equippedCarpet;

    if (item.category === 'hat') {
      nextEquippedByChar[selectedCharacter].hat = item.id as HatId;
    } else if (item.category === 'glasses') {
      nextEquippedByChar[selectedCharacter].glasses = item.id as GlassesId;
    } else if (item.category === 'shirt') {
      nextEquippedByChar[selectedCharacter].shirt = item.id as ShirtId;
    } else if (item.category === 'costume') {
      nextEquippedByChar[selectedCharacter].costume = item.id as CostumeId;
    } else if (item.category === 'carpet') {
      nextCarpet = item.id as CarpetId;
    }

    const next: PlayerSaveStore = {
      ...cur,
      rupiahBalance: cur.rupiahBalance - item.priceRupiah,
      ownedItems: updatedOwned,
      equippedByChar: nextEquippedByChar,
      equippedCarpet: nextCarpet,
    };
    saveAndSync(next);
    engineRef.current?.applyLoadouts(
      nextEquippedByChar,
      nextCarpet,
      item.category === 'carpet' ? undefined : selectedCharacter,
    );
    soundEngine.playExchangeCoin();
  };

  const handleToggleEquipItem = (item: ShopItem, charId: CharacterId) => {
    const cur = saveStoreRef.current;
    if (!cur.ownedItems.includes(item.id)) return;

    const nextEquippedByChar: Record<CharacterId, EquippedLoadout> = {
      dudu: { ...cur.equippedByChar.dudu },
      tata: { ...cur.equippedByChar.tata },
    };
    let nextCarpet = cur.equippedCarpet;

    if (item.category === 'hat') {
      nextEquippedByChar[charId].hat =
        nextEquippedByChar[charId].hat === item.id ? null : (item.id as HatId);
    } else if (item.category === 'glasses') {
      nextEquippedByChar[charId].glasses =
        nextEquippedByChar[charId].glasses === item.id ? null : (item.id as GlassesId);
    } else if (item.category === 'shirt') {
      nextEquippedByChar[charId].shirt =
        nextEquippedByChar[charId].shirt === item.id ? null : (item.id as ShirtId);
    } else if (item.category === 'costume') {
      nextEquippedByChar[charId].costume =
        nextEquippedByChar[charId].costume === item.id ? null : (item.id as CostumeId);
    } else if (item.category === 'carpet') {
      nextCarpet = nextCarpet === item.id ? 'default' : (item.id as CarpetId);
    }

    const next: PlayerSaveStore = {
      ...cur,
      equippedByChar: nextEquippedByChar,
      equippedCarpet: nextCarpet,
    };
    saveAndSync(next);
    engineRef.current?.applyLoadouts(
      nextEquippedByChar,
      nextCarpet,
      item.category === 'carpet' ? undefined : charId,
    );
    soundEngine.playClick();
  };

  const handleToggleBoosterArm = (boosterId: 'boost_speed' | 'boost_time2x') => {
    soundEngine.playClick();
    const prev = saveStoreRef.current;
    const next: PlayerSaveStore = {
      ...prev,
      armedBoosters: {
        speedBoost:
          boosterId === 'boost_speed'
            ? !prev.armedBoosters.speedBoost && prev.boosterCounts.boost_speed > 0
            : prev.armedBoosters.speedBoost,
        time2xBoost:
          boosterId === 'boost_time2x'
            ? !prev.armedBoosters.time2xBoost && prev.boosterCounts.boost_time2x > 0
            : prev.armedBoosters.time2xBoost,
      },
    };
    saveAndSync(next);
  };

  const duelBadge = activeDuelTurn
    ? `Mabar Live · ${activeDuelTurn.role === 'player1' ? 'Giliran P1' : 'Giliran P2'}`
    : null;

  const spectatingCharId: CharacterId =
    phase === 'spectating' && activeMatch
      ? activeMatch.status === 'player1_turn'
        ? activeMatch.player1Char
        : activeMatch.player2Char
      : selectedCharacter;

  const spectatingName =
    phase === 'spectating' && activeMatch
      ? activeMatch.status === 'player1_turn'
        ? activeMatch.player1Name
        : activeMatch.player2Name
      : null;

  const readyForMyTurn =
    phase === 'spectating' &&
    Boolean(activeMatch) &&
    activeMatch?.status === 'player2_turn' &&
    localRole === 'player2';

  const targetScoreToBeat =
    activeMatch?.status === 'player2_turn' ? (activeMatch.player1Result?.score ?? null) : null;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#FFE8EC]">
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Arena 2.5D Dudu dan Tata"
      />

      {phase === 'menu' && (
        <CharacterDashboard
          selectedCharacter={selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          durationMode={durationMode}
          onSelectDuration={handleSelectDuration}
          saveStore={saveStore}
          user={user}
          playerCode={playerCode}
          authBusy={authBusy}
          cloudSynced={cloudSynced}
          showInviteModal={showInviteModal}
          activeMatch={activeMatch}
          incomingInvites={incomingInvites}
          matchError={matchError}
          authError={authError}
          matchBusy={matchBusy}
          muted={muted}
          vibrationEnabled={vibrationEnabled}
          bombReturnNotice={bombReturnNotice}
          onDismissBombNotice={() => setBombReturnNotice(null)}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
          onOpenInviteModal={() => {
            soundEngine.playClick();
            setMatchError(null);
            setShowInviteModal(true);
          }}
          onCloseInviteModal={() => {
            soundEngine.playClick();
            setShowInviteModal(false);
          }}
          onSendInvite={handleSendInvite}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
          onCancelOutgoingInvite={handleCancelOutgoingInvite}
          onClearMatch={handleClearMatch}
          onToggleMute={handleToggleMute}
          onToggleVibration={handleToggleVibration}
          onExchangePoints={handleExchangePoints}
          onBuyShopItem={handleBuyShopItem}
          onToggleEquipItem={handleToggleEquipItem}
          onToggleBoosterArm={handleToggleBoosterArm}
          onStartGame={handleStartGame}
        />
      )}

      {(phase === 'playing' || phase === 'paused' || phase === 'spectating') && (
        <GameHUD
          characterId={spectatingCharId}
          phase={phase}
          hud={hud}
          popups={popups}
          activeBoosters={roundBoosters}
          hazardFlash={hazardFlash}
          duelBadge={duelBadge}
          spectatingName={spectatingName}
          targetScoreToBeat={targetScoreToBeat}
          readyForMyTurn={readyForMyTurn}
          onStartMyTurn={() => {
            if (activeMatch) {
              soundEngine.playClick();
              startMyDuelTurn(activeMatch, 'player2');
            }
          }}
          muted={muted}
          vibrationEnabled={vibrationEnabled}
          onToggleMute={handleToggleMute}
          onToggleVibration={handleToggleVibration}
          onTogglePause={handleTogglePause}
          onRestart={handleStartGame}
          onBackToMenu={handleBackToMenu}
          onVirtualMove={(dir) => engineRef.current?.setVirtualMove(dir)}
          onJump={() => engineRef.current?.triggerJump()}
        />
      )}

      {phase === 'gameover' && (
        <GameOverModal
          characterId={selectedCharacter}
          summary={hud}
          previousBest={lastRecordInfo.previousBest}
          isNewRecord={lastRecordInfo.isNewRecord}
          totalPointsAfter={saveStore.totalPoints}
          onPlayAgain={handleStartGame}
          onOpenExchange={() => {
            soundEngine.playClick();
            setOverModal('exchange');
          }}
          onChooseCharacter={handleBackToMenu}
        />
      )}

      {phase === 'gameover' && overModal === 'exchange' && (
        <ExchangeModal
          totalPoints={saveStore.totalPoints}
          rupiahBalance={saveStore.rupiahBalance}
          onExchange={handleExchangePoints}
          onOpenShop={() => {
            soundEngine.playClick();
            setOverModal('shop');
          }}
          onClose={() => {
            soundEngine.playClick();
            setOverModal('none');
          }}
        />
      )}

      {phase === 'gameover' && overModal === 'shop' && (
        <ShopModal
          saveStore={saveStore}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          onBuyItem={handleBuyShopItem}
          onToggleEquip={handleToggleEquipItem}
          onToggleBoosterArm={handleToggleBoosterArm}
          onOpenExchange={() => {
            soundEngine.playClick();
            setOverModal('exchange');
          }}
          onClose={() => {
            soundEngine.playClick();
            setOverModal('none');
          }}
        />
      )}
    </main>
  );
}

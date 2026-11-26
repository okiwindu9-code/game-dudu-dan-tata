import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { CharacterDashboard } from './components/CharacterDashboard';
import { ExchangeModal } from './components/ExchangeModal';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { GameEngine } from './three/GameEngine';
import {
  ActiveBoosters,
  CarpetId,
  CharacterId,
  EquippedLoadout,
  ExchangeTier,
  FloatingPopup,
  GamePhase,
  GlassesId,
  HatId,
  HudSnapshot,
  InGameDuration,
  PlayerSaveStore,
  ShirtId,
  ShopItem,
  TIME_MODES,
} from './types/game';

const STORAGE_KEY = 'dudu_tata_save_v3';
const PREV_STORAGE_KEY = 'dudu_tata_save_v2';

const DEFAULT_LOADOUT: EquippedLoadout = {
  hat: null,
  glasses: null,
  shirt: null,
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
          },
          tata: {
            hat: p.equippedByChar?.tata?.hat ?? null,
            glasses: p.equippedByChar?.tata?.glasses ?? null,
            shirt: p.equippedByChar?.tata?.shirt ?? null,
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

  const selectedCharRef = useRef<CharacterId>(selectedCharacter);
  selectedCharRef.current = selectedCharacter;

  const saveStoreRef = useRef<PlayerSaveStore>(saveStore);
  saveStoreRef.current = saveStore;

  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

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

  const handleGameOver = useCallback((finalHud: HudSnapshot) => {
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
    setSaveStore(updated);
    persistSaveStore(updated);
    setPhase('gameover');
  }, []);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onPopup: handlePopup,
      onGameOver: handleGameOver,
      onHazardHit: handleHazardHit,
    });
    engineRef.current = engine;

    // Apply saved 3D hats, glasses, shirts & patterned carpet immediately
    const initialStore = saveStoreRef.current;
    engine.applyLoadouts(initialStore.equippedByChar, initialStore.equippedCarpet);

    return () => {
      soundEngine.stopBgm();
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleGameOver, handleHazardHit, handlePopup]);

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
      setSaveStore(nextStore);
      persistSaveStore(nextStore);
    }

    setRoundBoosters(active);
    setOverModal('none');
    setPopups([]);
    const baseSec = TIME_MODES[durationMode].durationSec;
    setHud({
      ...INITIAL_HUD,
      timeLeft: active.time2xBoost ? baseSec * 2 : baseSec,
    });
    setPhase('playing');
    engineRef.current?.startGame(selectedCharacter, durationMode, active);
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
    setSaveStore((prev) => {
      if (prev.totalPoints < tier.pointsCost) return prev;
      const next: PlayerSaveStore = {
        ...prev,
        totalPoints: prev.totalPoints - tier.pointsCost,
        rupiahBalance: prev.rupiahBalance + tier.rupiahValue,
        exchangeCount: prev.exchangeCount + 1,
      };
      persistSaveStore(next);
      return next;
    });
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
      setSaveStore(next);
      persistSaveStore(next);
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
    setSaveStore(next);
    persistSaveStore(next);
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
    } else if (item.category === 'carpet') {
      nextCarpet = nextCarpet === item.id ? 'default' : (item.id as CarpetId);
    }

    const next: PlayerSaveStore = {
      ...cur,
      equippedByChar: nextEquippedByChar,
      equippedCarpet: nextCarpet,
    };
    setSaveStore(next);
    persistSaveStore(next);
    engineRef.current?.applyLoadouts(
      nextEquippedByChar,
      nextCarpet,
      item.category === 'carpet' ? undefined : charId,
    );
    soundEngine.playClick();
  };

  const handleToggleBoosterArm = (boosterId: 'boost_speed' | 'boost_time2x') => {
    soundEngine.playClick();
    setSaveStore((prev) => {
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
      persistSaveStore(next);
      return next;
    });
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#FFE8EC]">
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
          muted={muted}
          vibrationEnabled={vibrationEnabled}
          onToggleMute={handleToggleMute}
          onToggleVibration={handleToggleVibration}
          onExchangePoints={handleExchangePoints}
          onBuyShopItem={handleBuyShopItem}
          onToggleEquipItem={handleToggleEquipItem}
          onToggleBoosterArm={handleToggleBoosterArm}
          onStartGame={handleStartGame}
        />
      )}

      {(phase === 'playing' || phase === 'paused') && (
        <GameHUD
          characterId={selectedCharacter}
          phase={phase}
          hud={hud}
          popups={popups}
          activeBoosters={roundBoosters}
          hazardFlash={hazardFlash}
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

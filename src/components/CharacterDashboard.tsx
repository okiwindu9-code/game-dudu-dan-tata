import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Coins,
  Play,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  CHARACTERS,
  CharacterId,
  ExchangeTier,
  InGameDuration,
  PlayerSaveStore,
  ShopItem,
  TIME_MODES,
} from '../types/game';
import { ExchangeModal, formatRupiah } from './ExchangeModal';
import { GuideModal } from './GuideModal';
import { ShopModal } from './ShopModal';

interface CharacterDashboardProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  durationMode: InGameDuration;
  onSelectDuration: (mode: InGameDuration) => void;
  saveStore: PlayerSaveStore;
  muted: boolean;
  vibrationEnabled: boolean;
  onToggleMute: () => void;
  onToggleVibration: () => void;
  onExchangePoints: (tier: ExchangeTier) => void;
  onBuyShopItem: (item: ShopItem) => void;
  onToggleEquipItem: (item: ShopItem, charId: CharacterId) => void;
  onToggleBoosterArm: (boosterId: 'boost_speed' | 'boost_time2x') => void;
  onStartGame: () => void;
}

export const CharacterDashboard: React.FC<CharacterDashboardProps> = ({
  selectedCharacter,
  onSelectCharacter,
  durationMode,
  onSelectDuration,
  saveStore,
  muted,
  vibrationEnabled,
  onToggleMute,
  onToggleVibration,
  onExchangePoints,
  onBuyShopItem,
  onToggleEquipItem,
  onToggleBoosterArm,
  onStartGame,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showShop, setShowShop] = useState(false);

  const canRedeemAny = saveStore.totalPoints >= 500;
  const hasAnyBooster =
    saveStore.boosterCounts.boost_speed > 0 || saveStore.boosterCounts.boost_time2x > 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3.5 sm:p-6">
      {/* Top Homescreen Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {/* Wallet Summary */}
          <button
            type="button"
            onClick={() => setShowExchange(true)}
            className="pointer-events-auto btn-25d flex items-center gap-3 rounded-2xl bg-[#FFFBF7] px-3.5 py-2 text-left"
          >
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-[#E89B2D]" />
              <span className="font-mono-num text-sm font-bold text-[#432B1D]">
                {saveStore.totalPoints.toLocaleString('id-ID')} Poin
              </span>
            </div>
            <span className="text-[#432B1D]/30" aria-hidden="true">
              ·
            </span>
            <div className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-[#2B9348]" />
              <span className="font-mono-num text-sm font-bold text-[#1F5C36]">
                {formatRupiah(saveStore.rupiahBalance)}
              </span>
            </div>
          </button>

          {/* Audio & Vibration Toggles */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleVibration}
              className={`btn-25d flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap ${
                vibrationEnabled
                  ? 'bg-[#FFFBF7] text-[#432B1D]'
                  : 'bg-[#F0E6DE] text-[#8F705D]'
              }`}
              aria-label={vibrationEnabled ? 'Matikan getaran' : 'Nyalakan getaran'}
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">
                {vibrationEnabled ? 'Getar On' : 'Getar Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="btn-25d flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBF7] text-[#432B1D] shrink-0"
              aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}
            >
              {muted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Hero Title "Dudu & Tata" */}
        <div className="mx-auto text-center">
          <div className="pointer-events-auto inline-flex items-center gap-3 rounded-3xl border-[2.5px] border-[#432B1D] bg-[#FFFBF7] px-5 py-2 shadow-[0_4px_0_#432B1D]">
            <img
              src="/assets/aistudio/images__1__876c8792.jpeg"
              alt="Dudu dan Tata"
              className="h-10 w-10 rounded-xl border-2 border-[#432B1D] object-cover sm:h-11 sm:w-11"
            />
            <div className="text-left">
              <h1 className="font-display text-2xl leading-none font-bold tracking-tight text-[#432B1D] sm:text-3xl">
                Dudu &amp; Tata
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-[#7A5B47]">
                Tangkap Buah 2.5D · Rekor Kombo{' '}
                <span className="font-mono-num font-bold text-[#432B1D]">
                  {saveStore.bestCombo}x
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Homescreen Control Dock */}
      <section
        aria-label="Menu Utama Dudu dan Tata"
        className="pointer-events-auto mx-auto w-full max-w-3xl card-25d rounded-3xl bg-[#FFFBF7] p-3.5 sm:p-4"
      >
        {/* 1. Pilih Karakter */}
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="font-display text-sm font-bold text-[#432B1D]">
            Pilih Karakter
          </span>
          <span className="text-xs font-semibold text-[#7A5B47]">
            Klik karakter untuk melihat gaya &amp; aksesorinya
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(['dudu', 'tata'] as CharacterId[]).map((id) => {
            const char = CHARACTERS[id];
            const isSelected = selectedCharacter === id;
            const best = id === 'dudu' ? saveStore.duduBest : saveStore.tataBest;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectCharacter(id)}
                className={`group flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-[#432B1D] bg-[#FFF2DF] shadow-[0_3px_0_#432B1D] -translate-y-0.5'
                    : 'border-[#432B1D]/25 bg-white hover:border-[#432B1D]/60 hover:bg-[#FFF9F4]'
                }`}
              >
                <div
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-2 border-[#432B1D]"
                  style={{ backgroundColor: char.softBg }}
                >
                  {id === 'tata' ? (
                    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
                      <circle cx="16" cy="18" r="8" fill="#C5936E" stroke="#432B1D" strokeWidth="3.5" />
                      <circle cx="16" cy="18" r="3.8" fill="#432B1D" />
                      <circle cx="48" cy="18" r="8" fill="#C5936E" stroke="#432B1D" strokeWidth="3.5" />
                      <circle cx="48" cy="18" r="3.8" fill="#432B1D" />
                      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#C5936E" stroke="#432B1D" strokeWidth="3.5" />
                      <circle cx="17" cy="41" r="5" fill="#F8C971" />
                      <circle cx="47" cy="41" r="5" fill="#F8C971" />
                      <circle cx="24" cy="35" r="2.7" fill="#432B1D" />
                      <circle cx="40" cy="35" r="2.7" fill="#432B1D" />
                      <path d="M28 38 Q30 41 32 38 Q34 41 36 38" fill="none" stroke="#432B1D" strokeWidth="2.4" strokeLinecap="round" />
                      <ellipse cx="32" cy="43" rx="3" ry="3.8" fill="#F18F8E" stroke="#432B1D" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
                      <circle cx="16" cy="18" r="8" fill="#432B1D" />
                      <circle cx="48" cy="18" r="8" fill="#432B1D" />
                      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#FDFAF6" stroke="#432B1D" strokeWidth="3.5" />
                      <circle cx="17" cy="41" r="5" fill="#F9B2B7" />
                      <circle cx="47" cy="41" r="5" fill="#F9B2B7" />
                      <circle cx="24" cy="35" r="2.7" fill="#432B1D" />
                      <circle cx="40" cy="35" r="2.7" fill="#432B1D" />
                      <path d="M28 38 Q30 41 32 38 Q34 41 36 38" fill="none" stroke="#432B1D" strokeWidth="2.4" strokeLinecap="round" />
                      <ellipse cx="32" cy="43" rx="3" ry="3.8" fill="#F18F8E" stroke="#432B1D" strokeWidth="2" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-lg font-bold text-[#432B1D]">
                      {char.name}
                    </span>
                    <span className="font-mono-num flex items-center gap-1 text-xs font-bold text-[#8A5A3B]">
                      <Trophy className="h-3.5 w-3.5 text-[#E89B2D]" />
                      {best}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#7A5B47]">
                    {char.title} · {char.traitTitle}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#8F705D]">
                    {char.traitDetail}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Pilih Waktu In-Game & Active Booster Quick Toggles */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-display text-xs font-bold text-[#432B1D] whitespace-nowrap">
              <Clock className="h-3.5 w-3.5 text-[#D94F70]" />
              Waktu Main:
            </span>
            <div className="flex flex-1 items-center gap-1 rounded-xl border-2 border-[#432B1D]/20 bg-[#F7EDE5] p-1">
              {([45, 60, 90] as InGameDuration[]).map((dur) => {
                const cfg = TIME_MODES[dur];
                const active = durationMode === dur;
                const effectiveSec = saveStore.armedBoosters.time2xBoost ? dur * 2 : dur;
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onSelectDuration(dur)}
                    className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[#432B1D] text-[#FFFBF7]'
                        : 'text-[#6A4C3A] hover:text-[#432B1D]'
                    }`}
                  >
                    {saveStore.armedBoosters.time2xBoost && active
                      ? `${effectiveSec} Detik (2x)`
                      : cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasAnyBooster ? (
            <div className="flex items-center gap-1.5">
              {saveStore.boosterCounts.boost_speed > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleBoosterArm('boost_speed')}
                  className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                    saveStore.armedBoosters.speedBoost
                      ? 'border-[#432B1D] bg-[#90E0EF] text-[#432B1D]'
                      : 'border-[#432B1D]/25 bg-white text-[#7A5B47]'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Speed+ ({saveStore.boosterCounts.boost_speed})</span>
                </button>
              )}
              {saveStore.boosterCounts.boost_time2x > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleBoosterArm('boost_time2x')}
                  className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                    saveStore.armedBoosters.time2xBoost
                      ? 'border-[#432B1D] bg-[#FFD166] text-[#432B1D]'
                      : 'border-[#432B1D]/25 bg-white text-[#7A5B47]'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Waktu 2x ({saveStore.boosterCounts.boost_time2x})</span>
                </button>
              )}
            </div>
          ) : (
            <span className="hidden text-xs font-semibold text-[#7A5B47] sm:inline">
              Mode: {TIME_MODES[durationMode].subtitle}
            </span>
          )}
        </div>

        {/* 3. Action Buttons: Panduan, Tukar Poin, Belanja & Main */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="btn-25d flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-3.5 py-2.5 font-display text-xs font-bold text-[#432B1D] whitespace-nowrap sm:flex-none sm:text-sm"
          >
            <BookOpen className="h-4 w-4 text-[#C4936E]" />
            <span>Panduan</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExchange(true)}
            className={`btn-25d flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3.5 py-2.5 font-display text-xs font-bold whitespace-nowrap sm:flex-none sm:text-sm ${
              canRedeemAny
                ? 'bg-[#FFD166] text-[#432B1D] hover:bg-[#FFC642]'
                : 'bg-[#FFF4E6] text-[#432B1D]'
            }`}
          >
            <Wallet className="h-4 w-4 text-[#2B9348]" />
            <span>Tukar Poin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShop(true)}
            className="btn-25d flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#E8F8EE] px-3.5 py-2.5 font-display text-xs font-bold text-[#1F5C36] whitespace-nowrap sm:flex-none sm:text-sm"
          >
            <ShoppingBag className="h-4 w-4 text-[#2B9348]" />
            <span>Belanja</span>
          </button>

          <button
            type="button"
            onClick={onStartGame}
            className="btn-25d flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F26B7A] px-5 py-2.5 font-display text-base font-bold text-white whitespace-nowrap hover:bg-[#EB5869] sm:w-auto"
          >
            <Play className="h-4.5 w-4.5 fill-current" />
            <span>Mainkan {CHARACTERS[selectedCharacter].name}</span>
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </section>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showExchange && (
        <ExchangeModal
          totalPoints={saveStore.totalPoints}
          rupiahBalance={saveStore.rupiahBalance}
          onExchange={onExchangePoints}
          onOpenShop={() => {
            setShowExchange(false);
            setShowShop(true);
          }}
          onClose={() => setShowExchange(false)}
        />
      )}

      {showShop && (
        <ShopModal
          saveStore={saveStore}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={onSelectCharacter}
          onBuyItem={onBuyShopItem}
          onToggleEquip={onToggleEquipItem}
          onToggleBoosterArm={onToggleBoosterArm}
          onOpenExchange={() => {
            setShowShop(false);
            setShowExchange(true);
          }}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
};

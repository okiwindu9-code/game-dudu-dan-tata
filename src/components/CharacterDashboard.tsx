import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Clock,
  Coins,
  Heart,
  Home,
  Play,
  Plus,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  CHARACTERS,
  CharacterId,
  ExchangeTier,
  InGameDuration,
  MAX_PLAYER_LIVES,
  PlayerSaveStore,
  ShopCategory,
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
  bombReturnNotice: string | null;
  onDismissBombNotice: () => void;
  onToggleMute: () => void;
  onToggleVibration: () => void;
  onExchangePoints: (tier: ExchangeTier) => void;
  onBuyShopItem: (item: ShopItem) => void;
  onToggleEquipItem: (item: ShopItem, charId: CharacterId) => void;
  onToggleBoosterArm: (boosterId: 'boost_speed' | 'boost_time2x') => void;
  onStartGame: () => void;
}

const DURATION_ORDER: InGameDuration[] = [45, 60, 90];

function formatCompactRupiah(val: number): string {
  if (val >= 1000000) return `Rp${(val / 1000000).toFixed(1)}jt`;
  if (val >= 1000) return `Rp${Math.round(val / 1000)}rb`;
  return `Rp${val}`;
}

export const CharacterDashboard: React.FC<CharacterDashboardProps> = ({
  selectedCharacter,
  onSelectCharacter,
  durationMode,
  onSelectDuration,
  saveStore,
  muted,
  vibrationEnabled,
  bombReturnNotice,
  onDismissBombNotice,
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
  const [shopTab, setShopTab] = useState<'all' | ShopCategory | null>(null);
  const [showCharacterDrawer, setShowCharacterDrawer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const activeChar = CHARACTERS[selectedCharacter];
  const canRedeemAny = saveStore.totalPoints >= 500;
  const pointsTowardNext = Math.min(500, saveStore.totalPoints);
  const progressPct = Math.min(100, Math.round((pointsTowardNext / 500) * 100));

  const effectiveDuration = saveStore.armedBoosters.time2xBoost
    ? durationMode * 2
    : durationMode;
  const totalBoosterStock =
    saveStore.boosterCounts.boost_speed + saveStore.boosterCounts.boost_time2x;
  const anyBoosterArmed =
    saveStore.armedBoosters.speedBoost || saveStore.armedBoosters.time2xBoost;

  const cycleDuration = () => {
    const idx = DURATION_ORDER.indexOf(durationMode);
    const next = DURATION_ORDER[(idx + 1) % DURATION_ORDER.length];
    onSelectDuration(next);
  };

  const toggleCharacterQuick = () => {
    onSelectCharacter(selectedCharacter === 'dudu' ? 'tata' : 'dudu');
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* TOP BAR + PROGRESS BANNER */}
      <header className="flex flex-col gap-2 px-3 pt-3 sm:mx-auto sm:w-full sm:max-w-3xl sm:px-6 sm:pt-4">
        {/* Top Row: Avatar · Points · Lives · Settings */}
        <div className="flex items-center justify-between gap-2">
          {/* Avatar Box */}
          <button
            type="button"
            onClick={() => setShowCharacterDrawer((v) => !v)}
            className="pointer-events-auto relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFFBF7] shadow-[0_3px_0_#432B1D] transition-transform active:translate-y-0.5 sm:h-12 sm:w-12"
            aria-label="Pilih Karakter Dudu atau Tata"
          >
            <img
              src="/assets/aistudio/images__1__876c8792.jpeg"
              alt="Dudu dan Tata"
              className="h-full w-full object-cover"
            />
          </button>

          {/* Center Status Counters (Points + Lives + Desktop Rupiah) */}
          <div className="pointer-events-auto flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2.5">
            {/* Coin / Points Counter */}
            <button
              type="button"
              onClick={() => setShowExchange(true)}
              className="btn-25d flex h-10 items-center gap-1.5 rounded-2xl bg-[#FFFBF7] px-2.5 sm:px-3.5"
              title="Tukar Poin ke Rupiah"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#432B1D] bg-[#FFD166]">
                <Coins className="h-3.5 w-3.5 text-[#432B1D]" strokeWidth={2.75} />
              </span>
              <span className="font-mono-num text-sm font-bold text-[#432B1D]">
                {saveStore.totalPoints.toLocaleString('id-ID')}
              </span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#432B1D] bg-[#49C829] text-white">
                <Plus className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>

            {/* Lives Counter */}
            <div
              className="card-25d flex h-10 items-center gap-1.5 rounded-2xl bg-[#FFFBF7] px-2.5 sm:px-3.5"
              title="Nyawa Awal Per Ronde"
            >
              <Heart
                className="h-5 w-5 shrink-0 fill-[#E63946] text-[#432B1D]"
                strokeWidth={2.5}
              />
              <span className="font-mono-num text-sm font-bold text-[#432B1D]">
                {MAX_PLAYER_LIVES}
              </span>
            </div>

            {/* Rupiah Pill (visible on sm+ in top strip; also on right medallion on mobile) */}
            <button
              type="button"
              onClick={() => setShowExchange(true)}
              className="btn-25d hidden h-10 items-center gap-1.5 rounded-2xl bg-[#E8F8EE] px-3 sm:flex"
            >
              <Wallet className="h-4 w-4 text-[#2B9348]" strokeWidth={2.75} />
              <span className="font-mono-num text-xs font-bold text-[#1F5C36]">
                {formatRupiah(saveStore.rupiahBalance)}
              </span>
            </button>
          </div>

          {/* Green Settings Gear Button */}
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="pointer-events-auto btn-25d flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#49C829] text-white sm:h-12 sm:w-12"
            aria-label="Pengaturan Suara dan Getar"
          >
            <Settings className="h-5.5 w-5.5 drop-shadow-[0_1.5px_0_#432B1D]" strokeWidth={2.75} />
          </button>
        </div>

        {/* Upper Title & Progress Bar (Reference-inspired center event/progress strip) */}
        <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col items-center">
          {/* Top attached mini tab */}
          <div className="-mb-1.5 z-10 flex items-center gap-2 rounded-t-xl border-[2.5px] border-b-0 border-[#432B1D] bg-[#FFF8EE] px-3.5 py-0.5">
            <span className="font-display text-sm font-bold tracking-tight text-[#432B1D] sm:text-base">
              Dudu &amp; Tata
            </span>
            <span className="text-[#432B1D]/30" aria-hidden="true">
              ·
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#D94F70]">
              <Clock className="h-3.5 w-3.5" strokeWidth={2.75} />
              <span className="font-mono-num">{effectiveDuration}d</span>
            </span>
          </div>

          {/* Wide Progress Bar Body */}
          <button
            type="button"
            onClick={() => setShowExchange(true)}
            className="relative flex w-full items-center gap-2 rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFFBF7] px-2.5 py-1.5 shadow-[0_4px_0_#432B1D] transition-transform active:translate-y-0.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#FFD166]">
              <Sparkles className="h-4 w-4 text-[#432B1D]" strokeWidth={2.75} />
            </span>

            <div className="relative h-5 flex-1 overflow-hidden rounded-xl border-2 border-[#432B1D] bg-[#F2E3D5]">
              <div
                className="h-full bg-[#49C829] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
              <span className="font-mono-num absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#432B1D] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]">
                {canRedeemAny
                  ? `Siap Tukar Rp! (${saveStore.totalPoints.toLocaleString('id-ID')} Poin)`
                  : `${pointsTowardNext}/500 Poin → Rp 10rb`}
              </span>
            </div>

            <span className="flex h-7 items-center gap-1 rounded-xl border-2 border-[#432B1D] bg-[#E8F8EE] px-2 text-[11px] font-bold text-[#1F5C36]">
              <Trophy className="h-3.5 w-3.5 text-[#E89B2D]" strokeWidth={2.75} />
              <span className="font-mono-num">{saveStore.bestCombo}x</span>
            </span>
          </button>
        </div>
      </header>

      {/* MIDDLE OPEN 3D STAGE + LEFT/RIGHT SIDE MEDALLIONS */}
      <div className="relative flex flex-1 items-center justify-between px-2.5 sm:mx-auto sm:w-full sm:max-w-4xl sm:px-6">
        {/* Left Floating Medallions */}
        <div className="pointer-events-auto flex flex-col gap-3.5 self-start pt-4 sm:self-center sm:pt-0">
          {/* Character Quick Switch Medallion */}
          <button
            type="button"
            onClick={toggleCharacterQuick}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#432B1D] shadow-[0_4px_0_#432B1D] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5 sm:h-16 sm:w-16"
              style={{ backgroundColor: activeChar.softBg }}
            >
              <Users className="h-6.5 w-6.5 text-[#432B1D]" strokeWidth={2.75} />
            </div>
            <span className="-mt-2 rounded-lg border-2 border-[#432B1D] bg-[#F26B7A] px-2.5 py-0.5 font-display text-[11px] font-bold text-white shadow-[0_2px_0_#432B1D]">
              {activeChar.name}
            </span>
          </button>

          {/* Time Mode Cycler Medallion */}
          <button
            type="button"
            onClick={cycleDuration}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#432B1D] bg-[#FFF3C4] shadow-[0_4px_0_#432B1D] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5 sm:h-16 sm:w-16">
              <Clock className="h-6.5 w-6.5 text-[#432B1D]" strokeWidth={2.75} />
            </div>
            <span className="-mt-2 rounded-lg border-2 border-[#432B1D] bg-[#FFD166] px-2 py-0.5 font-mono-num text-[11px] font-bold text-[#432B1D] shadow-[0_2px_0_#432B1D]">
              {effectiveDuration} Detik
            </span>
          </button>
        </div>

        {/* Center Notification or Quick Drawer */}
        <div className="pointer-events-none flex flex-col items-center justify-end self-end pb-2 max-w-[68%] sm:max-w-md">
          {bombReturnNotice && (
            <div className="pointer-events-auto card-25d mb-2 flex items-center gap-2 rounded-2xl bg-[#FFE8EB] px-3.5 py-2 text-xs font-bold text-[#9B1C2E]">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-[#E63946]" strokeWidth={2.75} />
              <span className="leading-snug">{bombReturnNotice}</span>
              <button
                type="button"
                onClick={onDismissBombNotice}
                className="ml-1 rounded-lg border border-[#432B1D]/30 bg-white p-1 text-[#432B1D]"
                aria-label="Tutup pemberitahuan"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.75} />
              </button>
            </div>
          )}

          {/* Character & Mode Drawer (toggled by Avatar or bottom Karakter tab) */}
          {showCharacterDrawer && (
            <div className="pointer-events-auto card-25d w-full rounded-3xl bg-[#FFFBF7] p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-[#432B1D]">
                  Pilih Karakter &amp; Waktu
                </span>
                <button
                  type="button"
                  onClick={() => setShowCharacterDrawer(false)}
                  className="rounded-lg border-2 border-[#432B1D] bg-white p-1 text-[#432B1D]"
                  aria-label="Tutup pilihan karakter"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.75} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['dudu', 'tata'] as CharacterId[]).map((id) => {
                  const c = CHARACTERS[id];
                  const selected = selectedCharacter === id;
                  const best = id === 'dudu' ? saveStore.duduBest : saveStore.tataBest;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelectCharacter(id)}
                      className={`rounded-2xl border-2 p-2.5 text-left transition-all ${
                        selected
                          ? 'border-[#432B1D] bg-[#FFF2DF] shadow-[0_3px_0_#432B1D]'
                          : 'border-[#432B1D]/25 bg-white hover:border-[#432B1D]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-sm font-bold text-[#432B1D]">
                          {c.name}
                        </span>
                        <span className="font-mono-num text-[11px] font-bold text-[#8A5A3B]">
                          {best}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#7A5B47]">
                        {c.traitTitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 flex items-center gap-1 rounded-xl border-2 border-[#432B1D]/20 bg-[#F7EDE5] p-1">
                {DURATION_ORDER.map((dur) => {
                  const active = durationMode === dur;
                  const labelSec = saveStore.armedBoosters.time2xBoost && active ? dur * 2 : dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => onSelectDuration(dur)}
                      className={`flex-1 rounded-lg py-1 text-xs font-bold transition-colors ${
                        active
                          ? 'bg-[#432B1D] text-[#FFFBF7]'
                          : 'text-[#6A4C3A] hover:text-[#432B1D]'
                      }`}
                    >
                      {labelSec}d · {TIME_MODES[dur].subtitle}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Floating Medallions */}
        <div className="pointer-events-auto flex flex-col gap-3.5 self-start pt-4 sm:self-center sm:pt-0">
          {/* Rupiah Wallet / Exchange Medallion */}
          <button
            type="button"
            onClick={() => setShowExchange(true)}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#432B1D] shadow-[0_4px_0_#432B1D] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5 sm:h-16 sm:w-16 ${
                canRedeemAny ? 'bg-[#FFE066]' : 'bg-[#D8F5E3]'
              }`}
            >
              <Wallet className="h-6.5 w-6.5 text-[#1F5C36]" strokeWidth={2.75} />
            </div>
            <span className="-mt-2 rounded-lg border-2 border-[#432B1D] bg-[#2B9348] px-2 py-0.5 font-mono-num text-[11px] font-bold text-white shadow-[0_2px_0_#432B1D]">
              {formatCompactRupiah(saveStore.rupiahBalance)}
            </span>
          </button>

          {/* Booster Medallion */}
          <button
            type="button"
            onClick={() => setShopTab('booster')}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#432B1D] shadow-[0_4px_0_#432B1D] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5 sm:h-16 sm:w-16 ${
                anyBoosterArmed ? 'bg-[#90E0EF]' : 'bg-[#FFFBF7]'
              }`}
            >
              <Zap className="h-6.5 w-6.5 text-[#432B1D]" strokeWidth={2.75} />
            </div>
            <span
              className={`-mt-2 rounded-lg border-2 border-[#432B1D] px-2 py-0.5 font-display text-[11px] font-bold shadow-[0_2px_0_#432B1D] ${
                anyBoosterArmed
                  ? 'bg-[#FFD166] text-[#432B1D]'
                  : 'bg-[#7A5B47] text-white'
              }`}
            >
              {anyBoosterArmed ? 'Aktif!' : `Booster (${totalBoosterStock})`}
            </span>
          </button>
        </div>
      </div>

      {/* LOWER PLAY CTA + 5-TAB BOTTOM NAVIGATION BAR */}
      <footer className="flex flex-col items-center gap-3">
        {/* Chunky Glossy Green Play CTA (matching reference's big green Level button) */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 px-4">
          {totalBoosterStock > 0 && (
            <div className="flex items-center gap-1.5">
              {saveStore.boosterCounts.boost_speed > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleBoosterArm('boost_speed')}
                  className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    saveStore.armedBoosters.speedBoost
                      ? 'border-[#432B1D] bg-[#90E0EF] text-[#432B1D]'
                      : 'border-[#432B1D]/40 bg-[#FFFBF7] text-[#6A4C3A]'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" strokeWidth={2.75} />
                  <span>Speed+ ({saveStore.boosterCounts.boost_speed})</span>
                </button>
              )}
              {saveStore.boosterCounts.boost_time2x > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleBoosterArm('boost_time2x')}
                  className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    saveStore.armedBoosters.time2xBoost
                      ? 'border-[#432B1D] bg-[#FFD166] text-[#432B1D]'
                      : 'border-[#432B1D]/40 bg-[#FFFBF7] text-[#6A4C3A]'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.75} />
                  <span>Waktu 2x ({saveStore.boosterCounts.boost_time2x})</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onStartGame}
            className="btn-25d relative flex min-w-[235px] items-center justify-center gap-2.5 overflow-hidden rounded-3xl bg-[#49C829] px-8 py-3.5 font-display text-xl font-bold text-white shadow-[0_6px_0_#432B1D] hover:bg-[#3FB820] sm:min-w-[280px] sm:py-4 sm:text-2xl"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-1 h-2.5 rounded-full bg-white/30"
            />
            <Play
              className="h-6 w-6 fill-current drop-shadow-[0_2px_0_#432B1D]"
              strokeWidth={2.75}
            />
            <span className="drop-shadow-[0_2px_0_#432B1D]">
              Mainkan {activeChar.name}
            </span>
          </button>
        </div>

        {/* 5-Tab Bottom Navigation Bar (matching reference bottom nav) */}
        <nav
          aria-label="Navigasi Utama"
          className="pointer-events-auto grid w-full grid-cols-5 items-end border-t-[3px] border-[#432B1D] bg-[#2D7CE0] px-1 pt-1.5 pb-2 shadow-[0_-2px_0_rgba(67,43,29,0.2)] sm:mb-3 sm:max-w-xl sm:rounded-3xl sm:border-[3px] sm:shadow-[0_5px_0_#432B1D]"
        >
          {/* 1. Belanja */}
          <button
            type="button"
            onClick={() => setShopTab('all')}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-white/95 transition-transform active:scale-95"
          >
            <div className="flex h-9 w-11 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#FFB703] text-[#432B1D] shadow-[0_2px_0_#432B1D]">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.75} />
            </div>
            <span className="font-display text-[11px] font-bold drop-shadow-[0_1px_0_#432B1D]">
              Belanja
            </span>
          </button>

          {/* 2. Tukar Rp */}
          <button
            type="button"
            onClick={() => setShowExchange(true)}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-white/95 transition-transform active:scale-95"
          >
            <div
              className={`flex h-9 w-11 items-center justify-center rounded-xl border-2 border-[#432B1D] shadow-[0_2px_0_#432B1D] ${
                canRedeemAny ? 'bg-[#49C829] text-white' : 'bg-[#FFF3C4] text-[#432B1D]'
              }`}
            >
              <Coins className="h-5 w-5" strokeWidth={2.75} />
            </div>
            <span className="font-display text-[11px] font-bold drop-shadow-[0_1px_0_#432B1D]">
              Tukar Rp
            </span>
          </button>

          {/* 3. Home (Active Center Tab) */}
          <button
            type="button"
            onClick={() => {
              setShowCharacterDrawer(false);
              setShowSettings(false);
            }}
            className="-mt-3 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-[2.5px] border-[#432B1D] bg-[#5AA9FF] py-1.5 text-white shadow-[0_3px_0_#432B1D] transition-transform active:translate-y-0.5"
          >
            <Home
              className="h-6.5 w-6.5 fill-[#FFD166] text-[#432B1D]"
              strokeWidth={2.5}
            />
            <span className="font-display text-xs font-bold drop-shadow-[0_1px_0_#432B1D]">
              Home
            </span>
          </button>

          {/* 4. Karakter */}
          <button
            type="button"
            onClick={() => setShowCharacterDrawer((v) => !v)}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-white/95 transition-transform active:scale-95"
          >
            <div
              className={`flex h-9 w-11 items-center justify-center rounded-xl border-2 border-[#432B1D] shadow-[0_2px_0_#432B1D] ${
                showCharacterDrawer
                  ? 'bg-[#F26B7A] text-white'
                  : 'bg-[#FFF0F3] text-[#432B1D]'
              }`}
            >
              <Users className="h-5 w-5" strokeWidth={2.75} />
            </div>
            <span className="font-display text-[11px] font-bold drop-shadow-[0_1px_0_#432B1D]">
              Karakter
            </span>
          </button>

          {/* 5. Panduan */}
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-white/95 transition-transform active:scale-95"
          >
            <div className="flex h-9 w-11 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#E0C3FC] text-[#432B1D] shadow-[0_2px_0_#432B1D]">
              <BookOpen className="h-5 w-5" strokeWidth={2.75} />
            </div>
            <span className="font-display text-[11px] font-bold drop-shadow-[0_1px_0_#432B1D]">
              Panduan
            </span>
          </button>
        </nav>
      </footer>

      {/* Settings Popover */}
      {showSettings && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#432B1D]/45 p-4">
          <div className="card-25d w-full max-w-xs rounded-3xl bg-[#FFFBF7] p-5">
            <div className="flex items-center justify-between border-b-2 border-[#432B1D]/15 pb-3">
              <h2 className="font-display text-lg font-bold text-[#432B1D]">
                Pengaturan Game
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="btn-25d flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#432B1D]"
                aria-label="Tutup Pengaturan"
              >
                <X className="h-4 w-4" strokeWidth={2.75} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="btn-25d flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#432B1D]"
              >
                <span className="flex items-center gap-2.5">
                  {muted ? (
                    <VolumeX className="h-5 w-5 text-[#D9384A]" strokeWidth={2.5} />
                  ) : (
                    <Volume2 className="h-5 w-5 text-[#2B9348]" strokeWidth={2.5} />
                  )}
                  Suara &amp; Musik
                </span>
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs ${
                    muted ? 'bg-[#FFE3E6] text-[#9B1C2E]' : 'bg-[#E8F8EE] text-[#1F5C36]'
                  }`}
                >
                  {muted ? 'Mati' : 'Aktif'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleVibration}
                className="btn-25d flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#432B1D]"
              >
                <span className="flex items-center gap-2.5">
                  <Smartphone
                    className={`h-5 w-5 ${
                      vibrationEnabled ? 'text-[#2B9348]' : 'text-[#8F705D]'
                    }`}
                    strokeWidth={2.5}
                  />
                  Efek Getar
                </span>
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs ${
                    vibrationEnabled
                      ? 'bg-[#E8F8EE] text-[#1F5C36]'
                      : 'bg-[#F0E6DE] text-[#6A4C3A]'
                  }`}
                >
                  {vibrationEnabled ? 'Aktif' : 'Mati'}
                </span>
              </button>

              <div className="mt-1 rounded-2xl border-2 border-[#432B1D]/15 bg-[#FFF4E6] px-3.5 py-2.5 text-xs text-[#6A4C3A]">
                <div className="flex items-center justify-between font-bold text-[#432B1D]">
                  <span>Saldo Celengan</span>
                  <span className="font-mono-num text-[#1F5C36]">
                    {formatRupiah(saveStore.rupiahBalance)}
                  </span>
                </div>
                <p className="mt-1 leading-snug">
                  Hindari bom hitam! Kena 3 bom nyawa habis dan kembali ke menu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showExchange && (
        <ExchangeModal
          totalPoints={saveStore.totalPoints}
          rupiahBalance={saveStore.rupiahBalance}
          onExchange={onExchangePoints}
          onOpenShop={() => {
            setShowExchange(false);
            setShopTab('all');
          }}
          onClose={() => setShowExchange(false)}
        />
      )}

      {shopTab !== null && (
        <ShopModal
          saveStore={saveStore}
          selectedCharacter={selectedCharacter}
          initialTab={shopTab}
          onSelectCharacter={onSelectCharacter}
          onBuyItem={onBuyShopItem}
          onToggleEquip={onToggleEquipItem}
          onToggleBoosterArm={onToggleBoosterArm}
          onOpenExchange={() => {
            setShopTab(null);
            setShowExchange(true);
          }}
          onClose={() => setShopTab(null)}
        />
      )}
    </div>
  );
};

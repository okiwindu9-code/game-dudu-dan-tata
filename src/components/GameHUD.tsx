import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Flame,
  Home,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ActiveBoosters,
  CHARACTERS,
  CharacterId,
  FloatingPopup,
  GamePhase,
  HudSnapshot,
} from '../types/game';

interface GameHUDProps {
  characterId: CharacterId;
  phase: GamePhase;
  hud: HudSnapshot;
  popups: FloatingPopup[];
  activeBoosters: ActiveBoosters;
  hazardFlash: boolean;
  muted: boolean;
  vibrationEnabled: boolean;
  onToggleMute: () => void;
  onToggleVibration: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
  onVirtualMove: (dir: -1 | 0 | 1) => void;
  onJump: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  characterId,
  phase,
  hud,
  popups,
  activeBoosters,
  hazardFlash,
  muted,
  vibrationEnabled,
  onToggleMute,
  onToggleVibration,
  onTogglePause,
  onRestart,
  onBackToMenu,
  onVirtualMove,
  onJump,
}) => {
  const char = CHARACTERS[characterId];
  const isLowTime = hud.timeLeft <= 10;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* Subtle crimson impact border flash when hit by a bomb */}
      {hazardFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-[10px] border-[#E63946]/55 bg-[#E63946]/10"
        />
      )}

      {/* Floating 3D-projected score popups */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {popups.map((p) => {
          const colorClass =
            p.variant === 'hazard'
              ? 'text-[#D9384A]'
              : p.variant === 'fever'
                ? 'text-[#E88D14]'
                : p.variant === 'time'
                  ? 'text-[#2B9348]'
                  : p.variant === 'bonus'
                    ? 'text-[#D94F70]'
                    : 'text-[#432B1D]';
          return (
            <div
              key={p.id}
              style={{ left: p.x, top: p.y }}
              className={`animate-float-score font-display absolute whitespace-nowrap text-xl font-bold drop-shadow-[0_2px_0_#FFFBF7] sm:text-2xl ${colorClass}`}
            >
              {p.label}
            </div>
          );
        })}
      </div>

      {/* Top HUD Bar */}
      <div className="flex items-start justify-between gap-3 p-3.5 sm:p-5">
        {/* Left: Score & Active Character */}
        <div className="pointer-events-auto card-25d flex flex-col rounded-2xl bg-[#FFFBF7] px-4 py-2">
          <div className="text-[11px] font-bold tracking-wide text-[#8A6752]">
            {char.name} · Skor
          </div>
          <div className="font-mono-num flex items-baseline gap-2 text-2xl leading-tight font-bold text-[#432B1D]">
            <span>{hud.score}</span>
            {hud.multiplier > 1 && (
              <span className="font-display text-sm font-bold text-[#F26B7A]">
                x{hud.multiplier}
              </span>
            )}
          </div>
          {(activeBoosters.speedBoost || activeBoosters.time2xBoost) && (
            <div className="mt-0.5 text-[10px] font-bold text-[#2B6E44]">
              {[
                activeBoosters.speedBoost ? 'Speed +35%' : '',
                activeBoosters.time2xBoost ? 'Waktu 2x' : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
        </div>

        {/* Center: Timer & Fever Meter */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`pointer-events-auto card-25d flex items-center gap-2 rounded-2xl px-4 py-2 transition-colors ${
              isLowTime ? 'bg-[#FFE3E6] text-[#C92A3E]' : 'bg-[#FFFBF7] text-[#432B1D]'
            }`}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span className="font-mono-num text-xl font-bold leading-none">
              {hud.timeLeft}d
            </span>
          </div>

          {(hud.combo > 0 || hud.feverActive) && (
            <div className="card-25d flex items-center gap-2 rounded-xl bg-[#FFFBF7] px-3 py-1">
              <Flame
                className={`h-3.5 w-3.5 ${
                  hud.feverActive ? 'text-[#FF8800]' : 'text-[#F26B7A]'
                }`}
              />
              <span className="font-display text-xs font-bold text-[#432B1D] whitespace-nowrap">
                {hud.feverActive
                  ? `PESTA MANIS · ${hud.feverTimeLeft.toFixed(1)}d`
                  : `Kombo ${hud.combo}`}
              </span>
              <div className="h-2 w-16 overflow-hidden rounded-full border border-[#432B1D] bg-[#F5E6DA]">
                <div
                  className={`h-full transition-all duration-150 ${
                    hud.feverActive ? 'bg-[#FFB703]' : 'bg-[#F26B7A]'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(hud.feverProgress * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Vibration, Audio & Pause */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleVibration}
            className={`btn-25d flex h-11 w-11 items-center justify-center rounded-xl ${
              vibrationEnabled
                ? 'bg-[#FFFBF7] text-[#432B1D]'
                : 'bg-[#F0E6DE] text-[#8F705D]'
            }`}
            aria-label={vibrationEnabled ? 'Matikan getaran' : 'Nyalakan getaran'}
          >
            <Smartphone className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="btn-25d flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFFBF7] text-[#432B1D]"
            aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            className="btn-25d flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFFBF7] text-[#432B1D]"
            aria-label={phase === 'paused' ? 'Lanjutkan' : 'Jeda permainan'}
          >
            {phase === 'paused' ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Pause Overlay */}
      {phase === 'paused' && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#432B1D]/35 p-4">
          <div className="card-25d w-full max-w-xs rounded-3xl bg-[#FFFBF7] p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#432B1D]">
              Permainan Dijeda
            </h2>
            <p className="mt-1 text-sm font-medium text-[#7A5B47]">
              {char.name} sedang beristirahat sejenak.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F26B7A] py-3 font-display text-base font-bold text-white"
              >
                <Play className="h-4 w-4 fill-current" />
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFF2DF] py-2.5 font-display text-sm font-bold text-[#432B1D]"
              >
                <RotateCcw className="h-4 w-4" />
                Ulangi Dari Awal
              </button>
              <button
                type="button"
                onClick={onBackToMenu}
                className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 font-display text-sm font-bold text-[#432B1D]"
              >
                <Home className="h-4 w-4" />
                Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Touch / Quick Helper Bar */}
      <div className="flex items-end justify-between p-3.5 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            onPointerDown={() => onVirtualMove(-1)}
            onPointerUp={() => onVirtualMove(0)}
            onPointerLeave={() => onVirtualMove(0)}
            className="btn-25d flex h-13 w-14 items-center justify-center rounded-2xl bg-[#FFFBF7] text-[#432B1D]"
            aria-label="Gerak ke kiri"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            onPointerDown={() => onVirtualMove(1)}
            onPointerUp={() => onVirtualMove(0)}
            onPointerLeave={() => onVirtualMove(0)}
            className="btn-25d flex h-13 w-14 items-center justify-center rounded-2xl bg-[#FFFBF7] text-[#432B1D]"
            aria-label="Gerak ke kanan"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>

        <div className="hidden md:block text-xs font-semibold text-[#5A4031]/85 bg-[#FFFBF7]/90 border-2 border-[#432B1D]/25 rounded-xl px-3 py-1.5">
          A / D atau ← / → atau Geser · Spasi untuk Lompat
        </div>

        <button
          type="button"
          onPointerDown={onJump}
          className="pointer-events-auto btn-25d flex h-12 items-center gap-1.5 rounded-2xl bg-[#FFD166] px-4 font-display text-sm font-bold text-[#432B1D] md:hidden"
          aria-label="Lompat"
        >
          <ChevronUp className="h-5 w-5" />
          Lompat
        </button>
      </div>
    </div>
  );
};

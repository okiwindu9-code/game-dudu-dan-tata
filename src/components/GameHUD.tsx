import React from 'react';
import {
  Bomb,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  Flame,
  Heart,
  Home,
  Laugh,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Smartphone,
  Sparkles,
  Swords,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ActiveBoosters,
  CHARACTERS,
  CharacterId,
  EmoteId,
  FloatingPopup,
  GamePhase,
  HudSnapshot,
  MABAR_EMOTES,
} from '../types/game';

export interface EmotePopupItem {
  key: number;
  emoteId: EmoteId;
  senderName: string;
  isMine: boolean;
}

function EmoteArtwork({
  emoteId,
  className = 'h-5 w-5',
}: {
  emoteId: EmoteId;
  className?: string;
}) {
  if (emoteId === 'cheer_love') {
    return <Heart className={`${className} fill-[#F26B7A] text-[#432B1D]`} strokeWidth={2.4} />;
  }
  if (emoteId === 'cheer_fire') {
    return <Flame className={`${className} fill-[#FFB703] text-[#432B1D]`} strokeWidth={2.4} />;
  }
  if (emoteId === 'cheer_clap') {
    return <ThumbsUp className={`${className} fill-[#49C829] text-[#432B1D]`} strokeWidth={2.4} />;
  }
  if (emoteId === 'taunt_boom') {
    return <Bomb className={`${className} fill-[#432B1D] text-[#E63946]`} strokeWidth={2.4} />;
  }
  if (emoteId === 'taunt_haha') {
    return <Laugh className={`${className} fill-[#FFD166] text-[#432B1D]`} strokeWidth={2.4} />;
  }
  // taunt_bleh: cheeky playful sticking-out-tongue vector face
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#E9D5FF" stroke="#432B1D" strokeWidth="2.2" />
      <path d="M7.5 9.5 L10 10.5 L7.5 11.5" fill="none" stroke="#432B1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 9.5 L14 10.5 L16.5 11.5" fill="none" stroke="#432B1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 14.5 Q12 16.5 16.5 14.5" fill="none" stroke="#432B1D" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 15.2 V18.2 A2 2 0 0 0 14 18.2 V15.2 Z" fill="#F26B7A" stroke="#432B1D" strokeWidth="1.6" />
    </svg>
  );
}

interface GameHUDProps {
  characterId: CharacterId;
  phase: GamePhase;
  hud: HudSnapshot;
  popups: FloatingPopup[];
  activeBoosters: ActiveBoosters;
  hazardFlash: boolean;
  duelBadge?: string | null;
  spectatingName?: string | null;
  waitingOpponentStart?: boolean;
  targetScoreToBeat?: number | null;
  readyForMyTurn?: boolean;
  turnAutoCountdown?: number | null;
  onStartMyTurn?: () => void;
  emotePopups?: EmotePopupItem[];
  emoteCooldown?: boolean;
  lastTappedEmote?: EmoteId | null;
  onSendEmote?: (emoteId: EmoteId) => void;
  onDismissEmote?: (key: number) => void;
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
  duelBadge,
  spectatingName,
  waitingOpponentStart,
  targetScoreToBeat,
  readyForMyTurn,
  turnAutoCountdown = null,
  onStartMyTurn,
  emotePopups = [],
  emoteCooldown = false,
  lastTappedEmote = null,
  onSendEmote,
  onDismissEmote,
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
  const isSpectating = phase === 'spectating';
  const isLowTime = hud.timeLeft <= 10;
  const livesPct =
    hud.maxLives > 0 ? Math.max(0, Math.min(100, (hud.lives / hud.maxLives) * 100)) : 0;
  const livesBarColor =
    hud.lives >= 3 ? 'bg-[#2B9348]' : hud.lives === 2 ? 'bg-[#F59E0B]' : 'bg-[#E63946]';

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* Fever Mode warm golden glow */}
      {hud.feverActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-[6px] border-[#FFD166]/65 shadow-[inset_0_0_65px_rgba(255,209,102,0.32)]"
        />
      )}

      {/* Speed booster subtle cyan edge highlight */}
      {!isSpectating && activeBoosters.speedBoost && !hud.feverActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 shadow-[inset_0_0_48px_rgba(144,224,239,0.28)]"
        />
      )}

      {/* Subtle crimson impact border flash when hit by a bomb */}
      {hazardFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-[10px] border-[#E63946]/65 bg-[#E63946]/15"
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

      {/* Top HUD Area (Responsive Android Portrait & PC Landscape) */}
      <div className="flex flex-col gap-2 p-2.5 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          {/* Left: Score & Active Character */}
          <div className="pointer-events-auto card-25d flex flex-col rounded-2xl bg-[#FFFBF7] px-3 py-1.5 sm:px-4 sm:py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#8A6752] sm:text-[11px]">
              {isSpectating && (
                <Radio className="h-3.5 w-3.5 shrink-0 text-[#E63946]" strokeWidth={2.75} />
              )}
              <span>
                {isSpectating && spectatingName
                  ? `${spectatingName} (${char.name})`
                  : `${char.name} · Skor`}
              </span>
            </div>
            <div className="font-mono-num flex items-baseline gap-1.5 text-xl leading-tight font-bold text-[#432B1D] sm:gap-2 sm:text-2xl">
              <span>{hud.score}</span>
              {hud.multiplier > 1 && (
                <span className="font-display text-xs font-bold text-[#F26B7A] sm:text-sm">
                  x{hud.multiplier}
                </span>
              )}
            </div>
            {typeof targetScoreToBeat === 'number' && !isSpectating && (
              <div className="mt-0.5 text-[10px] font-bold text-[#D94F70]">
                Target P1: {targetScoreToBeat} pts
              </div>
            )}
            {(activeBoosters.speedBoost || activeBoosters.time2xBoost) && !isSpectating && (
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

          {/* Center: Timer + Bar Progress Nyawa */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
              <div
                className={`card-25d flex items-center gap-1.5 rounded-2xl px-3 py-1.5 transition-colors sm:px-4 sm:py-2 ${
                  isLowTime ? 'bg-[#FFE3E6] text-[#C92A3E]' : 'bg-[#FFFBF7] text-[#432B1D]'
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" strokeWidth={2.75} />
                <span className="font-mono-num text-lg font-bold leading-none sm:text-xl">
                  {hud.timeLeft}d
                </span>
              </div>

              {/* Bar Progress Nyawa */}
              <div
                className={`card-25d flex items-center gap-2 rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 ${
                  hud.lives <= 1 ? 'bg-[#FFE8EB]' : 'bg-[#FFFBF7]'
                }`}
                aria-label={`Nyawa tersisa ${hud.lives} dari ${hud.maxLives}`}
              >
                <Heart
                  className="h-4.5 w-4.5 shrink-0 fill-[#E63946] text-[#432B1D]"
                  strokeWidth={2.5}
                />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] leading-none font-bold text-[#432B1D]">
                    <span className="hidden sm:inline">Nyawa</span>
                    <span className="font-mono-num">
                      {hud.lives}/{hud.maxLives}
                    </span>
                  </div>
                  <div className="h-2.5 w-16 overflow-hidden rounded-full border-2 border-[#432B1D] bg-[#F5E6DA] sm:w-24">
                    <div
                      className={`h-full transition-all duration-200 ${livesBarColor}`}
                      style={{ width: `${livesPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {isSpectating ? (
              <div className="card-25d flex items-center gap-1.5 rounded-xl bg-[#432B1D] px-3 py-1 text-white">
                <Eye className="h-3.5 w-3.5 text-[#FFD166]" strokeWidth={2.75} />
                <span className="font-display text-xs font-bold whitespace-nowrap">
                  {readyForMyTurn
                    ? 'Lawan Selesai — Giliranmu Tiba!'
                    : waitingOpponentStart
                      ? `Menunggu ${spectatingName || 'Lawan'} Mulai Main...`
                      : `LIVE · ${spectatingName || 'Lawan'} Main — Tunggu Giliranmu`}
                </span>
              </div>
            ) : (
              duelBadge && (
                <div className="card-25d flex items-center gap-1.5 rounded-xl bg-[#FFE3EC] px-3 py-1">
                  <Swords className="h-3.5 w-3.5 text-[#D94F70]" strokeWidth={2.75} />
                  <span className="font-display text-xs font-bold text-[#432B1D] whitespace-nowrap">
                    {duelBadge}
                  </span>
                </div>
              )
            )}

            {(hud.combo > 0 || hud.feverActive) && (
              <div className="card-25d flex items-center gap-2 rounded-xl bg-[#FFFBF7] px-3 py-1">
                <Flame
                  className={`h-3.5 w-3.5 ${
                    hud.feverActive ? 'text-[#FF8800]' : 'text-[#F26B7A]'
                  }`}
                  strokeWidth={2.75}
                />
                <span className="font-display text-xs font-bold text-[#432B1D] whitespace-nowrap">
                  {hud.feverActive
                    ? `PESTA MANIS · ${hud.feverTimeLeft.toFixed(1)}d`
                    : `Kombo ${hud.combo}`}
                </span>
                <div className="h-2 w-14 overflow-hidden rounded-full border border-[#432B1D] bg-[#F5E6DA] sm:w-16">
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

          {/* Right: Vibration, Audio & Pause / Leave Spectator */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            {!isSpectating && (
              <>
                <button
                  type="button"
                  onClick={onToggleVibration}
                  className={`btn-25d hidden sm:flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                    vibrationEnabled
                      ? 'bg-[#FFFBF7] text-[#432B1D]'
                      : 'bg-[#F0E6DE] text-[#8F705D]'
                  }`}
                  aria-label={vibrationEnabled ? 'Matikan getaran' : 'Nyalakan getaran'}
                >
                  <Smartphone className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="btn-25d flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBF7] text-[#432B1D] sm:h-11 sm:w-11"
                  aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}
                >
                  {muted ? (
                    <VolumeX className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Volume2 className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="btn-25d flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBF7] text-[#432B1D] sm:h-11 sm:w-11"
                  aria-label={phase === 'paused' ? 'Lanjutkan' : 'Jeda permainan'}
                >
                  {phase === 'paused' ? (
                    <Play className="h-5 w-5 fill-current" strokeWidth={2.5} />
                  ) : (
                    <Pause className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              </>
            )}
            {isSpectating && (
              <button
                type="button"
                onClick={onBackToMenu}
                className="btn-25d flex h-10 items-center gap-1.5 rounded-xl bg-[#FFFBF7] px-3 text-xs font-bold text-[#432B1D]"
              >
                <Home className="h-4 w-4" strokeWidth={2.5} />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pause Overlay */}
      {phase === 'paused' && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#432B1D]/40 p-4">
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
                className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#38B000] py-3 font-display text-base font-bold text-white"
              >
                <Play className="h-4.5 w-4.5 fill-current" strokeWidth={2.5} />
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={onToggleVibration}
                className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFF8EE] py-2.5 font-display text-sm font-bold text-[#432B1D] sm:hidden"
              >
                <Smartphone className="h-4.5 w-4.5" strokeWidth={2.5} />
                {vibrationEnabled ? 'Getaran: Aktif' : 'Getaran: Mati'}
              </button>
              {!duelBadge && (
                <button
                  type="button"
                  onClick={onRestart}
                  className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFF2DF] py-2.5 font-display text-sm font-bold text-[#432B1D]"
                >
                  <RotateCcw className="h-4.5 w-4.5" strokeWidth={2.5} />
                  Ulangi Dari Awal
                </button>
              )}
              <button
                type="button"
                onClick={onBackToMenu}
                className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 font-display text-sm font-bold text-[#432B1D]"
              >
                <Home className="h-4.5 w-4.5" strokeWidth={2.5} />
                Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Interactive Emote Pulse Popups (Visible to both active runner & waiting spectator) */}
      {emotePopups.length > 0 && !readyForMyTurn && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-20 flex flex-col items-center gap-2.5 px-4 sm:top-28">
          {emotePopups.map((item) => {
            const meta = MABAR_EMOTES.find((m) => m.id === item.emoteId) || MABAR_EMOTES[0];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onDismissEmote?.(item.key)}
                className="pointer-events-auto animate-emote-pop relative flex items-center gap-2.5 rounded-2xl border-[2.5px] border-[#432B1D] px-3.5 py-2 shadow-[0_5px_0_#432B1D]"
                style={{ backgroundColor: meta.bgColor }}
                aria-label={`Emote ${meta.label} dari ${item.senderName}`}
              >
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-white">
                  <span
                    aria-hidden="true"
                    className="animate-emote-ring pointer-events-none absolute inset-0 rounded-xl border-[3px]"
                    style={{ borderColor: meta.ringColor }}
                  />
                  <span className="animate-emote-wiggle inline-flex items-center justify-center">
                    <EmoteArtwork emoteId={item.emoteId} className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold leading-none text-[#7A5B47]">
                    {item.isMine ? 'Kamu' : item.senderName} ·{' '}
                    <span style={{ color: meta.ringColor }}>
                      {meta.tone === 'support' ? 'Dukungan' : 'Ejekan'}
                    </span>
                  </div>
                  <div className="font-display text-sm font-bold leading-tight text-[#432B1D]">
                    {meta.bubbleText}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Player 2 Turn Takeover Overlay (Auto-starts in 2s OR tap immediately) */}
      {isSpectating && readyForMyTurn && onStartMyTurn && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#432B1D]/30 px-4">
          <div className="card-25d flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-[#FFFBF7] p-5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#432B1D] bg-[#FFD166] px-3 py-1 font-display text-xs font-bold text-[#432B1D]">
              <Swords className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Giliranmu Sekarang!</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#432B1D]">
              Lawan Sudah Selesai Main
            </h2>
            {typeof targetScoreToBeat === 'number' && (
              <p className="text-xs font-semibold text-[#7A5B47]">
                Skor lawan:{' '}
                <strong className="font-mono-num text-[#D94F70]">
                  {targetScoreToBeat} poin
                </strong>
                . Ayo kejar &amp; menangkan!
              </p>
            )}
            <button
              type="button"
              onClick={onStartMyTurn}
              className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#49C829] py-3 font-display text-base font-bold text-white"
            >
              <Play className="h-5 w-5 fill-current" strokeWidth={2.5} />
              Mulai Giliran Sekarang!
            </button>
            <p className="text-[11px] font-bold text-[#8A6752]">
              {typeof turnAutoCountdown === 'number' && turnAutoCountdown > 0
                ? `Otomatis mulai dalam ${turnAutoCountdown} detik...`
                : 'Memulai permainanmu...'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Touch / Quick Helper Bar + Interactive Emote Dock when waiting */}
      {isSpectating ? (
        <div className="pointer-events-none flex justify-center px-2.5 pb-3 sm:p-5">
          {!readyForMyTurn && onSendEmote ? (
            <div className="pointer-events-auto card-25d w-full max-w-lg rounded-3xl bg-[#FFFBF7]/95 p-2.5 sm:p-3">
              <div className="mb-1.5 flex items-center justify-between gap-2 px-1 text-[11px] font-bold text-[#6A4C3A]">
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F26B7A]" strokeWidth={2.6} />
                  <span className="truncate">
                    Kirim Emote Live ke {spectatingName || 'Lawan'}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-semibold text-[#8A6752]">
                  Dukung · Ejek
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {MABAR_EMOTES.map((emote) => {
                  const justTapped = lastTappedEmote === emote.id;
                  return (
                    <button
                      key={emote.id}
                      type="button"
                      disabled={emoteCooldown}
                      onClick={() => onSendEmote(emote.id)}
                      style={{ backgroundColor: emote.bgColor }}
                      className={`btn-25d relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[#432B1D] transition-transform ${
                        justTapped ? 'scale-95 ring-2 ring-[#432B1D]' : ''
                      } ${emoteCooldown && !justTapped ? 'opacity-75' : ''}`}
                    >
                      {justTapped && (
                        <span
                          aria-hidden="true"
                          className="animate-emote-ring pointer-events-none absolute inset-0 rounded-2xl border-2"
                          style={{ borderColor: emote.ringColor }}
                        />
                      )}
                      <EmoteArtwork emoteId={emote.id} className="h-5 w-5" />
                      <span className="font-display text-[11px] leading-none font-bold whitespace-nowrap">
                        {emote.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-end justify-between p-3 sm:p-5">
          <div className="pointer-events-auto flex items-center gap-2 md:hidden">
            <button
              type="button"
              onPointerDown={() => onVirtualMove(-1)}
              onPointerUp={() => onVirtualMove(0)}
              onPointerLeave={() => onVirtualMove(0)}
              className="btn-25d flex h-13 w-14 items-center justify-center rounded-2xl bg-[#FFFBF7] text-[#432B1D]"
              aria-label="Gerak ke kiri"
            >
              <ChevronLeft className="h-7 w-7" strokeWidth={2.75} />
            </button>
            <button
              type="button"
              onPointerDown={() => onVirtualMove(1)}
              onPointerUp={() => onVirtualMove(0)}
              onPointerLeave={() => onVirtualMove(0)}
              className="btn-25d flex h-13 w-14 items-center justify-center rounded-2xl bg-[#FFFBF7] text-[#432B1D]"
              aria-label="Gerak ke kanan"
            >
              <ChevronRight className="h-7 w-7" strokeWidth={2.75} />
            </button>
          </div>

          <div className="hidden md:block text-xs font-bold text-[#5A4031]/90 bg-[#FFFBF7]/95 border-2 border-[#432B1D]/30 rounded-xl px-3.5 py-1.5">
            A / D atau ← / → atau Geser · Spasi untuk Lompat · Hindari Bom!
          </div>

          <button
            type="button"
            onPointerDown={onJump}
            className="pointer-events-auto btn-25d flex h-13 items-center gap-1.5 rounded-2xl bg-[#FFD166] px-4 font-display text-sm font-bold text-[#432B1D] md:hidden"
            aria-label="Lompat"
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2.75} />
            Lompat
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  Clock,
  Copy,
  Crown,
  Flame,
  Heart,
  LogIn,
  Play,
  PlusCircle,
  Swords,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import {
  CHARACTERS,
  CharacterId,
  InGameDuration,
  MAX_PLAYER_LIVES,
  TurnRoom,
} from '../types/game';

interface MultiplayerModalProps {
  user: User | null;
  authBusy: boolean;
  selectedCharacter: CharacterId;
  durationMode: InGameDuration;
  activeRoom: TurnRoom | null;
  localRole: 'player1' | 'player2' | null;
  roomError: string | null;
  roomBusy: boolean;
  onGoogleLogin: () => void;
  onCreateRoom: (charId: CharacterId, duration: InGameDuration) => void;
  onJoinRoom: (roomCode: string, charId: CharacterId) => void;
  onStartTurn: () => void;
  onCancelWaitingRoom: () => void;
  onLeaveRoom: () => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  user,
  authBusy,
  selectedCharacter,
  durationMode,
  activeRoom,
  localRole,
  roomError,
  roomBusy,
  onGoogleLogin,
  onCreateRoom,
  onJoinRoom,
  onStartTurn,
  onCancelWaitingRoom,
  onLeaveRoom,
  onClose,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [duelChar, setDuelChar] = useState<CharacterId>(selectedCharacter);
  const [duelDuration, setDuelDuration] = useState<InGameDuration>(durationMode);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // Determine effective role cleanly (supports both 2 distinct Google accounts & 2-tab 1-account testing)
  const resolvedRole: 'player1' | 'player2' | null =
    localRole ||
    (user && activeRoom
      ? user.uid === activeRoom.player2Uid
        ? 'player2'
        : user.uid === activeRoom.player1Uid
          ? 'player1'
          : null
      : null);

  const isMyTurn =
    activeRoom &&
    ((activeRoom.status === 'player1_turn' && resolvedRole === 'player1') ||
      (activeRoom.status === 'player2_turn' && resolvedRole === 'player2'));

  const renderWinnerBanner = (room: TurnRoom) => {
    const p1 = room.player1Result?.score ?? 0;
    const p2 = room.player2Result?.score ?? 0;
    if (p1 === p2) {
      return {
        title: 'Hasil Seri!',
        subtitle: `Keduanya imbang dengan ${p1} poin`,
        bg: 'bg-[#FFF3C4]',
        accent: 'text-[#8A5A00]',
      };
    }
    const p1Won = p1 > p2;
    const winnerName = p1Won ? room.player1Name : room.player2Name || 'Player 2';
    return {
      title: `${winnerName} Menang!`,
      subtitle: `${p1Won ? 'Player 1' : 'Player 2'} unggul ${Math.abs(p1 - p2)} poin`,
      bg: 'bg-[#E8F8EE]',
      accent: 'text-[#1F5C36]',
    };
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#432B1D]/45 p-3 sm:p-4">
      <div className="card-25d flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[#FFFBF7]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#432B1D]/15 bg-[#FFF0F3] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#F26B7A] text-white">
              <Swords className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight text-[#432B1D] sm:text-xl">
                Duel Online Turn-Based
              </h2>
              <p className="text-xs font-semibold text-[#7A5B47]">
                Player 1 main duluan, lalu Player 2 &amp; bandingkan skor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-25d flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#432B1D]"
            aria-label="Tutup Duel Online"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.75} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {roomError && (
            <div className="rounded-2xl border-2 border-[#D9384A] bg-[#FFE8EB] px-3.5 py-2.5 text-xs font-bold text-[#9B1C2E]">
              {roomError}
            </div>
          )}

          {/* 1. Not Signed In */}
          {!user && (
            <div className="rounded-3xl border-2 border-[#432B1D]/20 bg-white p-5 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFD166]">
                <Users className="h-7 w-7 text-[#432B1D]" strokeWidth={2.5} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#432B1D]">
                Masuk Google untuk Duel Online
              </h3>
              <p className="text-xs leading-relaxed text-[#7A5B47]">
                Login dengan akun Google agar profil, nama pemain, dan skor giliran tersimpan aman di Firebase Cloud serta bisa langsung bertanding pakai Kode Room.
              </p>
              <button
                type="button"
                disabled={authBusy}
                onClick={onGoogleLogin}
                className="btn-25d inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#49C829] px-5 py-3 font-display text-base font-bold text-white disabled:opacity-60"
              >
                <LogIn className="h-5 w-5" strokeWidth={2.5} />
                {authBusy ? 'Menghubungkan...' : 'Masuk dengan Google'}
              </button>
            </div>
          )}

          {/* 2. Signed In, No Active Room */}
          {user && !activeRoom && (
            <>
              <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#432B1D]/20 bg-[#F7EDE5] p-1">
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className={`flex-1 rounded-xl py-2 font-display text-xs font-bold transition-colors sm:text-sm ${
                    tab === 'create'
                      ? 'bg-[#432B1D] text-[#FFFBF7]'
                      : 'text-[#6A4C3A] hover:text-[#432B1D]'
                  }`}
                >
                  Buat Room (Player 1)
                </button>
                <button
                  type="button"
                  onClick={() => setTab('join')}
                  className={`flex-1 rounded-xl py-2 font-display text-xs font-bold transition-colors sm:text-sm ${
                    tab === 'join'
                      ? 'bg-[#432B1D] text-[#FFFBF7]'
                      : 'text-[#6A4C3A] hover:text-[#432B1D]'
                  }`}
                >
                  Masuk Kode (Player 2)
                </button>
              </div>

              {/* Character Picker for Duel */}
              <div>
                <label className="block font-display text-xs font-bold text-[#432B1D] mb-1.5">
                  Pilih Karakter Duelmu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['dudu', 'tata'] as CharacterId[]).map((cid) => {
                    const c = CHARACTERS[cid];
                    const active = duelChar === cid;
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => setDuelChar(cid)}
                        className={`rounded-2xl border-2 p-2.5 text-left transition-all ${
                          active
                            ? 'border-[#432B1D] bg-[#FFF2DF] shadow-[0_3px_0_#432B1D]'
                            : 'border-[#432B1D]/25 bg-white'
                        }`}
                      >
                        <div className="font-display text-sm font-bold text-[#432B1D]">
                          {c.name}
                        </div>
                        <div className="text-[11px] font-semibold text-[#7A5B47]">
                          {c.traitTitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {tab === 'create' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-display text-xs font-bold text-[#432B1D] mb-1.5">
                      Durasi Pertandingan (Sama untuk P1 &amp; P2)
                    </label>
                    <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#432B1D]/20 bg-[#F7EDE5] p-1">
                      {([45, 60, 90] as InGameDuration[]).map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setDuelDuration(dur)}
                          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                            duelDuration === dur
                              ? 'bg-[#432B1D] text-[#FFFBF7]'
                              : 'text-[#6A4C3A]'
                          }`}
                        >
                          {dur} Detik
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={roomBusy}
                    onClick={() => onCreateRoom(duelChar, duelDuration)}
                    className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#49C829] py-3 font-display text-base font-bold text-white disabled:opacity-60"
                  >
                    <PlusCircle className="h-5 w-5" strokeWidth={2.5} />
                    {roomBusy ? 'Membuat Room...' : 'Buat Room & Dapatkan Kode'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="room-code-input"
                      className="block font-display text-xs font-bold text-[#432B1D] mb-1.5"
                    >
                      Masukkan Kode Room (6 Karakter)
                    </label>
                    <input
                      id="room-code-input"
                      type="text"
                      maxLength={6}
                      value={joinCodeInput}
                      onChange={(e) =>
                        setJoinCodeInput(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        )
                      }
                      placeholder="Contoh: DT4829"
                      className="font-mono-num w-full rounded-2xl border-[2.5px] border-[#432B1D] bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.25em] text-[#432B1D] uppercase focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={roomBusy || joinCodeInput.length !== 6}
                    onClick={() => onJoinRoom(joinCodeInput, duelChar)}
                    className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F26B7A] py-3 font-display text-base font-bold text-white disabled:cursor-not-allowed disabled:bg-[#E6DDD5] disabled:text-[#8F7A6B]"
                  >
                    <Users className="h-5 w-5" strokeWidth={2.5} />
                    {roomBusy ? 'Bergabung...' : 'Gabung Room'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 3. Active Room State */}
          {user && activeRoom && (
            <div className="space-y-4">
              {/* Room Code & Duration Pill Bar */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-[#432B1D] bg-[#FFF8E6] px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A3B]">
                    Kode Room Duel
                  </div>
                  <div className="font-mono-num text-2xl font-bold tracking-[0.2em] text-[#432B1D]">
                    {activeRoom.roomCode}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-xl border-2 border-[#432B1D] bg-white px-2.5 py-1.5 font-mono-num text-xs font-bold text-[#432B1D]">
                    <Clock className="h-3.5 w-3.5 text-[#D94F70]" strokeWidth={2.5} />
                    {activeRoom.durationSec}d
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeRoom.roomCode)}
                    className="btn-25d flex items-center gap-1 rounded-xl bg-[#FFD166] px-3 py-1.5 text-xs font-bold text-[#432B1D]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Players Matchup Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`rounded-2xl border-2 p-3 ${
                    activeRoom.status === 'player1_turn'
                      ? 'border-[#432B1D] bg-[#FFF2DF]'
                      : 'border-[#432B1D]/25 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8A5A3B]">
                    <span>PLAYER 1</span>
                    {resolvedRole === 'player1' && (
                      <span className="rounded bg-[#432B1D] px-1.5 py-0.5 text-white">
                        KAMU
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate font-display text-sm font-bold text-[#432B1D]">
                    {activeRoom.player1Name}
                  </div>
                  <div className="text-[11px] font-semibold text-[#7A5B47]">
                    {CHARACTERS[activeRoom.player1Char].name}
                  </div>
                  {activeRoom.player1Result ? (
                    <div className="mt-2 font-mono-num text-lg font-bold text-[#2B9348]">
                      {activeRoom.player1Result.score} pts
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] font-bold text-[#D94F70]">
                      {activeRoom.status === 'player1_turn'
                        ? 'Giliran Main...'
                        : 'Menunggu P2'}
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-2xl border-2 p-3 ${
                    activeRoom.status === 'player2_turn'
                      ? 'border-[#432B1D] bg-[#FFF2DF]'
                      : 'border-[#432B1D]/25 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8A5A3B]">
                    <span>PLAYER 2</span>
                    {resolvedRole === 'player2' && (
                      <span className="rounded bg-[#432B1D] px-1.5 py-0.5 text-white">
                        KAMU
                      </span>
                    )}
                  </div>
                  {activeRoom.player2Uid ? (
                    <>
                      <div className="mt-1 truncate font-display text-sm font-bold text-[#432B1D]">
                        {activeRoom.player2Name}
                      </div>
                      <div className="text-[11px] font-semibold text-[#7A5B47]">
                        {activeRoom.player2Char
                          ? CHARACTERS[activeRoom.player2Char].name
                          : '-'}
                      </div>
                      {activeRoom.player2Result ? (
                        <div className="mt-2 font-mono-num text-lg font-bold text-[#2B9348]">
                          {activeRoom.player2Result.score} pts
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] font-bold text-[#7A5B47]">
                          {activeRoom.status === 'player2_turn'
                            ? 'Giliran Main...'
                            : 'Menunggu P1'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-2 text-xs font-semibold text-[#8F705D]">
                      Menunggu teman memasukkan kode room...
                    </div>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              {activeRoom.status === 'waiting' && (
                <div className="space-y-2.5 text-center">
                  <p className="text-xs font-semibold text-[#7A5B47]">
                    Bagikan kode <strong className="text-[#432B1D]">{activeRoom.roomCode}</strong> ke temanmu. Permainan otomatis dimulai dari giliran Player 1 begitu Player 2 bergabung!
                  </p>
                  {resolvedRole === 'player1' && (
                    <button
                      type="button"
                      onClick={onCancelWaitingRoom}
                      className="btn-25d inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#C92A3E]"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Batalkan Room
                    </button>
                  )}
                </div>
              )}

              {activeRoom.status === 'player1_turn' && (
                <div className="rounded-2xl border-2 border-[#432B1D]/20 bg-white p-4 text-center space-y-2.5">
                  {isMyTurn ? (
                    <>
                      <p className="text-xs font-semibold text-[#6A4C3A]">
                        Giliranmu pertama! Kumpulkan buah sebanyak mungkin sampai waktu habis atau 3 nyawa habis.
                      </p>
                      <button
                        type="button"
                        onClick={onStartTurn}
                        className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#49C829] py-3 font-display text-base font-bold text-white"
                      >
                        <Play className="h-5 w-5 fill-current" strokeWidth={2.5} />
                        Mulai Giliran Player 1!
                      </button>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-[#7A5B47]">
                      Menunggu {activeRoom.player1Name} menyelesaikan gilirannya... Layar ini akan otomatis terbuka saat giliranmu tiba!
                    </p>
                  )}
                </div>
              )}

              {activeRoom.status === 'player2_turn' && (
                <div className="rounded-2xl border-2 border-[#432B1D]/20 bg-white p-4 text-center space-y-2.5">
                  {isMyTurn ? (
                    <>
                      <p className="text-xs font-semibold text-[#6A4C3A]">
                        Player 1 mencetak{' '}
                        <strong className="font-mono-num text-[#432B1D]">
                          {activeRoom.player1Result?.score ?? 0} poin
                        </strong>
                        . Kalahkan skornya sekarang!
                      </p>
                      <button
                        type="button"
                        onClick={onStartTurn}
                        className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#49C829] py-3 font-display text-base font-bold text-white"
                      >
                        <Play className="h-5 w-5 fill-current" strokeWidth={2.5} />
                        Mulai Giliran Player 2!
                      </button>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-[#7A5B47]">
                      Skor kamu ({activeRoom.player1Result?.score ?? 0} pts) sudah terkunci! Menunggu {activeRoom.player2Name || 'Player 2'} menyelesaikan gilirannya...
                    </p>
                  )}
                </div>
              )}

              {/* Finished Score Comparison */}
              {activeRoom.status === 'finished' &&
                activeRoom.player1Result &&
                activeRoom.player2Result && (() => {
                  const banner = renderWinnerBanner(activeRoom);
                  return (
                    <div className="space-y-3">
                      <div
                        className={`rounded-2xl border-2 border-[#432B1D] ${banner.bg} p-3.5 text-center`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="h-5 w-5 text-[#E89B2D]" strokeWidth={2.75} />
                          <span className={`font-display text-lg font-bold ${banner.accent}`}>
                            {banner.title}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#6A4C3A]">
                          {banner.subtitle}
                        </p>
                      </div>

                      <div className="rounded-2xl border-2 border-[#432B1D]/20 bg-white p-3 text-xs">
                        <div className="grid grid-cols-3 border-b border-[#432B1D]/15 pb-1.5 font-bold text-[#8A5A3B]">
                          <span>Statistik</span>
                          <span className="text-center truncate">{activeRoom.player1Name}</span>
                          <span className="text-center truncate">
                            {activeRoom.player2Name || 'P2'}
                          </span>
                        </div>
                        <div className="divide-y divide-[#432B1D]/10 font-semibold text-[#432B1D]">
                          <div className="grid grid-cols-3 py-2 items-center">
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5 text-[#E89B2D]" strokeWidth={2.5} />
                              Skor
                            </span>
                            <span className="font-mono-num text-center font-bold">
                              {activeRoom.player1Result.score}
                            </span>
                            <span className="font-mono-num text-center font-bold">
                              {activeRoom.player2Result.score}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 py-2 items-center">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-[#F26B7A]" strokeWidth={2.5} />
                              Kombo
                            </span>
                            <span className="font-mono-num text-center">
                              {activeRoom.player1Result.maxCombo}x
                            </span>
                            <span className="font-mono-num text-center">
                              {activeRoom.player2Result.maxCombo}x
                            </span>
                          </div>
                          <div className="grid grid-cols-3 py-2 items-center">
                            <span>Buah</span>
                            <span className="font-mono-num text-center">
                              {activeRoom.player1Result.itemsCaught}
                            </span>
                            <span className="font-mono-num text-center">
                              {activeRoom.player2Result.itemsCaught}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 py-2 items-center">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5 text-[#E63946]" strokeWidth={2.5} />
                              Nyawa
                            </span>
                            <span className="font-mono-num text-center">
                              {activeRoom.player1Result.livesLeft}/{MAX_PLAYER_LIVES}
                            </span>
                            <span className="font-mono-num text-center">
                              {activeRoom.player2Result.livesLeft}/{MAX_PLAYER_LIVES}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onLeaveRoom}
                        className="btn-25d w-full rounded-2xl bg-[#FFD166] py-2.5 font-display text-sm font-bold text-[#432B1D]"
                      >
                        Buat / Gabung Room Baru
                      </button>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

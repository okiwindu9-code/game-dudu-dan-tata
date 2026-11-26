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
  Send,
  Swords,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { AuthErrorDetail } from '../firebase/config';
import {
  CHARACTERS,
  CharacterId,
  InGameDuration,
  MAX_PLAYER_LIVES,
  TurnMatch,
} from '../types/game';
import { AuthErrorBox } from './AuthErrorBox';

interface InviteModalProps {
  user: User | null;
  playerCode: string | null;
  authBusy: boolean;
  selectedCharacter: CharacterId;
  durationMode: InGameDuration;
  activeMatch: TurnMatch | null;
  incomingInvites: TurnMatch[];
  matchError: string | null;
  authError: AuthErrorDetail | null;
  matchBusy: boolean;
  onGoogleLogin: () => void;
  onSendInvite: (targetCode: string, myChar: CharacterId, duration: InGameDuration) => void;
  onAcceptInvite: (match: TurnMatch, myChar: CharacterId) => void;
  onDeclineInvite: (matchId: string) => void;
  onCancelOutgoingInvite: (matchId: string) => void;
  onClearMatch: () => void;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  user,
  playerCode,
  authBusy,
  selectedCharacter,
  durationMode,
  activeMatch,
  incomingInvites,
  matchError,
  authError,
  matchBusy,
  onGoogleLogin,
  onSendInvite,
  onAcceptInvite,
  onDeclineInvite,
  onCancelOutgoingInvite,
  onClearMatch,
  onClose,
}) => {
  const [duelChar, setDuelChar] = useState<CharacterId>(selectedCharacter);
  const [duelDuration, setDuelDuration] = useState<InGameDuration>(durationMode);
  const [friendCode, setFriendCode] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyMyId = () => {
    if (!playerCode) return;
    navigator.clipboard?.writeText(playerCode).catch(() => {});
    setCopiedId(true);
    window.setTimeout(() => setCopiedId(false), 1800);
  };

  const renderWinnerBanner = (match: TurnMatch) => {
    const p1 = match.player1Result?.score ?? 0;
    const p2 = match.player2Result?.score ?? 0;
    if (p1 === p2) {
      return {
        title: 'Hasil Seri!',
        subtitle: `Keduanya imbang dengan ${p1} poin`,
        bg: 'bg-[#FFF3C4]',
        accent: 'text-[#8A5A00]',
      };
    }
    const p1Won = p1 > p2;
    const winnerName = p1Won ? match.player1Name : match.player2Name;
    return {
      title: `${winnerName} Menang!`,
      subtitle: `${p1Won ? match.player1Name : match.player2Name} unggul ${Math.abs(p1 - p2)} poin`,
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
                Invite Mabar Live
              </h2>
              <p className="text-xs font-semibold text-[#7A5B47]">
                Undang teman pakai ID Profil &amp; tonton live di arena 3D!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-25d flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#432B1D]"
            aria-label="Tutup Invite Mabar"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.75} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {authError ? (
            <AuthErrorBox error={authError} />
          ) : (
            matchError && (
              <div className="rounded-2xl border-2 border-[#D9384A] bg-[#FFE8EB] px-3.5 py-2.5 text-xs font-bold text-[#9B1C2E]">
                {matchError}
              </div>
            )
          )}

          {/* 1. Not Signed In */}
          {!user && (
            <div className="rounded-3xl border-2 border-[#432B1D]/20 bg-white p-5 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFD166]">
                <Users className="h-7 w-7 text-[#432B1D]" strokeWidth={2.5} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#432B1D]">
                Masuk Google untuk Dapat ID Mabar
              </h3>
              <p className="text-xs leading-relaxed text-[#7A5B47]">
                Setiap akun Google otomatis mendapat ID Unik 6 digit di profil. Tinggal masukkan ID teman untuk langsung invite mabar tanpa bikin room!
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

          {/* 2. Finished Match Comparison */}
          {user && activeMatch && activeMatch.status === 'finished' && activeMatch.player1Result && activeMatch.player2Result && (() => {
            const banner = renderWinnerBanner(activeMatch);
            return (
              <div className="space-y-3">
                <div className={`rounded-2xl border-2 border-[#432B1D] ${banner.bg} p-4 text-center`}>
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="h-5 w-5 text-[#E89B2D]" strokeWidth={2.75} />
                    <span className={`font-display text-xl font-bold ${banner.accent}`}>
                      {banner.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-[#6A4C3A]">
                    {banner.subtitle}
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-[#432B1D]/20 bg-white p-3.5 text-xs">
                  <div className="grid grid-cols-3 border-b border-[#432B1D]/15 pb-2 font-bold text-[#8A5A3B]">
                    <span>Statistik</span>
                    <span className="text-center truncate">{activeMatch.player1Name}</span>
                    <span className="text-center truncate">{activeMatch.player2Name}</span>
                  </div>
                  <div className="divide-y divide-[#432B1D]/10 font-semibold text-[#432B1D]">
                    <div className="grid grid-cols-3 py-2 items-center">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-[#E89B2D]" strokeWidth={2.5} />
                        Skor
                      </span>
                      <span className="font-mono-num text-center text-sm font-bold">
                        {activeMatch.player1Result.score}
                      </span>
                      <span className="font-mono-num text-center text-sm font-bold">
                        {activeMatch.player2Result.score}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 py-2 items-center">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-[#F26B7A]" strokeWidth={2.5} />
                        Kombo
                      </span>
                      <span className="font-mono-num text-center">
                        {activeMatch.player1Result.maxCombo}x
                      </span>
                      <span className="font-mono-num text-center">
                        {activeMatch.player2Result.maxCombo}x
                      </span>
                    </div>
                    <div className="grid grid-cols-3 py-2 items-center">
                      <span>Buah</span>
                      <span className="font-mono-num text-center">
                        {activeMatch.player1Result.itemsCaught}
                      </span>
                      <span className="font-mono-num text-center">
                        {activeMatch.player2Result.itemsCaught}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 py-2 items-center">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-[#E63946]" strokeWidth={2.5} />
                        Nyawa
                      </span>
                      <span className="font-mono-num text-center">
                        {activeMatch.player1Result.livesLeft}/{MAX_PLAYER_LIVES}
                      </span>
                      <span className="font-mono-num text-center">
                        {activeMatch.player2Result.livesLeft}/{MAX_PLAYER_LIVES}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClearMatch}
                    className="btn-25d flex-1 rounded-2xl bg-[#FFD166] py-2.5 font-display text-sm font-bold text-[#432B1D]"
                  >
                    Undang Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearMatch();
                      onClose();
                    }}
                    className="btn-25d flex-1 rounded-2xl bg-white py-2.5 font-display text-sm font-bold text-[#432B1D]"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 3. Signed In — Invite & Incoming Invites */}
          {user && (!activeMatch || activeMatch.status !== 'finished') && (
            <>
              {/* My Unique Player ID Card */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-[#432B1D] bg-[#FFF8E6] px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A3B]">
                    ID Unik Profilmu
                  </div>
                  <div className="font-mono-num text-2xl font-bold tracking-[0.2em] text-[#432B1D]">
                    {playerCode || '......'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!playerCode}
                  onClick={handleCopyMyId}
                  className="btn-25d flex items-center gap-1.5 rounded-xl bg-[#FFD166] px-3 py-2 text-xs font-bold text-[#432B1D] disabled:opacity-50"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
                      <span>Salin ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Outgoing Pending Invite */}
              {activeMatch && activeMatch.status === 'invited' && (
                <div className="rounded-2xl border-2 border-[#432B1D] bg-[#FFF2DF] p-4 space-y-2.5 text-center">
                  <div className="font-display text-sm font-bold text-[#432B1D]">
                    Menunggu {activeMatch.player2Name} menerima undangan...
                  </div>
                  <p className="text-xs font-semibold text-[#7A5B47]">
                    Begitu {activeMatch.player2Name} klik Terima, kalian berdua langsung masuk ke arena 3D!
                  </p>
                  <button
                    type="button"
                    onClick={() => onCancelOutgoingInvite(activeMatch.matchId)}
                    className="btn-25d inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#C92A3E]"
                  >
                    Batalkan Undangan
                  </button>
                </div>
              )}

              {/* Incoming Invites List */}
              {incomingInvites.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#D94F70]">
                    <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                    <span>Undangan Mabar Masuk ({incomingInvites.length})</span>
                  </div>
                  {incomingInvites.map((inv) => (
                    <div
                      key={inv.matchId}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#432B1D] bg-[#E8F8EE] p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-sm font-bold text-[#432B1D]">
                          {inv.player1Name} (#{inv.player1Code})
                        </div>
                        <div className="text-[11px] font-semibold text-[#1F5C36]">
                          Duel {inv.durationSec} Detik · Pakai {CHARACTERS[duelChar].name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onDeclineInvite(inv.matchId)}
                          className="btn-25d rounded-xl bg-white px-2.5 py-2 text-xs font-bold text-[#9B1C2E]"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => onAcceptInvite(inv, duelChar)}
                          className="btn-25d rounded-xl bg-[#49C829] px-3 py-2 font-display text-xs font-bold text-white"
                        >
                          Terima
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Send Invite Form (shown when not waiting on an outgoing invite) */}
              {(!activeMatch || activeMatch.status === 'declined') && (
                <div className="space-y-3 rounded-2xl border-2 border-[#432B1D]/15 bg-white p-3.5">
                  <div>
                    <label
                      htmlFor="friend-id-input"
                      className="block font-display text-xs font-bold text-[#432B1D] mb-1.5"
                    >
                      Masukkan ID Profil Teman (6 Digit)
                    </label>
                    <input
                      id="friend-id-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={friendCode}
                      onChange={(e) =>
                        setFriendCode(e.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="Contoh: 482915"
                      className="font-mono-num w-full rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFFBF7] px-4 py-2.5 text-center text-xl font-bold tracking-[0.25em] text-[#432B1D] focus:outline-none"
                    />
                  </div>

                  {/* Character Picker */}
                  <div>
                    <span className="block font-display text-xs font-bold text-[#432B1D] mb-1">
                      Pilih Karaktermu
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['dudu', 'tata'] as CharacterId[]).map((cid) => {
                        const c = CHARACTERS[cid];
                        const active = duelChar === cid;
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => setDuelChar(cid)}
                            className={`rounded-xl border-2 p-2 text-left transition-all ${
                              active
                                ? 'border-[#432B1D] bg-[#FFF2DF] shadow-[0_2px_0_#432B1D]'
                                : 'border-[#432B1D]/20 bg-white'
                            }`}
                          >
                            <div className="font-display text-xs font-bold text-[#432B1D]">
                              {c.name}
                            </div>
                            <div className="text-[10px] font-semibold text-[#7A5B47]">
                              {c.traitTitle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#432B1D]/15 bg-[#F7EDE5] p-1">
                    {([45, 60, 90] as InGameDuration[]).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuelDuration(dur)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                          duelDuration === dur
                            ? 'bg-[#432B1D] text-[#FFFBF7]'
                            : 'text-[#6A4C3A]'
                        }`}
                      >
                        <Clock className="mr-1 inline h-3 w-3" strokeWidth={2.5} />
                        {dur}d
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={matchBusy || friendCode.length !== 6 || !playerCode}
                    onClick={() => onSendInvite(friendCode, duelChar, duelDuration)}
                    className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#49C829] py-3 font-display text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#E6DDD5] disabled:text-[#8F7A6B]"
                  >
                    <Send className="h-4.5 w-4.5" strokeWidth={2.5} />
                    {matchBusy ? 'Mengirim Undangan...' : 'Invite Mabar Sekarang!'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

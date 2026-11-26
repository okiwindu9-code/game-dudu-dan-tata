import React from 'react';
import { Coins, Home, RotateCcw, Sparkles, Trophy, Wallet } from 'lucide-react';
import { CHARACTERS, CharacterId, HudSnapshot } from '../types/game';

interface GameOverModalProps {
  characterId: CharacterId;
  summary: HudSnapshot;
  previousBest: number;
  isNewRecord: boolean;
  totalPointsAfter: number;
  onPlayAgain: () => void;
  onOpenExchange: () => void;
  onChooseCharacter: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  characterId,
  summary,
  previousBest,
  isNewRecord,
  totalPointsAfter,
  onPlayAgain,
  onOpenExchange,
  onChooseCharacter,
}) => {
  const char = CHARACTERS[characterId];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#432B1D]/35 p-4">
      <div className="card-25d w-full max-w-md rounded-3xl bg-[#FFFBF7] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#432B1D] bg-[#FFE8EC]">
          <Trophy className="h-7 w-7 text-[#E89B2D]" />
        </div>

        <h2 className="mt-3 font-display text-3xl font-bold text-[#432B1D]">
          Waktu Habis!
        </h2>
        <p className="mt-1 text-sm font-semibold text-[#7A5B47]">
          Petualangan manis bersama {char.name} selesai
        </p>

        <div className="mt-4 rounded-2xl border-2 border-[#432B1D] bg-[#FFF2DF] p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8A5A3B]">
            Skor Ronde Ini
          </div>
          <div className="font-mono-num mt-1 text-5xl font-bold text-[#432B1D]">
            {summary.score}
          </div>
          {isNewRecord ? (
            <div className="mt-2 inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#D94F70]">
              <Sparkles className="h-4 w-4" />
              Rekor Baru untuk {char.name}!
            </div>
          ) : (
            <div className="mt-1.5 text-xs font-semibold text-[#7A5B47]">
              Rekor Terbaik {char.name}:{' '}
              <span className="font-mono-num font-bold">{previousBest}</span>
            </div>
          )}
        </div>

        {/* Points banked to Celengan Poin */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-[#432B1D]/25 bg-[#FFF8E6] px-4 py-2.5 text-left">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#E89B2D]" />
            <span className="text-xs font-bold text-[#432B1D]">
              +{summary.score.toLocaleString('id-ID')} masuk Celengan
            </span>
          </div>
          <span className="font-mono-num text-xs font-bold text-[#8A5A3B]">
            Total: {totalPointsAfter.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl border-2 border-[#432B1D]/20 bg-white p-2.5">
            <div className="text-[11px] font-semibold text-[#7A5B47]">Tertangkap</div>
            <div className="font-mono-num mt-0.5 text-lg font-bold text-[#432B1D]">
              {summary.itemsCaught}
            </div>
          </div>
          <div className="rounded-xl border-2 border-[#432B1D]/20 bg-white p-2.5">
            <div className="text-[11px] font-semibold text-[#7A5B47]">Kombo Maks</div>
            <div className="font-mono-num mt-0.5 text-lg font-bold text-[#432B1D]">
              {summary.maxCombo}x
            </div>
          </div>
          <div className="rounded-xl border-2 border-[#432B1D]/20 bg-white p-2.5">
            <div className="text-[11px] font-semibold text-[#7A5B47]">Kena Bom</div>
            <div className="font-mono-num mt-0.5 text-lg font-bold text-[#D9384A]">
              {summary.hazardsHit}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onPlayAgain}
              className="btn-25d flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F26B7A] py-3 font-display text-base font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Main Lagi
            </button>
            <button
              type="button"
              onClick={onChooseCharacter}
              className="btn-25d flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FFFBF7] py-3 font-display text-base font-bold text-[#432B1D]"
            >
              <Home className="h-4 w-4" />
              Menu Utama
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenExchange}
            className="btn-25d flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD166] py-2.5 font-display text-sm font-bold text-[#432B1D]"
          >
            <Wallet className="h-4 w-4 text-[#2B9348]" />
            Tukar Poin ke Rupiah ({totalPointsAfter.toLocaleString('id-ID')} Poin)
          </button>
        </div>
      </div>
    </div>
  );
};

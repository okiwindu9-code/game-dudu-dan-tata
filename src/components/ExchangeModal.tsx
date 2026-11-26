import React, { useState } from 'react';
import { Check, Coins, ShoppingBag, Wallet, X } from 'lucide-react';
import { EXCHANGE_TIERS, ExchangeTier } from '../types/game';

interface ExchangeModalProps {
  totalPoints: number;
  rupiahBalance: number;
  onExchange: (tier: ExchangeTier) => void;
  onOpenShop: () => void;
  onClose: () => void;
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  totalPoints,
  rupiahBalance,
  onExchange,
  onOpenShop,
  onClose,
}) => {
  const [recentSuccess, setRecentSuccess] = useState<string | null>(null);

  const handleRedeem = (tier: ExchangeTier) => {
    if (totalPoints < tier.pointsCost) return;
    onExchange(tier);
    setRecentSuccess(
      `Berhasil menukar ${tier.pointsCost.toLocaleString('id-ID')} poin menjadi ${tier.label}!`,
    );
    window.setTimeout(() => {
      setRecentSuccess(null);
    }, 2600);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#432B1D]/40 p-4">
      <div className="card-25d flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-[#FFFBF7]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#432B1D]/15 bg-[#FFF2DF] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#FFD166]">
              <Wallet className="h-5 w-5 text-[#432B1D]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold leading-tight text-[#432B1D]">
                Tukar Poin ke Rupiah
              </h2>
              <p className="text-xs font-semibold text-[#7A5B47]">
                Tukarkan poin hasil main lalu belanjakan di Toko Item!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-25d flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#432B1D]"
            aria-label="Tutup Tukar Poin"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Wallet Balances */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-[#432B1D] bg-[#FFF4E6] p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A5A3B]">
                <Coins className="h-3.5 w-3.5 text-[#E89B2D]" />
                <span>Poin Terkumpul</span>
              </div>
              <div className="font-mono-num mt-1 text-2xl font-bold text-[#432B1D]">
                {totalPoints.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-[#432B1D] bg-[#E8F8EE] p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B6E44]">
                <Wallet className="h-3.5 w-3.5 text-[#2B9348]" />
                <span>Saldo Rupiah</span>
              </div>
              <div className="font-mono-num mt-1 text-2xl font-bold text-[#1F5C36]">
                {formatRupiah(rupiahBalance)}
              </div>
            </div>
          </div>

          {recentSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-[#2B9348] bg-[#E8F8EE] px-4 py-2.5 text-sm font-bold text-[#1F5C36]">
              <Check className="h-4 w-4 shrink-0" />
              <span>{recentSuccess}</span>
            </div>
          )}

          {/* Exchange Tiers */}
          <div>
            <h3 className="font-display text-base font-bold text-[#432B1D]">
              Pilih Nominal Penukaran
            </h3>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {EXCHANGE_TIERS.map((tier) => {
                const canAfford = totalPoints >= tier.pointsCost;
                return (
                  <div
                    key={tier.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-3 ${
                      canAfford
                        ? 'border-[#432B1D] bg-white'
                        : 'border-[#432B1D]/20 bg-[#F9F4EF] opacity-80'
                    }`}
                  >
                    <div>
                      <div className="font-display text-lg font-bold text-[#432B1D]">
                        {tier.label}
                      </div>
                      <div className="text-xs font-semibold text-[#7A5B47]">
                        <span className="font-mono-num font-bold text-[#D94F70]">
                          {tier.pointsCost.toLocaleString('id-ID')} Poin
                        </span>{' '}
                        · {tier.bonusNote}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleRedeem(tier)}
                      className={`btn-25d rounded-xl px-3.5 py-2 font-display text-xs font-bold whitespace-nowrap shrink-0 ${
                        canAfford
                          ? 'bg-[#F26B7A] text-white hover:bg-[#EB5869]'
                          : 'cursor-not-allowed bg-[#E6DDD5] text-[#8F7A6B] shadow-none'
                      }`}
                    >
                      {canAfford ? 'Tukar' : 'Kurang'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct CTA to Belanja */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-[#432B1D]/20 bg-[#FFF4E6] p-4 sm:flex-row">
            <div>
              <div className="font-display text-sm font-bold text-[#432B1D]">
                Belanja Topi, Kacamata, Baju &amp; Karpet
              </div>
              <p className="text-xs font-medium text-[#7A5B47]">
                Gunakan saldo Rupiah untuk mendandani Dudu &amp; Tata atau beli booster!
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenShop}
              className="btn-25d flex items-center gap-2 rounded-xl bg-[#FFD166] px-4 py-2.5 font-display text-xs font-bold text-[#432B1D] whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Buka Toko Belanja</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

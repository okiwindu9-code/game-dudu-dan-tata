import React, { useState } from 'react';
import {
  Backpack,
  Check,
  Clock,
  Crown,
  Glasses,
  Layers,
  Shirt,
  ShoppingBag,
  Sparkles,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  CHARACTERS,
  CharacterId,
  PlayerSaveStore,
  SHOP_ITEMS,
  ShopCategory,
  ShopItem,
} from '../types/game';
import { formatRupiah } from './ExchangeModal';

interface ShopModalProps {
  saveStore: PlayerSaveStore;
  selectedCharacter: CharacterId;
  initialTab?: 'all' | ShopCategory;
  onSelectCharacter: (id: CharacterId) => void;
  onBuyItem: (item: ShopItem) => void;
  onToggleEquip: (item: ShopItem, charId: CharacterId) => void;
  onToggleBoosterArm: (boosterId: 'boost_speed' | 'boost_time2x') => void;
  onOpenExchange: () => void;
  onClose: () => void;
}

const CATEGORY_TABS: { id: 'all' | ShopCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'hat', label: 'Topi' },
  { id: 'glasses', label: 'Kacamata' },
  { id: 'shirt', label: 'Baju Polos' },
  { id: 'bag', label: 'Tas' },
  { id: 'carpet', label: 'Karpet Pola' },
  { id: 'booster', label: 'Booster' },
];

function ItemVisualBadge({ item }: { item: ShopItem }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#432B1D] shadow-[0_2px_0_#432B1D]"
      style={{ backgroundColor: item.swatchColor }}
    >
      {item.category === 'hat' && (
        <Crown className="h-6 w-6 text-[#432B1D]" strokeWidth={2.5} />
      )}
      {item.category === 'glasses' && (
        <Glasses
          className="h-6 w-6"
          strokeWidth={2.5}
          style={{ color: item.swatchColor === '#432B1D' ? '#FFFBF7' : '#432B1D' }}
        />
      )}
      {item.category === 'shirt' && (
        <Shirt className="h-6 w-6 text-[#432B1D]" strokeWidth={2.5} />
      )}
      {item.category === 'bag' && (
        <Backpack className="h-6 w-6 text-[#432B1D]" strokeWidth={2.5} />
      )}
      {item.category === 'carpet' && (
        <Layers className="h-6 w-6 text-[#432B1D]" strokeWidth={2.5} />
      )}
      {item.category === 'booster' &&
        (item.id === 'boost_speed' ? (
          <Zap className="h-6 w-6 text-[#432B1D]" strokeWidth={2.5} />
        ) : (
          <Clock className="h-6 w-6 text-[#432B1D]" strokeWidth={2.5} />
        ))}
    </div>
  );
}

export const ShopModal: React.FC<ShopModalProps> = ({
  saveStore,
  selectedCharacter,
  initialTab = 'all',
  onSelectCharacter,
  onBuyItem,
  onToggleEquip,
  onToggleBoosterArm,
  onOpenExchange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | ShopCategory>(initialTab);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleItems =
    activeTab === 'all'
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((it) => it.category === activeTab);

  const charLoadout = saveStore.equippedByChar[selectedCharacter];

  const isEquipped = (item: ShopItem): boolean => {
    if (item.category === 'hat') return charLoadout.hat === item.id;
    if (item.category === 'glasses') return charLoadout.glasses === item.id;
    if (item.category === 'shirt') return charLoadout.shirt === item.id;
    if (item.category === 'bag') return charLoadout.bag === item.id;
    if (item.category === 'carpet') return saveStore.equippedCarpet === item.id;
    return false;
  };

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2200);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#432B1D]/45 p-2.5 sm:p-4">
      <div className="card-25d flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#FFFBF7]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#432B1D]/15 bg-[#FFF2DF] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#F26B7A] text-white">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight text-[#432B1D] sm:text-xl">
                Toko Belanja Dudu &amp; Tata
              </h2>
              <p className="text-xs font-semibold text-[#7A5B47]">
                Beli aksesori 3D, karpet pola &amp; booster bermain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenExchange}
              className="btn-25d flex items-center gap-1.5 rounded-xl bg-[#E8F8EE] px-3 py-1.5 text-xs font-bold text-[#1F5C36]"
              title="Tambah Saldo dari Tukar Poin"
            >
              <Wallet className="h-3.5 w-3.5 text-[#2B9348]" />
              <span className="font-mono-num">{formatRupiah(saveStore.rupiahBalance)}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-25d flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#432B1D]"
              aria-label="Tutup Toko"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Character Dress-Up Switcher + Category Tabs */}
        <div className="border-b-2 border-[#432B1D]/10 bg-white px-5 py-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#7A5B47]">
              Pasang item untuk karakter:
            </span>
            <div className="flex items-center gap-1 rounded-xl border-2 border-[#432B1D]/20 bg-[#F7EDE5] p-0.5">
              {(['dudu', 'tata'] as CharacterId[]).map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => onSelectCharacter(cid)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                    selectedCharacter === cid
                      ? 'bg-[#432B1D] text-[#FFFBF7]'
                      : 'text-[#6A4C3A] hover:text-[#432B1D]'
                  }`}
                >
                  {CHARACTERS[cid].name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORY_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                    active
                      ? 'border-[#432B1D] bg-[#FFD166] text-[#432B1D]'
                      : 'border-[#432B1D]/15 bg-[#FFFBF7] text-[#6A4C3A] hover:border-[#432B1D]/45'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-2xl border-2 border-[#2B9348] bg-[#E8F8EE] px-4 py-2 text-xs font-bold text-[#1F5C36]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Item Grid */}
        <div className="overflow-y-auto p-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleItems.map((item) => {
            const isBooster = item.category === 'booster';
            const owned = !isBooster && saveStore.ownedItems.includes(item.id);
            const equipped = !isBooster && isEquipped(item);
            const canAfford = saveStore.rupiahBalance >= item.priceRupiah;

            const boosterCount =
              item.id === 'boost_speed'
                ? saveStore.boosterCounts.boost_speed
                : item.id === 'boost_time2x'
                  ? saveStore.boosterCounts.boost_time2x
                  : 0;
            const boosterArmed =
              item.id === 'boost_speed'
                ? saveStore.armedBoosters.speedBoost
                : item.id === 'boost_time2x'
                  ? saveStore.armedBoosters.time2xBoost
                  : false;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl border-2 p-3.5 transition-colors ${
                  equipped || boosterArmed
                    ? 'border-[#432B1D] bg-[#FFF8E6]'
                    : 'border-[#432B1D]/25 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <ItemVisualBadge item={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-display text-sm font-bold text-[#432B1D]">
                        {item.name}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#7A5B47]">
                      {item.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs font-bold">
                      <span className="font-mono-num text-[#1F5C36]">
                        {formatRupiah(item.priceRupiah)}
                      </span>
                      {isBooster && (
                        <span className="text-[11px] text-[#8A5A3B]">
                          · Stok: <span className="font-mono-num">{boosterCount}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBooster ? (
                    <>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          onBuyItem(item);
                          triggerFeedback(`${item.name} dibeli & siap dipakai!`);
                        }}
                        className={`btn-25d flex-1 rounded-xl py-2 font-display text-xs font-bold whitespace-nowrap ${
                          canAfford
                            ? 'bg-[#F26B7A] text-white hover:bg-[#EB5869]'
                            : 'cursor-not-allowed bg-[#E6DDD5] text-[#8F7A6B] shadow-none'
                        }`}
                      >
                        {canAfford ? 'Beli (+1)' : 'Saldo Kurang'}
                      </button>
                      {boosterCount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onToggleBoosterArm(item.id as 'boost_speed' | 'boost_time2x')
                          }
                          className={`btn-25d flex items-center gap-1 rounded-xl px-3 py-2 font-display text-xs font-bold whitespace-nowrap ${
                            boosterArmed
                              ? 'bg-[#2B9348] text-white'
                              : 'bg-[#FFFBF7] text-[#432B1D]'
                          }`}
                        >
                          {boosterArmed && <Check className="h-3.5 w-3.5" />}
                          <span>{boosterArmed ? 'Aktif' : 'Pakai'}</span>
                        </button>
                      )}
                    </>
                  ) : owned ? (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleEquip(item, selectedCharacter);
                        triggerFeedback(
                          equipped
                            ? `${item.name} dilepas`
                            : item.category === 'carpet'
                              ? `${item.name} dipasang di arena!`
                              : `${item.name} dipakai oleh ${CHARACTERS[selectedCharacter].name}!`,
                        );
                      }}
                      className={`btn-25d flex w-full items-center justify-center gap-1.5 rounded-xl py-2 font-display text-xs font-bold ${
                        equipped
                          ? 'bg-[#2B9348] text-white'
                          : 'bg-[#FFD166] text-[#432B1D]'
                      }`}
                    >
                      {equipped && <Check className="h-3.5 w-3.5" />}
                      <span>
                        {equipped
                          ? 'Sedang Dipakai (Klik untuk Lepas)'
                          : item.category === 'carpet'
                            ? 'Pasang Karpet'
                            : `Pakai di ${CHARACTERS[selectedCharacter].name}`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => {
                        onBuyItem(item);
                        triggerFeedback(
                          item.category === 'carpet'
                            ? `${item.name} dibeli & dipasang!`
                            : `${item.name} dibeli & dipakai ${CHARACTERS[selectedCharacter].name}!`,
                        );
                      }}
                      className={`btn-25d w-full rounded-xl py-2 font-display text-xs font-bold ${
                        canAfford
                          ? 'bg-[#F26B7A] text-white hover:bg-[#EB5869]'
                          : 'cursor-not-allowed bg-[#E6DDD5] text-[#8F7A6B] shadow-none'
                      }`}
                    >
                      {canAfford
                        ? `Beli · ${formatRupiah(item.priceRupiah)}`
                        : 'Saldo Rupiah Kurang'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

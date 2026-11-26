import React, { useState } from 'react';
import {
  Backpack,
  Check,
  Clock,
  Crown,
  Eye,
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

const CATEGORY_TABS: {
  id: 'all' | ShopCategory;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: 'all', label: 'Semua', icon: Sparkles },
  { id: 'hat', label: 'Topi', icon: Crown },
  { id: 'glasses', label: 'Kacamata', icon: Glasses },
  { id: 'shirt', label: 'Baju', icon: Shirt },
  { id: 'bag', label: 'Tas', icon: Backpack },
  { id: 'carpet', label: 'Karpet', icon: Layers },
  { id: 'booster', label: 'Booster', icon: Zap },
];

function ShopItemArtwork({ item }: { item: ShopItem }) {
  return (
    <div
      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#432B1D] shadow-[0_3px_0_#432B1D]"
      style={{
        backgroundColor:
          item.category === 'carpet' ? item.accentColor || '#FFF8F3' : '#FFF8EE',
      }}
    >
      {item.id === 'hat_straw' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <ellipse cx="32" cy="42" rx="25" ry="7" fill="#F3D28C" stroke="#432B1D" strokeWidth="3" />
          <path d="M18 40 L21 20 Q32 16 43 20 L46 40 Z" fill="#F7DC9E" stroke="#432B1D" strokeWidth="3" />
          <path d="M19 34 Q32 37 45 34 L46 39 Q32 42 18 39 Z" fill="#F26B7A" stroke="#432B1D" strokeWidth="2.5" />
        </svg>
      )}
      {item.id === 'hat_strawberry' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <path d="M14 44 C14 23 50 23 50 44 Z" fill="#FF5E78" stroke="#432B1D" strokeWidth="3" />
          <rect x="11" y="40" width="42" height="9" rx="4.5" fill="#FF8CA0" stroke="#432B1D" strokeWidth="3" />
          <ellipse cx="32" cy="21" rx="10" ry="4" fill="#6BD47F" stroke="#432B1D" strokeWidth="2.5" />
          <circle cx="25" cy="33" r="1.8" fill="#FFF3B0" />
          <circle cx="35" cy="31" r="1.8" fill="#FFF3B0" />
          <circle cx="39" cy="36" r="1.8" fill="#FFF3B0" />
        </svg>
      )}
      {item.id === 'hat_crown' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <path
            d="M12 46 L10 22 L23 32 L32 16 L41 32 L54 22 L52 46 Z"
            fill="#FFD166"
            stroke="#432B1D"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="37" r="4.5" fill="#FF6B8B" stroke="#432B1D" strokeWidth="2.2" />
        </svg>
      )}
      {item.id === 'glasses_cool' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <rect x="8" y="24" width="21" height="16" rx="4" fill="#432B1D" />
          <rect x="35" y="24" width="21" height="16" rx="4" fill="#432B1D" />
          <rect x="27" y="27" width="10" height="4" fill="#432B1D" />
          <line x1="13" y1="28" x2="18" y2="36" stroke="#FFFBF7" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="40" y1="28" x2="45" y2="36" stroke="#FFFBF7" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {item.id === 'glasses_round' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <circle cx="20" cy="33" r="10.5" fill="#BEE9F7" stroke="#F4B942" strokeWidth="4" />
          <circle cx="44" cy="33" r="10.5" fill="#BEE9F7" stroke="#F4B942" strokeWidth="4" />
          <circle cx="20" cy="33" r="11.5" fill="none" stroke="#432B1D" strokeWidth="2" />
          <circle cx="44" cy="33" r="11.5" fill="none" stroke="#432B1D" strokeWidth="2" />
          <path d="M30 31 Q32 28 34 31" fill="none" stroke="#432B1D" strokeWidth="2.5" />
        </svg>
      )}
      {item.category === 'shirt' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <path
            d="M18 16 L8 26 L15 33 L19 29 L19 50 L45 50 L45 29 L49 33 L56 26 L46 16 L39 19 Q32 23 25 19 Z"
            fill={item.swatchColor}
            stroke="#432B1D"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M25 18 Q32 25 39 18" fill="none" stroke="#432B1D" strokeWidth="2.5" />
        </svg>
      )}
      {item.id === 'bag_boba' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <path d="M16 14 L26 26" stroke="#FF8FAB" strokeWidth="5" strokeLinecap="round" />
          <path d="M22 26 L42 26 L38 52 L26 52 Z" fill="#F7D294" stroke="#432B1D" strokeWidth="3" strokeLinejoin="round" />
          <rect x="20" y="22" width="24" height="6" rx="3" fill="#FF6B8B" stroke="#432B1D" strokeWidth="2.5" />
          <line x1="34" y1="12" x2="32" y2="22" stroke="#432B1D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="29" cy="45" r="2.3" fill="#432B1D" />
          <circle cx="35" cy="45" r="2.3" fill="#432B1D" />
          <circle cx="32" cy="41" r="2.3" fill="#432B1D" />
        </svg>
      )}
      {item.id === 'bag_strawberry' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <rect x="17" y="20" width="30" height="32" rx="12" fill="#FF5E78" stroke="#432B1D" strokeWidth="3" />
          <path d="M22 20 Q32 11 42 20 Z" fill="#6BD47F" stroke="#432B1D" strokeWidth="2.5" />
          <rect x="22" y="34" width="20" height="12" rx="5" fill="#FF8CA0" stroke="#432B1D" strokeWidth="2.5" />
        </svg>
      )}
      {item.id === 'bag_star' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <path d="M14 14 L25 26" stroke="#8A5A3B" strokeWidth="4.5" strokeLinecap="round" />
          <polygon
            points="32,16 37,27 49,28 40,36 42,48 32,42 22,48 24,36 15,28 27,27"
            fill="#FFD166"
            stroke="#432B1D"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {item.id === 'carpet_checker' && (
        <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
          <rect x="10" y="14" width="44" height="36" rx="6" fill="#FFF8F3" stroke="#432B1D" strokeWidth="3" />
          <rect x="12" y="16" width="13" height="11" fill="#F88394" />
          <rect x="38" y="16" width="14" height="11" fill="#F88394" />
          <rect x="25" y="27" width="13" height="10" fill="#F88394" />
          <rect x="12" y="37" width="13" height="11" fill="#F88394" />
          <rect x="38" y="37" width="14" height="11" fill="#F88394" />
        </svg>
      )}
      {item.id === 'carpet_polka' && (
        <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
          <rect x="10" y="14" width="44" height="36" rx="6" fill="#A8E6CF" stroke="#432B1D" strokeWidth="3" />
          <circle cx="21" cy="24" r="4" fill="#FFF3B0" stroke="#432B1D" strokeWidth="1.5" />
          <circle cx="42" cy="25" r="4" fill="#FFF3B0" stroke="#432B1D" strokeWidth="1.5" />
          <circle cx="32" cy="33" r="4" fill="#FFF3B0" stroke="#432B1D" strokeWidth="1.5" />
          <circle cx="21" cy="41" r="4" fill="#FFF3B0" stroke="#432B1D" strokeWidth="1.5" />
          <circle cx="42" cy="41" r="4" fill="#FFF3B0" stroke="#432B1D" strokeWidth="1.5" />
        </svg>
      )}
      {item.id === 'carpet_stars' && (
        <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
          <rect x="10" y="14" width="44" height="36" rx="6" fill="#E0C3FC" stroke="#432B1D" strokeWidth="3" />
          <polygon points="32,20 35,28 43,29 37,34 39,42 32,38 25,42 27,34 21,29 29,28" fill="#FFD166" stroke="#432B1D" strokeWidth="2" />
        </svg>
      )}
      {item.id === 'boost_speed' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <polygon
            points="36,10 16,35 30,35 26,54 48,28 34,28"
            fill="#90E0EF"
            stroke="#432B1D"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {item.id === 'boost_time2x' && (
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <circle cx="32" cy="34" r="17" fill="#FFD166" stroke="#432B1D" strokeWidth="3" />
          <path d="M32 24 L32 34 L40 38" fill="none" stroke="#432B1D" strokeWidth="3" strokeLinecap="round" />
          <rect x="27" y="11" width="10" height="5" rx="2" fill="#D94F70" stroke="#432B1D" strokeWidth="2" />
        </svg>
      )}
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
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between md:flex-row md:items-center md:justify-end md:p-5">
      {/* Live 3D Stage Preview Window (Top on Mobile Portrait, Left on PC Landscape) */}
      <div className="pointer-events-none flex items-start justify-between p-3 md:flex-1 md:self-start">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFFBF7] px-3 py-1.5 shadow-[0_3px_0_#432B1D]">
          <Eye className="h-4 w-4 text-[#D94F70]" strokeWidth={2.75} />
          <span className="font-display text-xs font-bold text-[#432B1D]">
            Pratinjau 3D Langsung
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto btn-25d flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFFBF7] text-[#432B1D] md:hidden"
          aria-label="Tutup Toko"
        >
          <X className="h-5 w-5" strokeWidth={2.75} />
        </button>
      </div>

      {/* Main Shop Sheet / Drawer */}
      <div className="pointer-events-auto flex h-[72dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t-[3px] border-[#432B1D] bg-[#FFFBF7] shadow-[0_-6px_0_rgba(67,43,29,0.18)] md:h-[90dvh] md:max-w-xl md:rounded-3xl md:border-[3px] md:shadow-[0_6px_0_#432B1D]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-[#432B1D]/15 bg-[#FFF2DF] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#FFB703] text-[#432B1D]">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.75} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight text-[#432B1D]">
                Toko Gaya &amp; Booster
              </h2>
              <p className="text-[11px] font-semibold text-[#7A5B47]">
                Klik item untuk langsung coba &amp; pasang di 3D!
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
              <Wallet className="h-4 w-4 text-[#2B9348]" strokeWidth={2.5} />
              <span className="font-mono-num">{formatRupiah(saveStore.rupiahBalance)}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-25d hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#432B1D]"
              aria-label="Tutup Toko"
            >
              <X className="h-4.5 w-4.5" strokeWidth={2.75} />
            </button>
          </div>
        </div>

        {/* Character Dress-Up Switcher + Category Tabs */}
        <div className="border-b-2 border-[#432B1D]/10 bg-white px-4 py-2.5 space-y-2 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#7A5B47]">
              Dandani Karakter:
            </span>
            <div className="flex items-center gap-1 rounded-xl border-2 border-[#432B1D]/20 bg-[#F7EDE5] p-0.5">
              {(['dudu', 'tata'] as CharacterId[]).map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => onSelectCharacter(cid)}
                  className={`rounded-lg px-3.5 py-1 font-display text-xs font-bold transition-colors ${
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
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-display text-xs font-bold whitespace-nowrap transition-colors ${
                    active
                      ? 'border-[#432B1D] bg-[#FFD166] text-[#432B1D]'
                      : 'border-[#432B1D]/15 bg-[#FFFBF7] text-[#6A4C3A] hover:border-[#432B1D]/45'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div className="mx-4 mt-2.5 flex items-center gap-2 rounded-2xl border-2 border-[#2B9348] bg-[#E8F8EE] px-3.5 py-2 text-xs font-bold text-[#1F5C36] sm:mx-5">
            <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className={`relative flex flex-col justify-between gap-2.5 rounded-2xl border-[2.5px] p-3 transition-all ${
                  equipped || boosterArmed
                    ? 'border-[#432B1D] bg-[#FFF8E6] shadow-[0_3px_0_#432B1D]'
                    : 'border-[#432B1D]/25 bg-white'
                }`}
              >
                {/* Status Corner Tag */}
                {(equipped || owned || boosterArmed) && (
                  <span
                    className={`self-start rounded-lg border border-[#432B1D] px-2 py-0.5 font-display text-[10px] font-bold ${
                      equipped || boosterArmed
                        ? 'bg-[#49C829] text-white'
                        : 'bg-[#FFD166] text-[#432B1D]'
                    }`}
                  >
                    {equipped
                      ? 'TERPASANG'
                      : boosterArmed
                        ? 'BOOSTER AKTIF'
                        : 'DIMILIKI'}
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <ShopItemArtwork item={item} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold leading-snug text-[#432B1D]">
                      {item.name}
                    </h3>
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

                <div className="flex items-center gap-2 pt-0.5">
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
                              ? 'bg-[#49C829] text-white'
                              : 'bg-[#FFFBF7] text-[#432B1D]'
                          }`}
                        >
                          {boosterArmed && <Check className="h-3.5 w-3.5" strokeWidth={2.75} />}
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
                      {equipped && <Check className="h-3.5 w-3.5" strokeWidth={2.75} />}
                      <span>
                        {equipped
                          ? 'Lepas Item'
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
                        : 'Saldo Kurang · Tukar Poin'}
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

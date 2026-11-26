export type CharacterId = 'dudu' | 'tata';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

export type InGameDuration = 45 | 60 | 90;

export type CollectibleType =
  | 'strawberry'
  | 'peach'
  | 'watermelon'
  | 'donut'
  | 'boba'
  | 'clock'
  | 'bomb';

export type HatId = 'hat_straw' | 'hat_strawberry' | 'hat_crown';
export type GlassesId = 'glasses_cool' | 'glasses_round';
export type ShirtId = 'shirt_pink' | 'shirt_mint' | 'shirt_butter';
export type CarpetId = 'default' | 'carpet_checker' | 'carpet_polka' | 'carpet_stars';
export type BoosterId = 'boost_speed' | 'boost_time2x';

export type ShopCategory = 'hat' | 'glasses' | 'shirt' | 'carpet' | 'booster';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  priceRupiah: number;
  description: string;
  swatchColor: string;
  accentColor?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Topi
  {
    id: 'hat_straw',
    name: 'Topi Jerami Pita',
    category: 'hat',
    priceRupiah: 50000,
    description: 'Topi piknik hangat dengan pita stroberi',
    swatchColor: '#F3D28C',
    accentColor: '#F26B7A',
  },
  {
    id: 'hat_strawberry',
    name: 'Topi Kupluk Stroberi',
    category: 'hat',
    priceRupiah: 65000,
    description: 'Kupluk rajut merah manis berdaun hijau',
    swatchColor: '#FF6B7D',
    accentColor: '#6BD47F',
  },
  {
    id: 'hat_crown',
    name: 'Mahkota Madu Emas',
    category: 'hat',
    priceRupiah: 95000,
    description: 'Mahkota emas mini untuk sang juara buah',
    swatchColor: '#FFD166',
    accentColor: '#FF8FAB',
  },

  // Aksesoris Kacamata
  {
    id: 'glasses_cool',
    name: 'Kacamata Hitam Keren',
    category: 'glasses',
    priceRupiah: 55000,
    description: 'Gaya santai anti silau di padang rumput',
    swatchColor: '#432B1D',
    accentColor: '#FFFBF7',
  },
  {
    id: 'glasses_round',
    name: 'Kacamata Bulat Emas',
    category: 'glasses',
    priceRupiah: 60000,
    description: 'Bingkai emas bulat menggemaskan',
    swatchColor: '#F4B942',
    accentColor: '#BEE9F7',
  },

  // Baju Polos
  {
    id: 'shirt_pink',
    name: 'Baju Polos Pink',
    category: 'shirt',
    priceRupiah: 50000,
    description: 'Kaos katun polos warna merah muda pastel',
    swatchColor: '#FF9EB5',
  },
  {
    id: 'shirt_mint',
    name: 'Baju Polos Mint',
    category: 'shirt',
    priceRupiah: 55000,
    description: 'Kaos polos sejuk bernuansa hijau mint',
    swatchColor: '#8CE0B4',
  },
  {
    id: 'shirt_butter',
    name: 'Baju Polos Mentega',
    category: 'shirt',
    priceRupiah: 60000,
    description: 'Kaos polos lembut kuning mentega',
    swatchColor: '#FFE082',
  },

  // Karpet Pola (Stage Floor)
  {
    id: 'carpet_checker',
    name: 'Karpet Kotak Stroberi',
    category: 'carpet',
    priceRupiah: 65000,
    description: 'Karpet kotak-kotak piknik merah muda & krem',
    swatchColor: '#F88394',
    accentColor: '#FFF8F3',
  },
  {
    id: 'carpet_polka',
    name: 'Karpet Polkadot Mint',
    category: 'carpet',
    priceRupiah: 75000,
    description: 'Karpet hijau mint dengan motif polkadot ceria',
    swatchColor: '#A8E6CF',
    accentColor: '#FFF3B0',
  },
  {
    id: 'carpet_stars',
    name: 'Karpet Bintang Madu',
    category: 'carpet',
    priceRupiah: 90000,
    description: 'Karpet lavender lembut bertabur bintang emas',
    swatchColor: '#E0C3FC',
    accentColor: '#FFD166',
  },

  // Booster In-Game
  {
    id: 'boost_speed',
    name: 'Booster Kecepatan +35%',
    category: 'booster',
    priceRupiah: 50000,
    description: 'Tambah kecepatan lari +35% selama 1 ronde',
    swatchColor: '#90E0EF',
    accentColor: '#0077B6',
  },
  {
    id: 'boost_time2x',
    name: 'Booster Waktu 2x Lipat',
    category: 'booster',
    priceRupiah: 75000,
    description: 'Gandakan waktu bermain 2x lipat selama 1 ronde',
    swatchColor: '#FFD166',
    accentColor: '#D94F70',
  },
];

export interface EquippedLoadout {
  hat: HatId | null;
  glasses: GlassesId | null;
  shirt: ShirtId | null;
}

export interface ActiveBoosters {
  speedBoost: boolean;
  time2xBoost: boolean;
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  title: string;
  traitTitle: string;
  traitDetail: string;
  accentColor: string;
  softBg: string;
  moveSpeed: number;
  catchRadius: number;
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  dudu: {
    id: 'dudu',
    name: 'Dudu',
    title: 'Panda Manis',
    traitTitle: 'Pelukan Magnet',
    traitDetail: 'Jangkauan tangkap 18% lebih lebar & nyaman',
    accentColor: '#F26B7A',
    softBg: '#FFF0F3',
    moveSpeed: 10.8,
    catchRadius: 1.54,
  },
  tata: {
    id: 'tata',
    name: 'Tata',
    title: 'Beruang Karamel',
    traitTitle: 'Langkah Lincah',
    traitDetail: 'Berlari 15% lebih cepat mengejar buah jauh',
    accentColor: '#C4936E',
    softBg: '#FFF4E6',
    moveSpeed: 12.4,
    catchRadius: 1.3,
  },
};

export interface TimeModeConfig {
  durationSec: InGameDuration;
  label: string;
  subtitle: string;
  spawnInterval: number;
  fallSpeedMin: number;
  fallSpeedMax: number;
  bombChance: number;
}

export const TIME_MODES: Record<InGameDuration, TimeModeConfig> = {
  45: {
    durationSec: 45,
    label: '45 Detik',
    subtitle: 'Cepat & Seru',
    spawnInterval: 0.43,
    fallSpeedMin: 5.0,
    fallSpeedMax: 7.4,
    bombChance: 0.15,
  },
  60: {
    durationSec: 60,
    label: '60 Detik',
    subtitle: 'Seimbang',
    spawnInterval: 0.54,
    fallSpeedMin: 4.3,
    fallSpeedMax: 6.4,
    bombChance: 0.13,
  },
  90: {
    durationSec: 90,
    label: '90 Detik',
    subtitle: 'Santai',
    spawnInterval: 0.68,
    fallSpeedMin: 3.6,
    fallSpeedMax: 5.3,
    bombChance: 0.09,
  },
};

export interface ExchangeTier {
  id: string;
  pointsCost: number;
  rupiahValue: number;
  label: string;
  bonusNote: string;
}

export const EXCHANGE_TIERS: ExchangeTier[] = [
  {
    id: 'tier_10k',
    pointsCost: 500,
    rupiahValue: 10000,
    label: 'Rp 10.000',
    bonusNote: 'Paket Pemula',
  },
  {
    id: 'tier_30k',
    pointsCost: 2000,
    rupiahValue: 30000,
    label: 'Rp 30.000',
    bonusNote: 'Paket Hemat',
  },
  {
    id: 'tier_75k',
    pointsCost: 4500,
    rupiahValue: 75000,
    label: 'Rp 75.000',
    bonusNote: 'Paket Favorit',
  },
  {
    id: 'tier_180k',
    pointsCost: 10000,
    rupiahValue: 180000,
    label: 'Rp 180.000',
    bonusNote: 'Paket Sultan',
  },
];

export interface FloatingPopup {
  id: number;
  x: number;
  y: number;
  label: string;
  variant: 'points' | 'bonus' | 'time' | 'fever' | 'hazard';
}

export interface HudSnapshot {
  score: number;
  timeLeft: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  feverActive: boolean;
  feverProgress: number;
  feverTimeLeft: number;
  itemsCaught: number;
  hazardsHit: number;
}

export interface PlayerSaveStore {
  tataBest: number;
  duduBest: number;
  bestCombo: number;
  totalPoints: number;
  rupiahBalance: number;
  exchangeCount: number;
  ownedItems: string[];
  equippedByChar: Record<CharacterId, EquippedLoadout>;
  equippedCarpet: CarpetId;
  boosterCounts: {
    boost_speed: number;
    boost_time2x: number;
  };
  armedBoosters: ActiveBoosters;
}

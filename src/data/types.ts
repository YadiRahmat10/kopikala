export type TableStatus = 'kosong' | 'terisi' | 'dipesan' | 'kotor';
export type Area = 'Indoor' | 'Outdoor' | 'Smoking';

export interface CafeTable {
  id: number;
  area: Area;
  zone: string;
  seats: number;
  seatLabel: string;
  icon: string;
  feature: string;
  status: TableStatus;
  since?: number;
  reservedFor?: string;
  reservedAt?: string;
  order?: string;
}

export type Category = 'Kopi' | 'Non-Kopi' | 'Pastry' | 'Makanan' | 'Camilan' | 'Musiman';
export type MenuTag = 'Signature' | 'Favorit' | 'Musiman' | 'Single Origin' | 'Baru';

export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  category: Category;
  subtitle: string;
  tag?: MenuTag;
  description: string;
  price: number;
  hpp?: number;
  image: string;
  /** null = tanpa batas kuota */
  stock: number | null;
  lowAt: number;
  /** tampil di menu QR pelanggan */
  active: boolean;
  online: boolean;
  soldOutNote?: string;
  createdAt: number;
}

export type MenuStatus = 'tersedia' | 'menipis' | 'habis';

export interface Show {
  id: string;
  /** hari ke-n dari hari ini (0 = malam ini) */
  dayOffset: number;
  title: string;
  genre: string;
  icon: string;
  hasLive: boolean;
  start?: string;
  end?: string;
  timeNote?: string;
  location?: string;
  sessions?: string[];
  image?: string;
}

export interface ActivityLog {
  id: string;
  who: string;
  text: string;
  highlight: string;
  tone: 'success' | 'danger' | 'info';
  at: number;
}

export interface Stage {
  artistArrived: boolean;
  soundcheck: boolean;
  micReady: boolean;
  songRequests: number;
  masterLevel: number;
}

export interface CartLine {
  menuId: string;
  qty: number;
  /** catatan pelanggan untuk barista; menu yang sama dengan catatan berbeda jadi baris terpisah */
  note?: string;
}

export interface AppData {
  tables: CafeTable[];
  menu: MenuItem[];
  shows: Show[];
  logs: ActivityLog[];
  stage: Stage;
  reminders: string[];
  savedTable: number | null;
  /** id menu baru yang perlu diumumkan ke pelanggan */
  announcements: string[];
  cart: CartLine[];
  lastSync: number;
}

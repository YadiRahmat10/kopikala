import type { Area, CafeTable, MenuItem, MenuStatus, Show } from '../data/types';
import { CAFE } from '../data/seed';

export const rupiah = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n));

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function minutesAgo(ts: number, now: number) {
  return Math.max(0, Math.round((now - ts) / 60_000));
}

/** "45 mnt" / "1 jam" / "1j 15m" */
export function durationLabel(ts: number, now: number, compact = false) {
  const m = Math.max(1, minutesAgo(ts, now));
  if (m < 60) return compact ? `${m}m` : `${m} mnt`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (compact) return r ? `${h}j ${r}m` : `${h}j`;
  return r >= 15 ? `${h} jam ${r} mnt` : `${h} jam`;
}

export function syncLabel(ts: number, now: number) {
  const m = minutesAgo(ts, now);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  return `${Math.floor(m / 60)} jam lalu`;
}

export function clockLabel(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}.${pad2(d.getMinutes())} WIB`;
}

export function dayDate(offset: number, now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

export const fmtLongDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const fmtShortDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

export const fmtRange = (a: Date, b: Date) =>
  `${a.getDate()} - ${b.getDate()} ${b.toLocaleDateString('id-ID', { month: 'short' })}`;

export function isOpen(now: number) {
  const h = new Date(now).getHours();
  return h >= CAFE.open && h < CAFE.close;
}

export function menuStatus(item: MenuItem): MenuStatus {
  if (item.stock === 0) return 'habis';
  if (item.stock !== null && item.stock <= item.lowAt) return 'menipis';
  return 'tersedia';
}

export function showTime(show: Show) {
  if (!show.start) return '';
  return `${show.start} - ${show.end} WIB${show.timeNote ? ` (${show.timeNote})` : ''}`;
}

/** Bagi pelanggan, meja kotor dihitung sebagai belum bisa dipakai (terisi). */
export function guestStatus(t: CafeTable) {
  return t.status === 'kotor' ? 'terisi' : t.status;
}

export const isOutdoor = (a: Area) => a !== 'Indoor';

export function tableStats(tables: CafeTable[]) {
  const free = tables.filter((t) => t.status === 'kosong');
  return {
    total: tables.length,
    free: free.length,
    freeIndoor: free.filter((t) => !isOutdoor(t.area)).length,
    freeOutdoor: free.filter((t) => isOutdoor(t.area)).length,
    busy: tables.filter((t) => guestStatus(t) === 'terisi').length,
    reserved: tables.filter((t) => t.status === 'dipesan').length,
    dirty: tables.filter((t) => t.status === 'kotor').length,
  };
}

export async function shareText(title: string, text: string) {
  const url = window.location.origin;
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

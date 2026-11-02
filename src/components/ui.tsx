import type { ReactNode } from 'react';
import { useIonToast } from '@ionic/react';
import type { MenuStatus, OrderStatus, TableStatus } from '../data/types';

export function Icon({ name, size = 20, fill = false, className = '' }: { name: string; size?: number; fill?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}` }}
    >
      {name}
    </span>
  );
}

const TONES = {
  green: 'bg-emerald-500/10 text-emerald-800',
  red: 'bg-red-500/10 text-red-700',
  orange: 'bg-orange-500/10 text-orange-800',
  amber: 'bg-amber-500/15 text-amber-900',
  muted: 'bg-stone-500/10 text-stone-600',
  rose: 'bg-secondary-container text-on-secondary-container',
  cream: 'bg-surface-container text-primary',
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone, icon, children, className = '' }: { tone: Tone; icon?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`chip ${TONES[tone]} ${className}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export const TABLE_BADGE: Record<TableStatus, { tone: Tone; label: string; long: string }> = {
  kosong: { tone: 'green', label: 'Kosong', long: 'Siap digunakan' },
  terisi: { tone: 'red', label: 'Terisi', long: 'Sedang dipakai' },
  dipesan: { tone: 'orange', label: 'Dipesan', long: 'Sudah dipesan' },
  kotor: { tone: 'amber', label: 'Kotor', long: 'Perlu dibersihkan' },
};

export const MENU_BADGE: Record<MenuStatus, Tone> = { tersedia: 'green', menipis: 'orange', habis: 'red' };

export const ORDER_BADGE: Record<OrderStatus, { tone: Tone; label: string }> = {
  baru: { tone: 'rose', label: 'Baru' },
  diproses: { tone: 'amber', label: 'Diproses' },
  diantar: { tone: 'orange', label: 'Diantar' },
  selesai: { tone: 'green', label: 'Selesai' },
  batal: { tone: 'muted', label: 'Dibatalkan' },
};

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${checked ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max, size = 'md' }: { value: number; onChange: (delta: number) => void; min?: number; max?: number; size?: 'sm' | 'md' }) {
  const b = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="flex items-center gap-1 rounded-full border border-[rgba(42,26,20,0.08)] bg-white/80 p-0.5">
      <button type="button" aria-label="Kurangi" disabled={value <= min} onClick={() => onChange(-1)} className={`icon-btn ${b} text-primary hover:bg-surface-container disabled:opacity-30`}>
        <Icon name="remove" size={18} />
      </button>
      <span className="min-w-[24px] text-center text-label-lg text-primary">{value}</span>
      <button type="button" aria-label="Tambah" disabled={max !== undefined && value >= max} onClick={() => onChange(1)} className={`icon-btn ${b} text-primary hover:bg-surface-container disabled:opacity-30`}>
        <Icon name="add" size={18} />
      </button>
    </div>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="scroll-x py-0.5">{children}</div>;
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-[rgba(42,26,20,0.12)] px-6 py-10 text-center">
      <div className="icon-btn h-14 w-14 bg-surface-container text-secondary">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="text-headline-sm text-primary">{title}</h3>
      <p className="text-body-sm text-on-surface-variant">{text}</p>
      {action}
    </div>
  );
}

/** Toast bergaya desain (hijau sukses / gelap informasi). */
export function useToast() {
  const [present] = useIonToast();
  return (message: string, kind: 'success' | 'info' = 'success') =>
    present({
      message,
      duration: 2200,
      position: 'top',
      cssClass: kind === 'success' ? 'kk-toast' : 'kk-toast kk-toast-info',
    });
}

import { useState } from 'react';
import { IonModal, IonRange } from '@ionic/react';
import { Icon } from './ui';

const KEY = 'kopikala-glass-v1';
const MIN = 0.2;
const MAX = 0.9;
export const GLASS_DEFAULT = 0.42;

const PRESETS = [
  { label: 'Jernih', value: 0.22 },
  { label: 'Seimbang', value: GLASS_DEFAULT },
  { label: 'Buram', value: 0.8 },
];

/** Tingkat kejernihan kaca disimpan per perangkat, seperti slider Liquid Glass di iOS 27. */
export function loadGlass() {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (v >= MIN && v <= MAX) return v;
  } catch {
    /* storage tidak tersedia */
  }
  return GLASS_DEFAULT;
}

export function applyGlass(v: number) {
  document.documentElement.style.setProperty('--lg-alpha', v.toFixed(2));
}

function saveGlass(v: number) {
  applyGlass(v);
  try {
    localStorage.setItem(KEY, String(v));
  } catch {
    /* storage tidak tersedia */
  }
}

export function GlassSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [value, setValue] = useState(loadGlass);
  const set = (v: number) => {
    setValue(v);
    saveGlass(v);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
      <div className="kk-scroll px-6 pb-6 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-headline-md text-primary">Tampilan kaca</h2>
            <p className="text-body-sm text-on-surface-variant">Atur seberapa tembus pandang kaca di seluruh aplikasi.</p>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} className="icon-btn glass-btn h-10 w-10 text-on-surface-variant">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Icon name="water_drop" size={20} className="text-on-surface-variant" />
          <IonRange
            aria-label="Kejernihan kaca"
            min={MIN}
            max={MAX}
            step={0.01}
            value={value}
            onIonInput={(e) => set(Number(e.detail.value))}
            className="kk-glass-range flex-1"
          />
          <Icon name="blur_on" size={22} className="text-on-surface-variant" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => {
            const active = Math.abs(value - p.value) < 0.03;
            return (
              <button key={p.label} type="button" aria-pressed={active} onClick={() => set(p.value)} className={`filter-chip h-10 justify-center ${active ? 'filter-chip-active' : ''}`}>
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-label-md font-medium text-on-surface-variant">
          Pilih Buram kalau teks terasa sulit dibaca. Mode "Kurangi transparansi" di pengaturan HP selalu diutamakan.
        </p>
      </div>
    </IonModal>
  );
}

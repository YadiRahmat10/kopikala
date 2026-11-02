import { useEffect, useState } from 'react';
import { IonModal } from '@ionic/react';
import { rupiah } from '../lib/format';
import { Icon, Stepper } from './ui';
import type { Category, MenuItem } from '../data/types';

const DRINK_NOTES = ['Gula sedikit', 'Tanpa gula', 'Es sedikit', 'Tanpa es', 'Susu oat'];
const QUICK_NOTES: Record<Category, string[]> = {
  Kopi: [...DRINK_NOTES, 'Tambah shot', 'Sajikan panas'],
  'Non-Kopi': DRINK_NOTES,
  Musiman: DRINK_NOTES,
  Pastry: ['Dipanaskan', 'Potong dua', 'Dibungkus'],
  Makanan: ['Tidak pedas', 'Saus terpisah', 'Dibungkus'],
  Camilan: ['Saus terpisah', 'Tanpa saus', 'Dibungkus'],
};
const MAX_NOTE = 120;

const splitNote = (note: string) => note.split(',').map((p) => p.trim()).filter(Boolean);

/** Sheet pilih jumlah + catatan untuk barista; dipakai saat menambah menu dan mengedit isi pesanan. */
export function MenuNoteSheet({
  item,
  initial,
  maxQty,
  onClose,
  onSubmit,
}: {
  item: MenuItem | null;
  /** diisi saat mengedit baris pesanan yang sudah ada */
  initial?: { qty: number; note: string };
  maxQty?: number;
  onClose: () => void;
  onSubmit: (qty: number, note: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!item) return;
    setQty(initial?.qty ?? 1);
    setNote(initial?.note ?? '');
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  const parts = splitNote(note);
  const toggleQuick = (q: string) => {
    const next = parts.includes(q) ? parts.filter((p) => p !== q) : [...parts, q];
    setNote(next.join(', ').slice(0, MAX_NOTE));
  };

  return (
    <IonModal isOpen={!!item} onDidDismiss={onClose} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
      {item && (
        <div className="kk-scroll px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6">
          <div className="flex items-start gap-3">
            <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <span className="eyebrow">{initial ? 'Ubah Pesanan' : item.category}</span>
              <h2 className="text-headline-sm text-primary">{item.name}</h2>
              <p className="text-label-lg text-secondary">{rupiah(item.price)}</p>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} className="icon-btn h-10 w-10 bg-surface-container text-on-surface-variant">
              <Icon name="close" size={20} />
            </button>
          </div>
          <p className="mt-3 text-body-sm text-on-surface-variant">{item.description}</p>

          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-label-lg text-primary">
              <Icon name="edit_note" size={20} />
              Catatan untuk Barista
              <span className="text-label-md font-medium text-on-surface-variant">(opsional)</span>
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_NOTES[item.category].map((q) => (
                <button key={q} type="button" onClick={() => toggleQuick(q)} className={`filter-chip h-9 px-3 ${parts.includes(q) ? 'filter-chip-active' : ''}`}>
                  {parts.includes(q) && <Icon name="check" size={16} />}
                  {q}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              maxLength={MAX_NOTE}
              value={note}
              placeholder="mis. gula dipisah, tolong antar setelah makanan..."
              onChange={(e) => setNote(e.target.value)}
              className="input resize-none"
            />
            <span className="mt-1 block text-right text-label-sm text-on-surface-variant">{note.length}/{MAX_NOTE}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-label-lg text-primary">Jumlah</span>
            <Stepper value={qty} min={initial ? 0 : 1} max={maxQty} onChange={(d) => setQty((q) => q + d)} />
          </div>

          <button type="button" disabled={!initial && maxQty === 0} onClick={() => onSubmit(qty, note.trim())} className="btn-primary mt-5 w-full justify-between px-5">
            <span className="flex items-center gap-2">
              <Icon name={initial ? (qty ? 'check' : 'delete') : 'add_shopping_cart'} size={20} />
              {initial ? (qty ? 'Simpan Perubahan' : 'Hapus dari Pesanan') : 'Tambah ke Pesanan'}
            </span>
            <span>{rupiah(item.price * qty)}</span>
          </button>
        </div>
      )}
    </IonModal>
  );
}

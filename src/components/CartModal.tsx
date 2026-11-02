import { useEffect, useState } from 'react';
import { IonModal } from '@ionic/react';
import { useApp } from '../state/AppState';
import { pad2, rupiah } from '../lib/format';
import { Icon, Stepper, useToast } from './ui';
import { MenuNoteSheet } from './MenuNoteSheet';
import type { CartLine } from '../data/types';

export function CartModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data, changeCart, editCartLine, placeOrder } = useApp();
  const toast = useToast();
  const [table, setTable] = useState<number | null>(null);
  const [editing, setEditing] = useState<CartLine | null>(null);

  const lines = data.cart
    .map((c) => ({ ...c, item: data.menu.find((m) => m.id === c.menuId)! }))
    .filter((l) => l.item);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  /** sisa kuota yang masih bisa ditambahkan ke baris ini (stok dikurangi menu sama di baris lain) */
  const roomFor = (line: CartLine, stock: number | null) =>
    stock === null ? undefined : stock - data.cart.filter((c) => c.menuId === line.menuId && (c.note ?? '') !== (line.note ?? '')).reduce((s, c) => s + c.qty, 0);
  const editingItem = editing ? data.menu.find((m) => m.id === editing.menuId) ?? null : null;
  const choices = data.tables.filter((t) => t.status === 'kosong' || t.id === data.savedTable || t.id === table);

  useEffect(() => {
    if (isOpen) setTable(data.savedTable ?? null);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    placeOrder(table);
    onClose();
    toast(table ? `Pesanan dikirim ke barista • Meja ${pad2(table)}` : 'Pesanan takeaway dikirim ke barista');
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
      <div className="kk-scroll px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="eyebrow">Pesanan Kamu</span>
            <h2 className="text-headline-md text-primary">Ringkasan Order</h2>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} className="icon-btn h-10 w-10 bg-surface-container text-on-surface-variant">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="mt-4 flex flex-col divide-y divide-[rgba(75,46,42,0.08)]">
          {lines.map(({ item, ...line }) => (
            <div key={`${item.id}|${line.note ?? ''}`} className="flex items-center gap-3 py-3">
              <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg text-primary">{item.name}</p>
                <p className="text-label-md text-secondary">{rupiah(item.price * line.qty)}</p>
                <button type="button" onClick={() => setEditing(line)} className="mt-0.5 flex max-w-full items-start gap-1 text-left text-label-md font-medium text-on-surface-variant">
                  <Icon name={line.note ? 'edit_note' : 'add'} size={16} className="shrink-0" />
                  <span className={line.note ? 'line-clamp-2 italic' : 'underline'}>{line.note || 'Tambah catatan'}</span>
                </button>
              </div>
              <Stepper size="sm" value={line.qty} min={0} max={roomFor(line, item.stock)} onChange={(d) => changeCart(item.id, d, line.note)} />
            </div>
          ))}
        </div>

        <div className="mt-2">
          <p className="mb-2 text-label-lg text-primary">Antar ke Meja</p>
          <div className="scroll-x py-0.5">
            <button type="button" onClick={() => setTable(null)} className={`filter-chip ${table === null ? 'filter-chip-active' : 'bg-surface-container'}`}>
              <Icon name="shopping_bag" size={16} /> Takeaway
            </button>
            {choices.map((t) => (
              <button key={t.id} type="button" onClick={() => setTable(t.id)} className={`filter-chip ${table === t.id ? 'filter-chip-active' : 'bg-surface-container'}`}>
                Meja {pad2(t.id)}
                {t.id === data.savedTable && <Icon name="bookmark" size={14} fill />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-container-low p-4">
          <span className="text-label-lg text-on-surface-variant">Total Bayar</span>
          <span className="text-counter text-primary">{rupiah(total)}</span>
        </div>

        <button type="button" disabled={!lines.length} onClick={submit} className="btn-primary mt-4 w-full">
          <Icon name="send" size={20} />
          Kirim Pesanan ke Barista
        </button>
        <p className="mt-2 text-center text-label-md font-medium text-on-surface-variant">Bayar di kasir setelah pesanan diantar</p>
      </div>
      <MenuNoteSheet
        item={editingItem}
        initial={editing ? { qty: editing.qty, note: editing.note ?? '' } : undefined}
        maxQty={editing && editingItem ? roomFor(editing, editingItem.stock) : undefined}
        onClose={() => setEditing(null)}
        onSubmit={(qty, note) => {
          if (editing) editCartLine(editing.menuId, editing.note ?? '', { qty, note });
          setEditing(null);
        }}
      />
    </IonModal>
  );
}

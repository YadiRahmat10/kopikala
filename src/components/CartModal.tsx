import { useEffect, useState } from 'react';
import { IonModal } from '@ionic/react';
import { useApp } from '../state/AppState';
import { pad2, rupiah } from '../lib/format';
import { Icon, Stepper, useToast } from './ui';
import QRCode from 'qrcode';
import { MenuNoteSheet } from './MenuNoteSheet';
import { CAFE } from '../data/seed';
import type { CartLine, PaymentMethod } from '../data/types';

const PAYMENTS: { key: PaymentMethod; icon: string; title: string; sub: string }[] = [
  { key: 'qris', icon: 'qr_code_2', title: 'QRIS', sub: 'GoPay, OVO, DANA, ShopeePay & m-banking' },
  { key: 'kasir', icon: 'point_of_sale', title: 'Bayar di Kasir', sub: 'Tunai / debit langsung ke kasir' },
];

/** QR demo. Untuk transaksi sungguhan ganti dengan QRIS merchant / payment gateway. */
function QrisCode({ amount }: { amount: number }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(`${CAFE.name.toUpperCase()}|QRIS-DEMO|${amount}`, { margin: 1, width: 480, color: { dark: '#331916', light: '#ffffff' } })
      .then(setSrc)
      .catch(() => setSrc(''));
  }, [amount]);
  return (
    <div className="mx-auto w-full max-w-[240px] rounded-2xl bg-white p-3 shadow-md">
      {src ? <img src={src} alt="Kode QRIS" className="aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-lg bg-neutral-100" />}
    </div>
  );
}

export function CartModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data, changeCart, editCartLine, placeOrder } = useApp();
  const toast = useToast();
  const [table, setTable] = useState<number | null>(null);
  const [editing, setEditing] = useState<CartLine | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('qris');
  const [step, setStep] = useState<'review' | 'qris'>('review');

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
    if (!isOpen) return;
    setTable(data.savedTable ?? null);
    setStep('review');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    const order = placeOrder(table, payment);
    onClose();
    const where = table ? `Meja ${pad2(table)}` : 'Takeaway';
    toast(payment === 'qris' ? `Pembayaran diterima • Pesanan #${order.code} (${where}) dikirim` : `Pesanan #${order.code} (${where}) dikirim • Bayar di kasir`);
  };
  const submit = () => (payment === 'qris' ? setStep('qris') : send());

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
      {step === 'qris' ? (
        <div className="kk-scroll px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="eyebrow">Pembayaran QRIS</span>
              <h2 className="text-headline-md text-primary">Scan untuk Bayar</h2>
            </div>
            <button type="button" aria-label="Kembali" onClick={() => setStep('review')} className="icon-btn h-10 w-10 bg-surface-container text-on-surface-variant">
              <Icon name="arrow_back" size={20} />
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-center">
            <span className="chip bg-white text-primary">
              <Icon name="qr_code_2" size={16} /> QRIS • {CAFE.name}
            </span>
            <QrisCode amount={total} />
            <div>
              <p className="text-label-md font-medium text-on-surface-variant">Total yang harus dibayar</p>
              <p className="text-counter text-primary">{rupiah(total)}</p>
            </div>
            <p className="text-body-sm text-on-surface-variant">Buka aplikasi e-wallet atau m-banking, scan kode di atas, lalu pastikan nominalnya sesuai.</p>
          </div>
          <button type="button" onClick={send} className="btn-primary mt-4 w-full">
            <Icon name="check_circle" size={20} />
            Saya Sudah Bayar, Kirim Pesanan
          </button>
          <button type="button" onClick={() => { setPayment('kasir'); setStep('review'); }} className="mt-2 w-full py-2 text-label-md text-secondary">
            Ganti ke Bayar di Kasir
          </button>
        </div>
      ) : (
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

        <div className="mt-4">
          <p className="mb-2 text-label-lg text-primary">Metode Pembayaran</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENTS.map((p) => {
              const active = payment === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPayment(p.key)}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${active ? 'border-primary-container bg-surface-container-lowest shadow-sm' : 'border-transparent bg-surface-container-low'}`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icon name={p.icon} size={24} className="text-primary" />
                    <Icon name={active ? 'radio_button_checked' : 'radio_button_unchecked'} size={20} className={active ? 'text-primary' : 'text-outline'} />
                  </span>
                  <span className="text-label-lg text-primary">{p.title}</span>
                  <span className="text-label-sm font-medium text-on-surface-variant">{p.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-container-low p-4">
          <span className="text-label-lg text-on-surface-variant">Total Bayar</span>
          <span className="text-counter text-primary">{rupiah(total)}</span>
        </div>

        <button type="button" disabled={!lines.length} onClick={submit} className="btn-primary mt-4 w-full">
          <Icon name={payment === 'qris' ? 'qr_code_scanner' : 'send'} size={20} />
          {payment === 'qris' ? 'Lanjut Bayar dengan QRIS' : 'Kirim Pesanan ke Barista'}
        </button>
        <p className="mt-2 text-center text-label-md font-medium text-on-surface-variant">
          {payment === 'qris' ? 'Pesanan dikirim setelah pembayaran QRIS' : 'Bayar langsung ke kasir, sebutkan kode pesananmu'}
        </p>
      </div>
      )}
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

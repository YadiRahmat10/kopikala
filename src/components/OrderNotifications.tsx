import { useEffect, useRef, useState } from 'react';
import { IonModal, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { durationLabel, minutesAgo, pad2, rupiah } from '../lib/format';
import { Icon } from './ui';
import type { Order } from '../data/types';

const where = (o: Order) => (o.tableId ? `Meja ${pad2(o.tableId)}` : 'Takeaway');

/** Munculkan toast setiap ada pesanan pelanggan baru selama admin membuka panel staf. */
export function OrderNotifier() {
  const { data } = useApp();
  const history = useHistory();
  const [present] = useIonToast();
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    // Pesanan yang sudah ada saat panel dibuka tidak dimunculkan ulang (cukup lewat lonceng)
    if (!known.current) {
      known.current = new Set(data.orders.map((o) => o.id));
      return;
    }
    const fresh = data.orders.filter((o) => !known.current!.has(o.id));
    fresh.forEach((o) => known.current!.add(o.id));
    const o = fresh.find((x) => x.status === 'baru');
    if (!o) return;
    navigator.vibrate?.(200);
    present({
      header: `Pesanan baru • ${where(o)}`,
      message: `#${o.code} ${o.customer} • ${o.items.reduce((s, i) => s + i.qty, 0)} item • ${o.payment === 'qris' ? 'QRIS Lunas' : 'Bayar di Kasir'}`,
      duration: 6000,
      position: 'top',
      cssClass: 'kk-toast kk-toast-order',
      buttons: [{ text: 'Lihat', handler: () => history.push('/staf/pesanan') }],
    });
  }, [data.orders]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/** Tombol lonceng + daftar notifikasi pesanan untuk header admin. */
export function NotificationBell() {
  const { data, now, markOrdersSeen } = useApp();
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const unseen = data.orders.filter((o) => !o.seen).length;
  const recent = [...data.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 15);

  const close = () => {
    setOpen(false);
    markOrdersSeen();
  };

  return (
    <>
      <button
        type="button"
        aria-label={unseen ? `Notifikasi, ${unseen} pesanan baru` : 'Notifikasi'}
        onClick={() => setOpen(true)}
        className="icon-btn glass-btn relative h-11 w-11 text-primary"
      >
        <Icon name="notifications" size={22} fill={unseen > 0} />
        {unseen > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-error px-1 text-[10px] font-bold text-white">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      <IonModal isOpen={open} onDidDismiss={close} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
        <div className="kk-scroll px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="eyebrow">Notifikasi</span>
              <h2 className="text-headline-md text-primary">Pesanan Pelanggan</h2>
              <p className="text-label-md font-medium text-on-surface-variant">{unseen ? `${unseen} pesanan belum dibaca` : 'Semua sudah dibaca'}</p>
            </div>
            <button type="button" aria-label="Tutup" onClick={close} className="icon-btn h-10 w-10 bg-surface-container text-on-surface-variant">
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {recent.length === 0 && <p className="py-8 text-center text-body-sm text-on-surface-variant">Belum ada pesanan masuk.</p>}
            {recent.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { close(); history.push('/staf/pesanan'); }}
                className={`flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${o.seen ? 'bg-surface-container-low' : 'bg-secondary-container/60'}`}
              >
                <span className={`icon-btn h-10 w-10 ${o.seen ? 'bg-surface-container text-primary' : 'bg-primary-container text-on-primary'}`}>
                  <Icon name={o.tableId ? 'table_restaurant' : 'shopping_bag'} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={`text-label-lg text-primary ${o.seen ? '' : 'font-extrabold'}`}>
                      {o.seen ? 'Pesanan' : 'Pesanan baru'} • {where(o)}
                    </span>
                    <span className="shrink-0 text-label-sm font-medium text-on-surface-variant">
                      {minutesAgo(o.createdAt, now) < 1 ? 'baru saja' : durationLabel(o.createdAt, now, true)}
                    </span>
                  </span>
                  <span className="block truncate text-label-md font-medium text-on-surface-variant">
                    #{o.code} {o.customer} • {o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                  </span>
                  <span className="mt-0.5 block text-label-md font-semibold text-secondary">
                    {rupiah(o.total)} • {o.payment === 'qris' ? 'QRIS' : 'Kasir'} {o.paid ? 'Lunas' : 'Belum Bayar'}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button type="button" onClick={() => { close(); history.push('/staf/pesanan'); }} className="btn-primary mt-4 w-full">
            <Icon name="receipt_long" size={20} />
            Buka Daftar Pesanan
          </button>
        </div>
      </IonModal>
    </>
  );
}

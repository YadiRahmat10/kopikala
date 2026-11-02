import { IonModal } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { rupiah } from '../lib/format';
import { Icon, useToast } from './ui';

/** Notifikasi bottom-sheet untuk pelanggan ketika staf menerbitkan menu baru. */
export function NewMenuModal() {
  const { data, dismissAnnouncement, addToCart } = useApp();
  const history = useHistory();
  const { pathname } = useLocation();
  const toast = useToast();
  // Hanya diumumkan ke pelanggan, bukan saat staf sedang di portal staf.
  const onGuestRoute = pathname.startsWith('/tamu');
  const item = data.menu.find((m) => m.id === data.announcements[0] && m.active);

  const close = () => item && dismissAnnouncement(item.id);

  return (
    <IonModal isOpen={!!item && onGuestRoute} onDidDismiss={close} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
      {item && (
        <div className="kk-scroll">
          <div className="relative h-56 w-full overflow-hidden bg-surface-container">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="chip absolute left-4 top-4 bg-white/95 text-primary shadow">
              <Icon name="auto_awesome" size={14} fill className="text-secondary" />
              Menu Baru Hadir!
            </span>
            <button type="button" aria-label="Tutup" onClick={close} className="icon-btn absolute right-4 top-4 h-10 w-10 bg-white/95 text-primary shadow">
              <Icon name="close" size={20} />
            </button>
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
              <span className="text-headline-md text-white">{rupiah(item.price)}</span>
              {item.stock !== null && (
                <span className="chip bg-red-50 text-red-700">
                  <Icon name="local_fire_department" size={14} fill />
                  Sisa {item.stock} Porsi Hari Ini
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
            <div>
              <h2 className="text-headline-md text-primary">{item.name}</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">{item.description}</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-3">
              <Icon name="notifications_active" size={20} className="text-emerald-700" />
              <span className="text-label-md text-on-surface-variant">Barista baru saja menambahkan menu ini ke sistem live kasir &amp; meja.</span>
            </div>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                addToCart(item.id);
                close();
                toast(`${item.name} masuk ke pesanan`);
                history.push('/tamu/menu');
              }}
            >
              <Icon name="shopping_bag" size={20} />
              Pesan Sekarang
            </button>
            <button type="button" onClick={close} className="btn w-full text-secondary">
              Nanti Saja
            </button>
          </div>
        </div>
      )}
    </IonModal>
  );
}

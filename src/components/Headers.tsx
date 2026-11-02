import { IonHeader, useIonActionSheet } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { CAFE, IMG } from '../data/seed';
import { isOpen, pad2 } from '../lib/format';
import { Icon } from './ui';

function Logo() {
  return (
    <div className="icon-btn h-9 w-9 bg-primary-container text-secondary-container">
      <Icon name="local_cafe" size={20} fill />
    </div>
  );
}

export function GuestHeader() {
  const { now, isStaff, requestStaff } = useApp();
  const history = useHistory();
  const open = isOpen(now);

  return (
    <IonHeader className="kk-header ion-no-border">
      <div className="pt-safe bg-surface/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-headline-sm text-primary">{CAFE.name}</span>
              <span className={`mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-label-sm ${open ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${open ? 'animate-pulse bg-emerald-600' : 'bg-red-600'}`} />
                {open ? 'Buka' : 'Tutup'} • {pad2(CAFE.open)}.00 - {pad2(CAFE.close)}.00
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requestStaff(() => history.push('/staf/ringkasan'))}
            className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-full bg-surface-container-low py-1.5 pl-2 pr-2.5 transition-all hover:bg-surface-container active:scale-[0.98]"
          >
            <img alt="" src={IMG.avatar} className="h-8 w-8 rounded-full object-cover" />
            <span className="flex flex-col items-start">
              <span className="text-label-sm leading-none text-primary">Mode Staf</span>
              <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant">
                <Icon name={isStaff ? 'lock_open' : 'lock'} size={12} />
                {isStaff ? 'Masuk' : 'PIN'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </IonHeader>
  );
}

export function StaffHeader({ title }: { title: string }) {
  const { logout } = useApp();
  const history = useHistory();
  const [presentSheet] = useIonActionSheet();

  const openProfile = () =>
    presentSheet({
      header: `${CAFE.staffName} • ${CAFE.shift}`,
      buttons: [
        { text: 'Lihat Sebagai Pelanggan', handler: () => history.push('/tamu/beranda') },
        { text: 'Keluar Mode Staf', role: 'destructive', handler: () => { logout(); history.replace('/tamu/beranda'); } },
        { text: 'Batal', role: 'cancel' },
      ],
    });

  return (
    <IonHeader className="kk-header ion-no-border">
      <div className="pt-safe bg-surface/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1 text-label-sm uppercase tracking-wider text-secondary">
              <Icon name="local_cafe" size={14} /> KopiKala Staf Hub
            </span>
            <div className="flex items-center gap-2">
              <h1 className="truncate text-headline-sm text-primary">{title}</h1>
              <span className="chip bg-secondary-container/70 text-on-secondary-container">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {CAFE.shift}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Mode Tamu" onClick={() => history.push('/tamu/beranda')} className="icon-btn h-11 w-11 bg-surface-container text-primary hover:bg-surface-container-high">
              <Icon name="storefront" size={22} />
            </button>
            <button type="button" aria-label="Profil staf" onClick={openProfile} className="icon-btn relative h-11 w-11 bg-primary-container text-on-primary">
              <Icon name="person" size={22} />
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
            </button>
          </div>
        </div>
      </div>
    </IonHeader>
  );
}

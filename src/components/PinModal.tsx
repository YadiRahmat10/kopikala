import { useEffect, useState } from 'react';
import { IonModal, useIonAlert } from '@ionic/react';
import { useApp } from '../state/AppState';
import { CAFE } from '../data/seed';
import { Icon } from './ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinModal() {
  const { pin: pinCtl, login } = useApp();
  const [pin, setPin] = useState('');
  const [state, setState] = useState<'idle' | 'ok' | 'wrong'>('idle');
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    if (pinCtl.open) {
      setPin('');
      setState('idle');
    }
  }, [pinCtl.open]);

  useEffect(() => {
    if (pin.length < 4) return;
    if (login(pin)) {
      setState('ok');
      const t = window.setTimeout(pinCtl.succeed, 600);
      return () => window.clearTimeout(t);
    }
    setState('wrong');
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (k: string) => {
    if (state === 'ok') return;
    setState('idle');
    setPin((p) => (p.length >= 4 ? k : p + k));
  };

  const message =
    state === 'ok'
      ? 'PIN Benar! Membuka Portal Staf...'
      : state === 'wrong'
        ? `PIN Salah. Coba PIN Demo (${CAFE.demoPin})`
        : pin.length === 0
          ? 'Masukkan 4 digit PIN'
          : `Masukkan ${4 - pin.length} digit lagi`;

  return (
    <IonModal isOpen={pinCtl.open} onDidDismiss={pinCtl.close} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
      <div className="kk-scroll px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="icon-btn h-9 w-9 bg-primary-container text-on-primary">
              <Icon name="lock" size={20} />
            </div>
            <div>
              <h3 className="text-headline-sm leading-tight text-primary">Login Mode Staf</h3>
              <span className="text-label-sm font-medium text-secondary">Kasir &amp; Barista</span>
            </div>
          </div>
          <button type="button" aria-label="Tutup" onClick={pinCtl.close} className="icon-btn h-8 w-8 bg-surface-container text-on-surface-variant">
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mb-4 text-body-sm text-on-surface-variant">
          Masukkan 4 digit PIN untuk memperbarui ketersediaan meja, stok kitchen &amp; bar, serta live music.
        </p>

        <div className={`mb-2 flex flex-col items-center py-2 ${state === 'wrong' ? 'animate-[pulse_0.4s_ease-in-out_2]' : ''}`}>
          <div className="mb-2 flex items-center gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                  i < pin.length
                    ? state === 'wrong'
                      ? 'border-red-600 bg-red-600'
                      : state === 'ok'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-primary bg-primary'
                    : 'border-primary-container/40 bg-surface-container'
                }`}
              />
            ))}
          </div>
          <span className={`min-h-[18px] text-label-sm ${state === 'ok' ? 'text-emerald-800' : state === 'wrong' ? 'text-red-800' : pin ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {message}
          </span>
        </div>

        <div className="mx-auto mb-4 grid max-w-[280px] grid-cols-3 gap-2.5">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => press(k)} className="h-12 rounded-xl bg-surface-container text-[20px] font-bold text-primary transition-transform hover:bg-surface-container-high active:scale-95">
              {k}
            </button>
          ))}
          <button type="button" onClick={() => setPin(CAFE.demoPin)} className="flex h-12 flex-col items-center justify-center rounded-xl bg-surface-container-low text-label-sm leading-tight text-secondary active:scale-95">
            Demo
            <span className="text-[10px] font-normal text-on-surface-variant">{CAFE.demoPin}</span>
          </button>
          <button type="button" onClick={() => press('0')} className="h-12 rounded-xl bg-surface-container text-[20px] font-bold text-primary active:scale-95">
            0
          </button>
          <button type="button" aria-label="Hapus" onClick={() => { setState('idle'); setPin((p) => p.slice(0, -1)); }} className="flex h-12 items-center justify-center rounded-xl bg-surface-container text-primary active:scale-95">
            <Icon name="backspace" size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container pt-2">
          <button
            type="button"
            onClick={() => presentAlert({ header: 'Lupa PIN', message: 'Silakan hubungi Store Supervisor KopiKala untuk reset kode PIN kasir.', buttons: ['Mengerti'], cssClass: 'kk-alert' })}
            className="text-label-sm text-secondary hover:underline"
          >
            Lupa PIN Supervisor?
          </button>
          <button type="button" onClick={pinCtl.close} className="rounded-full px-4 py-2 text-label-md text-on-surface-variant hover:bg-surface-container">
            Tutup
          </button>
        </div>
      </div>
    </IonModal>
  );
}

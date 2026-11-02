import { useState } from 'react';
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { CAFE, IMG } from '../../data/seed';
import { menuStatus, showTime, syncLabel, tableStats } from '../../lib/format';
import { GuestHeader } from '../../components/Headers';
import { Badge, Icon, MENU_BADGE, useToast } from '../../components/ui';
import type { MenuItem } from '../../data/types';

function greeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function menuBadgeLabel(m: MenuItem) {
  const s = menuStatus(m);
  if (s === 'habis') return 'Habis Hari Ini';
  if (s === 'menipis') return `Sisa ${m.stock} Porsi`;
  return 'Tersedia';
}

const Home: React.FC = () => {
  const { data, now, session, refresh, toggleReminder } = useApp();
  const history = useHistory();
  const toast = useToast();
  const [spinning, setSpinning] = useState(false);

  const stats = tableStats(data.tables);
  const pct = Math.round((stats.free / stats.total) * 100);
  const tonight = data.shows.find((s) => s.dayOffset === 0 && s.hasLive);
  const reminded = tonight ? data.reminders.includes(tonight.id) : false;

  const visible = data.menu.filter((m) => m.active);
  const soldOut = visible.filter((m) => menuStatus(m) === 'habis');
  const highlights = [
    visible.find((m) => menuStatus(m) === 'tersedia'),
    visible.find((m) => menuStatus(m) === 'menipis'),
    soldOut[0],
  ].filter(Boolean) as MenuItem[];

  const doRefresh = () => {
    setSpinning(true);
    refresh();
    window.setTimeout(() => setSpinning(false), 600);
  };

  return (
    <IonPage>
      <GuestHeader />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { refresh(); window.setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
          {/* Sapaan */}
          <div className="flex items-end justify-between gap-3 px-1 pb-1">
            <div className="min-w-0">
              <p className="text-body-md text-on-surface-variant">
                {greeting(now)}, {session?.name ?? 'Tamu'}
              </p>
              <h1 className="mt-0.5 text-headline-lg text-primary [text-wrap:balance]">Mau ngopi di mana hari ini?</h1>
              <p className="mt-1 text-label-md font-medium text-on-surface-variant">Status cafe diperbarui {syncLabel(data.lastSync, now).toLowerCase()}</p>
            </div>
            <button type="button" aria-label="Segarkan status cafe" onClick={doRefresh} className="icon-btn h-10 w-10 border border-[rgba(42,26,20,0.08)] bg-white/80 text-primary">
              <Icon name="sync" size={20} className={spinning ? 'kk-spin' : ''} />
            </button>
          </div>

          {/* 1. Ketersediaan Meja */}
          <section className="card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-headline-sm text-primary">Ketersediaan meja</h2>
              <Badge tone={stats.free ? 'green' : 'red'}>{pct}% Tersedia</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-counter text-primary">{stats.free}</span>
                <span className="text-body-md font-medium text-on-surface-variant">dari {stats.total} Meja Kosong</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-emerald-600 transition-all duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'chair', label: 'Area Indoor', n: stats.freeIndoor },
                { icon: 'deck', label: 'Area Outdoor', n: stats.freeOutdoor },
              ].map((a) => (
                <div key={a.label} className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-2.5">
                  <div className="icon-btn h-7 w-7 bg-emerald-100 text-emerald-800">
                    <Icon name={a.icon} size={16} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-label-sm font-semibold text-on-surface-variant">{a.label}</span>
                    <span className="text-label-lg text-primary">{a.n} Kosong</span>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => history.push('/tamu/meja')} className="btn-primary w-full justify-between">
              <span className="flex items-center gap-2">
                <Icon name="table_restaurant" />
                Lihat Denah &amp; Pilih Meja
              </span>
              <Icon name="arrow_forward" />
            </button>
          </section>

          {/* 2. Live Music */}
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="icon-btn h-8 w-8 bg-secondary-container text-on-secondary-container">
                  <Icon name="music_note" size={18} />
                </div>
                <h2 className="text-headline-sm text-primary">Live music malam ini</h2>
              </div>
              {tonight ? <Badge tone="green">Ada Jadwal</Badge> : <Badge tone="muted">Libur</Badge>}
            </div>
            {tonight ? (
              <>
                <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-2">
                  <img src={tonight.image ?? IMG.bandSmall} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-headline-sm text-primary">{tonight.title}</span>
                    <span className="mt-0.5 truncate text-label-md text-secondary">{tonight.genre}</span>
                    <span className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
                      <Icon name="schedule" size={14} />
                      {showTime(tonight)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toggleReminder(tonight.id);
                      toast(reminded ? 'Pengingat dibatalkan' : 'Pengingat berhasil diaktifkan!', reminded ? 'info' : 'success');
                    }}
                    className={`btn flex-1 ${reminded ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-container text-primary'}`}
                  >
                    <Icon name="notifications_active" size={18} fill={reminded} />
                    {reminded ? 'Pengingat Terpasang ✓' : 'Ingatkan Saya'}
                  </button>
                  <button type="button" aria-label="Buka halaman live music" onClick={() => history.push('/tamu/live-music')} className="icon-btn h-12 w-12 bg-surface-container-low text-primary">
                    <Icon name="chevron_right" />
                  </button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => history.push('/tamu/live-music')} className="btn-soft w-full">
                Lihat Jadwal Minggu Ini <Icon name="arrow_forward" size={18} />
              </button>
            )}
          </section>

          {/* 3. Status Menu */}
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-headline-sm text-primary">Menu hari ini</h2>
              {soldOut.length > 0 && <Badge tone="amber" icon="warning">{soldOut.length} Habis</Badge>}
            </div>
            <div className="flex flex-col gap-2">
              {highlights.map((m) => {
                const s = menuStatus(m);
                return (
                  <div key={m.id} className={`flex items-center justify-between rounded-2xl bg-surface-container-low p-2 ${s === 'habis' ? 'opacity-75' : ''}`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <img src={m.image} alt="" className={`h-9 w-9 shrink-0 rounded-lg object-cover ${s === 'habis' ? 'grayscale' : ''}`} />
                      <div className="flex min-w-0 flex-col">
                        <span className={`truncate text-label-lg ${s === 'habis' ? 'text-on-surface-variant line-through' : 'text-primary'}`}>{m.name}</span>
                        <span className="truncate text-label-sm font-medium text-on-surface-variant">{m.subtitle}</span>
                      </div>
                    </div>
                    <Badge tone={MENU_BADGE[s]}>{menuBadgeLabel(m)}</Badge>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => history.push('/tamu/menu')} className="btn-soft w-full">
              Cek Menu Lengkap &amp; Pesan
              <Icon name="arrow_forward" size={18} />
            </button>
          </section>

          {/* 4. Info Cafe */}
          <footer className="flex flex-col gap-3 px-1 pt-2">
            <a href={CAFE.mapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2.5">
              <div className="icon-btn mt-0.5 h-6 w-6 bg-surface-container text-secondary">
                <Icon name="location_on" size={16} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-label-md font-bold text-primary">Lokasi Kami</span>
                <span className="text-body-sm text-on-surface-variant">{CAFE.address}</span>
              </div>
            </a>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { icon: 'wifi', cls: 'text-emerald-700', k: 'Wi-Fi Cepat', v: '100 Mbps (WFC)' },
                { icon: 'power', cls: 'text-secondary', k: 'Stopkontak', v: 'Tiap Meja Indoor' },
              ].map((f) => (
                <div key={f.k} className="flex items-center gap-2 rounded-2xl bg-surface-container-lowest p-2 shadow-sm">
                  <Icon name={f.icon} size={18} className={f.cls} />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-label-sm font-semibold text-on-surface-variant">{f.k}</span>
                    <span className="truncate text-label-md font-bold text-primary">{f.v}</span>
                  </div>
                </div>
              ))}
            </div>
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

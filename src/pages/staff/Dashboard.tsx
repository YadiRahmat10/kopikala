import { useState } from 'react';
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { CAFE, IMG } from '../../data/seed';
import { clockLabel, durationLabel, menuStatus, minutesAgo, pad2, showTime, tableStats } from '../../lib/format';
import { StaffHeader } from '../../components/Headers';
import { Badge, Icon, Stepper, useToast } from '../../components/ui';
import type { CafeTable } from '../../data/types';

function Ring({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f1ede8" strokeWidth="6" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#835244" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-all duration-500" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-label-sm text-primary">{pct}%</span>
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { data, now, refresh, logout, setTableStatus, changeStock, soldOut, restock, freeAllDirty, restockAllSoldOut, updateStage } = useApp();
  const history = useHistory();
  const toast = useToast();
  const [spinning, setSpinning] = useState(false);

  const stats = tableStats(data.tables);
  const occupied = stats.total - stats.free;
  const pct = Math.round((occupied / stats.total) * 100);
  const low = data.menu.filter((m) => menuStatus(m) === 'menipis');
  const out = data.menu.filter((m) => menuStatus(m) === 'habis');
  const tonight = data.shows.find((s) => s.dayOffset === 0 && s.hasLive);
  const stage = data.stage;
  const activeOrders = data.orders.filter((o) => o.status === 'baru' || o.status === 'diproses' || o.status === 'diantar');
  const newOrders = activeOrders.filter((o) => o.status === 'baru').length;
  const unpaidOrders = data.orders.filter((o) => !o.paid && o.status !== 'batal').length;

  const attention = data.tables
    .filter((t) => t.status === 'kotor' || t.status === 'dipesan' || (t.status === 'terisi' && minutesAgo(t.since ?? now, now) >= 60))
    .sort((a, b) => a.id - b.id);

  const action = (t: CafeTable) => {
    if (t.status === 'kotor') return { label: 'Bersihkan Meja', icon: 'cleaning_services', primary: false, run: () => setTableStatus(t.id, 'kosong') };
    if (t.status === 'dipesan') return { label: 'Tamu Duduk', icon: 'person_check', primary: true, run: () => setTableStatus(t.id, 'terisi') };
    return { label: 'Tandai Kosong', icon: 'check_circle', primary: false, run: () => setTableStatus(t.id, 'kosong') };
  };

  const badge = (t: CafeTable) => {
    if (t.status === 'kotor') return <Badge tone="muted">Kotor (Perlu Bersih)</Badge>;
    if (t.status === 'dipesan') return <Badge tone="amber">Dipesan {t.reservedAt}</Badge>;
    return <Badge tone="red">Terisi {durationLabel(t.since ?? now, now, true)}</Badge>;
  };

  const detail = (t: CafeTable) => {
    if (t.status === 'kotor') return 'Tamu baru selesai bayar di kasir';
    if (t.status === 'dipesan') return `A.n. ${t.reservedFor ?? 'Tamu'} • Deposit Lunas`;
    return `${t.seats} Kursi${t.order ? ` • Order: ${t.order}` : ''}`;
  };

  const doRefresh = () => {
    setSpinning(true);
    refresh();
    window.setTimeout(() => setSpinning(false), 600);
  };

  const shortcuts = [
    { icon: 'add', label: '+ Reservasi', primary: true, run: () => history.push('/staf/meja') },
    { icon: 'tune', label: 'Toggle Meja Massal', run: () => { const n = freeAllDirty(); toast(n ? `${n} meja kotor ditandai kosong` : 'Tidak ada meja kotor', n ? 'success' : 'info'); } },
    { icon: 'fast_forward', label: 'Restock Cepat', run: () => { const n = restockAllSoldOut(); toast(n ? `${n} menu habis di-restock +10` : 'Tidak ada menu habis', n ? 'success' : 'info'); } },
    { icon: 'mic_external_on', label: 'Ubah Soundcheck', run: () => { updateStage({ soundcheck: !stage.soundcheck }); toast(stage.soundcheck ? 'Soundcheck dibuka kembali' : 'Soundcheck ditandai selesai', 'info'); } },
  ];

  return (
    <IonPage>
      <StaffHeader title="Ringkasan" />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { refresh(); window.setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          {/* Sapaan shift */}
          <section className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4">
            <Icon name="local_cafe" size={110} className="pointer-events-none absolute -bottom-6 -right-4 text-surface-container-highest" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="rose">Mode Staf Aktif</Badge>
                <span className="flex items-center gap-1 text-label-sm font-semibold text-on-surface-variant">
                  Online • {Math.max(1, minutesAgo(data.lastSync, now))} mnt lalu
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" aria-label="Sinkronkan" onClick={doRefresh} className="icon-btn h-10 w-10 bg-surface-container-lowest text-primary shadow-sm">
                  <Icon name="sync" size={20} className={spinning ? 'kk-spin' : ''} />
                </button>
                <button type="button" aria-label="Keluar" onClick={() => { logout(); history.replace('/masuk'); }} className="icon-btn h-10 w-10 bg-red-50 text-red-700">
                  <Icon name="logout" size={20} />
                </button>
              </div>
            </div>
            <h2 className="relative mt-3 text-headline-md text-primary">Halo, {CAFE.staffName} 👋</h2>
            <p className="relative text-body-sm text-on-surface-variant">{CAFE.shift}: {CAFE.shiftHours}</p>
          </section>

          {/* Pesanan pelanggan */}
          <button type="button" onClick={() => history.push('/staf/pesanan')} className={`card gap-3 text-left ${newOrders ? 'ring-2 ring-secondary/50' : ''}`}>
            <div className="flex w-full items-center justify-between">
              <span className="eyebrow">Pesanan Pelanggan</span>
              <Icon name="receipt_long" size={18} className="text-secondary" />
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              {[
                { label: 'Baru', n: newOrders, cls: newOrders ? 'bg-secondary-container/70 text-on-secondary-container' : 'bg-surface-container-low text-primary' },
                { label: 'Aktif', n: activeOrders.length, cls: 'bg-surface-container-low text-primary' },
                { label: 'Belum Bayar', n: unpaidOrders, cls: unpaidOrders ? 'bg-red-50 text-red-800' : 'bg-surface-container-low text-primary' },
              ].map((s) => (
                <div key={s.label} className={`rounded-lg p-2.5 ${s.cls}`}>
                  <p className="text-label-md">{s.label}</p>
                  <p className="text-headline-sm">{s.n}</p>
                </div>
              ))}
            </div>
            <span className="flex w-full items-center justify-between rounded-2xl bg-surface-container-low px-3 py-2 text-label-md font-bold text-primary">
              Kelola Pesanan per Meja <Icon name="chevron_right" size={18} />
            </span>
          </button>

          {/* Kartu ringkas */}
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <section className="card gap-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Kapasitas Meja</span>
                <Icon name="table_restaurant" size={18} className="text-secondary" />
              </div>
              <div className="flex items-center gap-3">
                <Ring pct={pct} />
                <div>
                  <p className="text-counter text-primary">{occupied}<span className="text-body-md font-medium text-on-surface-variant">/{stats.total}</span></p>
                  <p className="text-label-md text-on-surface-variant">Meja Terisi</p>
                </div>
              </div>
              <button type="button" onClick={() => history.push('/staf/meja')} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-3 py-2 text-label-md font-bold text-primary">
                Buka Denah Meja <Icon name="chevron_right" size={18} />
              </button>
            </section>

            <section className="card gap-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Perhatian Stok</span>
                <Icon name="inventory" size={18} className="text-secondary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <p className="text-label-md text-amber-900">Menipis</p>
                  <p className="text-headline-sm text-amber-900">{low.length} Menu</p>
                </div>
                <div className="rounded-lg bg-red-100 p-2.5">
                  <p className="text-label-md text-red-800">Habis</p>
                  <p className="text-headline-sm text-red-800">{out.length} Menu</p>
                </div>
              </div>
              <button type="button" onClick={() => history.push('/staf/stok')} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-3 py-2 text-label-md font-bold text-primary">
                Atur Stok Habis <Icon name="chevron_right" size={18} />
              </button>
            </section>
          </div>

          {tonight && (
            <section className="card gap-2">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Live Stage Malam</span>
                <Icon name="music_note" size={18} className="text-secondary" />
              </div>
              <p className="flex items-center gap-2 text-headline-sm text-primary">
                {tonight.title}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {tonight.start} - {tonight.end} • {stage.soundcheck ? 'Soundcheck Selesai' : 'Siap Soundcheck'}
              </p>
              <button
                type="button"
                onClick={() => updateStage({ artistArrived: !stage.artistArrived })}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-label-md font-bold ${stage.artistArrived ? 'bg-emerald-50 text-emerald-800' : 'bg-surface-container-low text-on-surface-variant'}`}
              >
                {stage.artistArrived ? 'Musisi Tiba di Backstage' : 'Musisi Belum Tiba'}
                <Icon name="how_to_reg" size={18} />
              </button>
            </section>
          )}

          {/* Pintasan */}
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm text-primary">Pintasan Cepat Operasional</h2>
            <span className="text-label-md font-semibold text-on-surface-variant">1-Tap Akses</span>
          </div>
          <div className="scroll-x -mt-2">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={s.run}
                className={`flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-label-lg transition-all active:scale-95 ${s.primary ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary'}`}
              >
                <Icon name={s.icon} size={18} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Meja butuh perhatian */}
          <section className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-headline-sm text-primary">Meja Butuh Perhatian</h2>
                <p className="text-body-sm text-on-surface-variant">Pembaruan langsung lantai pelayanan</p>
              </div>
              <Badge tone="rose">{attention.length} Meja</Badge>
            </div>
            {attention.length === 0 && <p className="rounded-lg bg-emerald-50 p-3 text-label-md text-emerald-800">Semua meja aman — tidak ada tindakan tertunda ✨</p>}
            {attention.map((t) => {
              const a = action(t);
              return (
                <div key={t.id} className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex w-10 shrink-0 flex-col items-center">
                      <span className="text-[9px] font-bold text-on-surface-variant">Meja</span>
                      <span className="text-counter text-primary">{pad2(t.id)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-label-lg text-primary">{t.zone}</span>
                        {badge(t)}
                      </div>
                      <p className="mt-0.5 text-body-sm text-on-surface-variant">{detail(t)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { a.run(); toast(`Meja ${pad2(t.id)}: ${a.label}`); }}
                    className={`flex h-10 items-center gap-1.5 self-end rounded-full px-4 text-label-md font-bold active:scale-95 ${a.primary ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-primary'}`}
                  >
                    <Icon name={a.icon} size={18} />
                    {a.label}
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => history.push('/staf/meja')} className="flex items-center justify-center gap-1 rounded-2xl bg-surface-container py-3 text-label-md font-bold text-secondary">
              Lihat Semua {stats.total} Meja di Denah Lengkap <Icon name="arrow_forward" size={16} />
            </button>
          </section>

          {/* Penyesuaian stok */}
          <section className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-headline-sm text-primary">Penyesuaian Stok Instan</h2>
                <p className="text-body-sm text-on-surface-variant">Update kuota bahan baku real-time barista</p>
              </div>
              <Icon name="cookie" size={22} className="text-secondary" />
            </div>
            {[...low, ...out].length === 0 && <p className="rounded-lg bg-emerald-50 p-3 text-label-md text-emerald-800">Semua stok aman 👌</p>}
            {[...low, ...out].map((m) => {
              const habis = menuStatus(m) === 'habis';
              return (
                <div key={m.id} className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <img src={m.image} alt="" className={`h-full w-full object-cover ${habis ? 'grayscale' : ''}`} />
                      {habis && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] font-bold text-white">HABIS</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-label-lg text-primary">{m.name}</span>
                        <Badge tone={habis ? 'red' : 'amber'}>{habis ? 'Habis' : `Sisa ${m.stock}`}</Badge>
                      </div>
                      <p className="truncate text-body-sm text-on-surface-variant">{m.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {habis ? (
                      <span />
                    ) : (
                      <Stepper size="sm" value={m.stock ?? 0} onChange={(d) => changeStock(m.id, d)} />
                    )}
                    {habis ? (
                      <button type="button" onClick={() => { restock(m.id); toast('Stok berhasil diperbarui'); }} className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-label-md font-bold text-on-primary active:scale-95">
                        <Icon name="add_business" size={18} />
                        Restock Masuk (+10)
                      </button>
                    ) : (
                      <button type="button" onClick={() => { soldOut(m.id); toast(`${m.name} ditandai habis`, 'info'); }} className="h-10 rounded-full bg-red-100 px-4 text-label-md font-bold text-red-800 active:scale-95">
                        Tandai Habis
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Panggung */}
          {tonight && (
            <section className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="icon-btn h-9 w-9 bg-secondary-container text-on-secondary-container">
                    <Icon name="mic" size={18} />
                  </div>
                  <div>
                    <h2 className="text-headline-sm text-primary">Panggung Live Music Hari Ini</h2>
                    <p className="text-body-sm text-on-surface-variant">Kordinasi panggung &amp; musisi tamu</p>
                  </div>
                </div>
                <button type="button" aria-label="Ubah jadwal" onClick={() => history.push('/staf/live-music')} className="icon-btn h-9 w-9 bg-surface-container text-primary">
                  <Icon name="edit" size={18} />
                </button>
              </div>
              <div className="flex gap-3 rounded-2xl bg-surface-container-low p-3">
                <img src={tonight.image ?? IMG.bandStage} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-label-lg text-primary">{tonight.title}</span>
                    <Badge tone="green">Confirmed</Badge>
                  </div>
                  <p className="text-body-sm text-secondary">{tonight.genre}</p>
                  <p className="mt-0.5 text-label-md font-semibold text-on-surface-variant">
                    {tonight.sessions ? tonight.sessions.map((s, i) => `Sesi ${i + 1}: ${s}`).join(' • ') : showTime(tonight)}
                  </p>
                </div>
              </div>
              {([
                ['soundcheck', 'graphic_eq', 'Soundcheck Selesai'],
                ['micReady', 'lightbulb', 'Panggung & Mic Siap'],
              ] as const).map(([key, icon, label]) => (
                <label key={key} className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-2xl bg-surface-container-low px-3">
                  <span className="flex items-center gap-2 text-label-lg text-primary">
                    <Icon name={icon} size={18} className="text-secondary" />
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={stage[key]}
                    onChange={(e) => updateStage({ [key]: e.target.checked })}
                    className="h-5 w-5 accent-[#331916]"
                  />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => history.push('/staf/live-music')} className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl bg-surface-container px-2 text-label-md font-bold text-primary">
                  <Icon name="queue_music" size={18} />
                  Song Request ({stage.songRequests})
                </button>
                <button type="button" onClick={() => history.push('/staf/live-music')} className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-lg bg-secondary px-2 text-label-md font-bold text-white">
                  <Icon name="volume_up" size={18} />
                  Master Level
                </button>
              </div>
            </section>
          )}

          {/* Log */}
          <section className="card">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-headline-sm text-primary">
                <Icon name="history" size={20} className="text-secondary" />
                Log Aktivitas {CAFE.shift}
              </h2>
              <span className="text-label-md font-semibold text-on-surface-variant">Hari ini</span>
            </div>
            <ol className="flex flex-col gap-3">
              {data.logs.slice(0, 6).map((l) => (
                <li key={l.id} className="flex gap-3">
                  <div className="text-body-sm text-on-surface">
                    <b>{l.who}</b> {l.text}{' '}
                    <b className={l.tone === 'success' ? 'text-emerald-700' : l.tone === 'danger' ? 'text-red-700' : 'text-secondary'}>{l.highlight}</b>
                    <p className="text-label-md font-medium text-on-surface-variant">{clockLabel(l.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;

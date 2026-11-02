import { useState } from 'react';
import { IonContent, IonModal, IonPage, IonRange } from '@ionic/react';
import { useApp } from '../../state/AppState';
import { IMG } from '../../data/seed';
import { dayDate, fmtShortDate, showTime } from '../../lib/format';
import { StaffHeader } from '../../components/Headers';
import { Badge, Icon, Switch, useToast } from '../../components/ui';

const ICONS = ['music_note', 'piano', 'mic', 'queue_music', 'headset', 'graphic_eq'];

const blankShow = (dayOffset = 1) => ({ dayOffset, title: '', genre: '', icon: 'music_note', start: '19.30', end: '22.00', location: 'Panggung Utama Outdoor' });

const StaffLive: React.FC = () => {
  const { data, now, updateStage, toggleShowLive, saveShow } = useApp();
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankShow);
  const [error, setError] = useState('');

  const stage = data.stage;
  const tonight = data.shows.find((s) => s.dayOffset === 0);
  const timeOk = (t: string) => /^([01]\d|2[0-3])[.:][0-5]\d$/.test(t);

  const openForm = (dayOffset = 1) => {
    const existing = data.shows.find((s) => s.dayOffset === dayOffset && s.hasLive);
    setForm(existing ? { dayOffset, title: existing.title, genre: existing.genre, icon: existing.icon, start: existing.start ?? '19.30', end: existing.end ?? '22.00', location: existing.location ?? '' } : blankShow(dayOffset));
    setError('');
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) return setError('Nama musisi / acara wajib diisi');
    if (!timeOk(form.start) || !timeOk(form.end)) return setError('Format jam harus HH.MM, mis. 19.30');
    const prev = data.shows.find((s) => s.dayOffset === form.dayOffset);
    saveShow({
      ...form,
      title: form.title.trim(),
      genre: form.genre.trim() || 'Live Music',
      start: form.start.replace(':', '.'),
      end: form.end.replace(':', '.'),
      hasLive: true,
      image: prev?.image,
      sessions: form.dayOffset === 0 ? prev?.sessions : undefined,
    });
    setFormOpen(false);
    toast(`${form.title.trim()} dijadwalkan ${form.dayOffset === 0 ? 'malam ini' : fmtShortDate(dayDate(form.dayOffset, now))}`);
  };

  const checks = [
    { key: 'artistArrived', icon: 'how_to_reg', label: 'Musisi Tiba di Backstage' },
    { key: 'soundcheck', icon: 'graphic_eq', label: 'Soundcheck Selesai' },
    { key: 'micReady', icon: 'lightbulb', label: 'Panggung & Mic Siap' },
  ] as const;
  const ready = checks.filter((c) => stage[c.key]).length;

  return (
    <IonPage>
      <StaffHeader title="Live Music" />
      <IonContent>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          {tonight?.hasLive ? (
            <section className="card">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Panggung Malam Ini</span>
                <Badge tone={ready === checks.length ? 'green' : 'amber'}>{ready === checks.length ? 'Siap Tampil' : `${ready}/${checks.length} Siap`}</Badge>
              </div>
              <div className="flex gap-3">
                <img src={tonight.image ?? IMG.bandStage} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h2 className="text-headline-sm text-primary">{tonight.title}</h2>
                  <p className="text-body-sm text-secondary">{tonight.genre}</p>
                  <p className="mt-1 flex items-center gap-1 text-label-md font-semibold text-on-surface-variant">
                    <Icon name="schedule" size={14} /> {showTime(tonight)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {checks.map((c) => (
                  <div key={c.key} className="flex min-h-[52px] items-center justify-between rounded-2xl bg-surface-container-low px-3">
                    <span className="flex items-center gap-2 text-label-lg text-primary">
                      <Icon name={c.icon} size={20} className={stage[c.key] ? 'text-emerald-700' : 'text-on-surface-variant'} />
                      {c.label}
                    </span>
                    <Switch label={c.label} checked={stage[c.key]} onChange={(v) => updateStage({ [c.key]: v })} />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-surface-container-low p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-label-lg text-primary">
                    <Icon name="volume_up" size={20} className="text-secondary" /> Master Level
                  </span>
                  <span className="text-label-lg text-secondary">{stage.masterLevel}%</span>
                </div>
                <IonRange
                  min={0}
                  max={100}
                  step={5}
                  value={stage.masterLevel}
                  onIonInput={(e) => updateStage({ masterLevel: Number(e.detail.value) })}
                  style={{ '--bar-background-active': '#835244', '--knob-background': '#4b2e2a', '--bar-height': '6px' } as React.CSSProperties}
                  aria-label="Master level"
                />
                {stage.masterLevel > 85 && <p className="text-label-md text-orange-700">⚠️ Volume tinggi — area indoor mungkin terganggu</p>}
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3">
                <span className="flex items-center gap-2 text-label-lg text-primary">
                  <Icon name="queue_music" size={20} className="text-secondary" />
                  Song Request Tamu
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-headline-sm text-primary">{stage.songRequests}</span>
                  <button
                    type="button"
                    disabled={!stage.songRequests}
                    onClick={() => { updateStage({ songRequests: stage.songRequests - 1 }); toast('Request lagu ditandai sudah dimainkan'); }}
                    className="flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-label-md font-bold text-on-primary disabled:opacity-40"
                  >
                    <Icon name="check" size={16} /> Dimainkan
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="card items-center text-center">
              <Icon name="music_off" size={36} className="text-on-surface-variant" />
              <h2 className="text-headline-sm text-primary">Malam ini tanpa live music</h2>
              <p className="text-body-sm text-on-surface-variant">Tambahkan musisi tamu untuk malam ini agar pelanggan mendapat notifikasi di beranda.</p>
              <button type="button" onClick={() => openForm(0)} className="btn-primary w-full">
                <Icon name="add_circle" size={20} /> Jadwalkan Malam Ini
              </button>
            </section>
          )}

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-headline-md text-primary">Jadwal 7 Hari</h2>
              <p className="text-body-sm text-on-surface-variant">Aktifkan/nonaktifkan atau ubah line-up</p>
            </div>
            <button type="button" onClick={() => openForm(1)} className="flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-label-md font-bold text-on-primary">
              <Icon name="add" size={18} /> Tambah
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {data.shows.map((s) => (
              <div key={s.id} className={`flex items-center gap-3 rounded-xl p-3 ${s.hasLive ? 'bg-surface-container-lowest shadow-sm' : 'bg-surface-container-low'}`}>
                <div className="icon-btn h-11 w-11 rounded-2xl bg-surface-container text-primary">
                  <Icon name={s.icon} size={22} />
                </div>
                <button type="button" onClick={() => openForm(s.dayOffset)} className="min-w-0 flex-1 text-left">
                  <p className="text-label-md font-semibold text-secondary">{s.dayOffset === 0 ? 'Malam Ini' : fmtShortDate(dayDate(s.dayOffset, now))}</p>
                  <p className={`truncate text-label-lg ${s.hasLive ? 'text-primary' : 'text-on-surface-variant'}`}>{s.title}</p>
                  <p className="truncate text-label-md font-medium text-on-surface-variant">{s.hasLive ? showTime(s) : s.genre}</p>
                </button>
                <Switch
                  label={`Live music ${s.title}`}
                  checked={s.hasLive}
                  disabled={!s.start}
                  onChange={() => { toggleShowLive(s.id); toast(s.hasLive ? `${s.title} dinonaktifkan` : `${s.title} aktif kembali`, 'info'); }}
                />
              </div>
            ))}
          </div>
        </div>
      </IonContent>

      <IonModal isOpen={formOpen} onDidDismiss={() => setFormOpen(false)} breakpoints={[0, 1]} initialBreakpoint={1} className="kk-sheet kk-auto">
        <div className="kk-scroll flex flex-col gap-4 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="eyebrow">Panggung KopiKala</span>
              <h2 className="text-headline-md text-primary">Jadwalkan Pertunjukan</h2>
            </div>
            <button type="button" aria-label="Tutup" onClick={() => setFormOpen(false)} className="icon-btn h-10 w-10 bg-surface-container text-on-surface-variant">
              <Icon name="close" size={20} />
            </button>
          </div>

          <div>
            <p className="mb-2 text-label-lg text-primary">Hari</p>
            <div className="scroll-x py-0.5">
              {data.shows.map((s) => (
                <button key={s.dayOffset} type="button" onClick={() => setForm((f) => ({ ...f, dayOffset: s.dayOffset }))} className={`filter-chip ${form.dayOffset === s.dayOffset ? 'filter-chip-active' : 'bg-surface-container'}`}>
                  {s.dayOffset === 0 ? 'Malam Ini' : fmtShortDate(dayDate(s.dayOffset, now))}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className="mb-2 block text-label-lg text-primary">Nama Musisi / Acara <span className="text-red-600">*</span></span>
            <input className="input" value={form.title} placeholder="mis. Kala Swing Band" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label>
            <span className="mb-2 block text-label-lg text-primary">Genre / Deskripsi</span>
            <input className="input" value={form.genre} placeholder="mis. Swing, Jazz Standards" onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['start', 'end'] as const).map((k) => (
              <label key={k}>
                <span className="mb-2 block text-label-lg text-primary">{k === 'start' ? 'Mulai' : 'Selesai'}</span>
                <input className="input" inputMode="decimal" value={form[k]} placeholder="19.30" onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
              </label>
            ))}
          </div>
          <label>
            <span className="mb-2 block text-label-lg text-primary">Lokasi Panggung</span>
            <input className="input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </label>
          <div>
            <p className="mb-2 text-label-lg text-primary">Ikon</p>
            <div className="flex gap-2">
              {ICONS.map((i) => (
                <button key={i} type="button" aria-label={i} onClick={() => setForm((f) => ({ ...f, icon: i }))} className={`icon-btn h-11 w-11 rounded-xl ${form.icon === i ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary'}`}>
                  <Icon name={i} size={20} />
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-label-md text-red-700">{error}</p>}
          <button type="button" onClick={submit} className="btn-primary w-full">
            <Icon name="check_circle" size={20} /> Simpan Jadwal
          </button>
        </div>
      </IonModal>
    </IonPage>
  );
};

export default StaffLive;

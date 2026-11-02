import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { IMG } from '../../data/seed';
import { dayDate, fmtLongDate, fmtRange, fmtShortDate, shareText, showTime } from '../../lib/format';
import { GuestHeader } from '../../components/Headers';
import { Badge, Icon, useToast } from '../../components/ui';

const LiveMusic: React.FC = () => {
  const { data, now, isStaff, refresh, toggleReminder } = useApp();
  const history = useHistory();
  const toast = useToast();

  const today = dayDate(0, now);
  const liveCount = data.shows.filter((s) => s.hasLive).length;
  const tonight = data.shows.find((s) => s.dayOffset === 0 && s.hasLive);
  const featured = tonight ?? data.shows.find((s) => s.hasLive);
  const upcoming = data.shows.filter((s) => s.dayOffset > 0);
  const reminded = featured ? data.reminders.includes(featured.id) : false;

  const share = async () => {
    if (!featured) return;
    const when = featured.dayOffset === 0 ? 'malam ini' : fmtShortDate(dayDate(featured.dayOffset, now));
    const r = await shareText(featured.title, `${featured.title} live di KopiKala ${when}, ${showTime(featured)}!`);
    if (r === 'copied') toast('Info pertunjukan disalin', 'info');
  };

  return (
    <IonPage>
      <GuestHeader />
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { refresh(); window.setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="flex flex-col gap-5 px-4 pb-8 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="flex items-center gap-1 text-label-sm text-secondary">
                <Icon name="calendar_today" size={14} />
                {fmtLongDate(today)}
              </span>
              <h1 className="mt-1 text-headline-lg text-primary">Panggung KopiKala</h1>
            </div>
            <span className="chip bg-surface-container py-2 text-primary">
              <Icon name="music_note" size={14} />
              {liveCount} Pertunjukan
            </span>
          </div>

          {/* Hero */}
          {featured && (
            <section className="relative overflow-hidden rounded-2xl bg-primary text-white shadow-lg">
              <img src={featured.image ?? IMG.bandHero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-primary/70 to-primary" />
              <div className="relative flex flex-col gap-3 p-4 pt-4">
                <span className="chip w-fit bg-white/90 text-primary">
                  {tonight ? 'Live music malam ini' : 'Malam ini libur, lihat jadwal berikutnya'}
                </span>
                <div className="mt-20">
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 text-label-sm text-on-secondary-container">
                    {tonight ? 'Bintang Tamu Malam Ini' : fmtShortDate(dayDate(featured.dayOffset, now))}
                  </span>
                  <h2 className="mt-2 text-headline-xl leading-tight">{featured.title}</h2>
                </div>
                <p className="flex items-center gap-1.5 text-label-lg">
                  <Icon name="album" size={18} />
                  {featured.genre}
                </p>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-headline-sm">
                      <Icon name="schedule" size={20} />
                      {featured.start} - {featured.end} WIB
                    </span>
                    {featured.sessions && <span className="chip bg-white/15 text-white">{featured.sessions.length} Sesi</span>}
                  </div>
                  {featured.sessions && (
                    <p className="mt-1 pl-7 text-label-md text-white/70">{featured.sessions.map((s, i) => `Sesi ${i + 1}: ${s}`).join('  •  ')}</p>
                  )}
                </div>
                {featured.location && (
                  <p className="flex items-start gap-1.5 text-body-sm">
                    <Icon name="location_on" size={18} />
                    {featured.location}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      toggleReminder(featured.id);
                      toast(reminded ? 'Pengingat dibatalkan' : 'Pengingat berhasil diaktifkan!', reminded ? 'info' : 'success');
                    }}
                    className={`btn ${reminded ? 'bg-emerald-100 text-emerald-900' : 'bg-secondary-container text-on-secondary-container'}`}
                  >
                    <Icon name="notifications_active" size={18} fill={reminded} />
                    {reminded ? 'Diingatkan ✓' : 'Ingatkan Saya'}
                  </button>
                  <button type="button" onClick={share} className="btn bg-white/15 text-white">
                    <Icon name="share" size={18} />
                    Bagikan
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
            <div className="icon-btn h-9 w-9 bg-secondary-container text-on-secondary-container">
              <Icon name="local_activity" size={18} />
            </div>
            <div>
              <p className="text-label-lg text-primary">Nongkrong Tanpa Tiket Masuk</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                Gratis tanpa biaya tiket masuk! Reservasi meja sangat disarankan untuk akhir pekan agar mendapatkan spot terbaik dekat panggung.
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-headline-md text-primary">Jadwal Minggu Ini</h2>
              <p className="text-body-sm text-on-surface-variant">Update line-up musisi &amp; suasana harian</p>
            </div>
            <span className="chip bg-surface-container text-primary">{fmtRange(dayDate(1, now), dayDate(6, now))}</span>
          </div>

          <div className="flex flex-col gap-3">
            {upcoming.map((s) => {
              const isReminded = data.reminders.includes(s.id);
              return (
                <article key={s.id} className={`flex flex-col gap-3 rounded-xl p-4 ${s.hasLive ? 'bg-surface-container-lowest shadow-sm' : 'bg-surface-container-low'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-label-md font-semibold ${s.hasLive ? 'text-secondary' : 'text-on-surface-variant'}`}>{fmtShortDate(dayDate(s.dayOffset, now))}</span>
                    {s.hasLive ? <Badge tone="green">Ada</Badge> : <Badge tone="muted">Libur</Badge>}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`icon-btn h-11 w-11 rounded-lg ${s.hasLive ? 'bg-surface-container text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                      <Icon name={s.icon} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-headline-sm ${s.hasLive ? 'text-primary' : 'text-on-surface-variant'}`}>{s.title}</h3>
                      <p className="text-body-sm text-on-surface-variant">{s.genre}</p>
                    </div>
                    {s.hasLive && (
                      <button
                        type="button"
                        aria-label="Ingatkan saya"
                        onClick={() => {
                          toggleReminder(s.id);
                          toast(isReminded ? 'Pengingat dibatalkan' : `Kami ingatkan saat ${s.title} dimulai`, isReminded ? 'info' : 'success');
                        }}
                        className={`icon-btn h-10 w-10 ${isReminded ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-low text-primary'}`}
                      >
                        <Icon name="notifications" size={20} fill={isReminded} />
                      </button>
                    )}
                  </div>
                  {s.hasLive && (
                    <div className="flex items-center justify-between border-t border-[rgba(75,46,42,0.08)] pt-3 text-label-md">
                      <span className="flex items-center gap-1 font-semibold text-on-surface">
                        <Icon name="schedule" size={16} />
                        {showTime(s)}
                      </span>
                      <span className="font-bold text-secondary">{s.location}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {isStaff && (
            <section className="flex flex-col gap-3 rounded-2xl bg-surface-container p-4">
              <h3 className="flex items-center gap-2 text-headline-sm text-primary">
                <Icon name="admin_panel_settings" size={22} className="text-secondary" />
                Kelola Jadwal Pertunjukan
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Khusus pengelola outlet &amp; supervisor cafe untuk konfirmasi artis tamu, durasi panggung, dan perubahan jadwal mendadak.
              </p>
              <button type="button" onClick={() => history.push('/staf/live-music')} className="btn-primary w-full">
                <Icon name="add_circle" size={20} />
                Admin: Kelola &amp; Tambah Jadwal Musik
              </button>
            </section>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LiveMusic;

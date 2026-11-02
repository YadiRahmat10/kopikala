import { useState } from 'react';
import { IonContent, IonFooter, IonPage, IonRefresher, IonRefresherContent, useIonAlert } from '@ionic/react';
import { useApp } from '../../state/AppState';
import { CAFE } from '../../data/seed';
import { durationLabel, guestStatus, minutesAgo, pad2, shareText, tableStats } from '../../lib/format';
import { GuestHeader, StaffHeader } from '../../components/Headers';
import { Badge, ChipRow, EmptyState, Icon, Switch, TABLE_BADGE, useToast } from '../../components/ui';
import type { Area, CafeTable, TableStatus } from '../../data/types';

type StatusFilter = 'semua' | TableStatus;
type AreaFilter = 'semua' | Area;

const AREA_CHIPS: { key: AreaFilter; label: string }[] = [
  { key: 'semua', label: 'Semua Area' },
  { key: 'Indoor', label: 'Indoor AC' },
  { key: 'Outdoor', label: 'Outdoor Taman' },
  { key: 'Smoking', label: 'Smoking Area' },
];

function footnote(t: CafeTable, now: number, staffView: boolean) {
  switch (t.status) {
    case 'kosong':
      return { text: t.feature.includes('Outlet') ? t.feature : 'Bisa Langsung Duduk', cls: 'text-emerald-700' };
    case 'terisi':
      return { text: `Sejak ${durationLabel(t.since ?? now, now)} lalu`, cls: 'text-on-surface-variant' };
    case 'dipesan':
      return { text: `Mulai ${t.reservedAt ?? '19.00'} WIB`, cls: 'text-secondary' };
    case 'kotor':
      return staffView
        ? { text: 'Perlu Dibersihkan', cls: 'text-amber-700' }
        : { text: 'Sedang dibersihkan', cls: 'text-on-surface-variant' };
  }
}

export default function TablesPage({ staff = false }: { staff?: boolean }) {
  const { data, now, isStaff, refresh, setTableStatus, toggleSaveTable } = useApp();
  const toast = useToast();
  const [presentAlert] = useIonAlert();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('semua');
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(() => data.savedTable ?? data.tables.find((t) => t.status === 'kosong')?.id ?? 1);
  const [spinning, setSpinning] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const canEdit = staff || (editMode && isStaff);
  const pick = (id: number) => {
    setSelectedId(id);
    setSheetOpen(true);
  };
  const stats = tableStats(data.tables);
  // Pelanggan tidak melihat status "kotor" — dihitung sebagai terisi.
  const statusOf = (t: CafeTable) => (staff ? t.status : guestStatus(t));

  const tables = data.tables.filter(
    (t) => (statusFilter === 'semua' || statusOf(t) === statusFilter) && (areaFilter === 'semua' || t.area === areaFilter),
  );
  const selected = data.tables.find((t) => t.id === selectedId) ?? data.tables[0];
  const selectedStatus = statusOf(selected);

  const statusChips: { key: StatusFilter; label: string; n: number }[] = [
    { key: 'semua', label: 'Semua', n: stats.total },
    { key: 'kosong', label: 'Kosong', n: stats.free },
    { key: 'terisi', label: 'Terisi', n: staff ? stats.busy - stats.dirty : stats.busy },
    { key: 'dipesan', label: 'Dipesan', n: stats.reserved },
    ...(staff ? [{ key: 'kotor' as const, label: 'Kotor', n: stats.dirty }] : []),
  ];

  const doRefresh = () => {
    setSpinning(true);
    refresh();
    window.setTimeout(() => setSpinning(false), 600);
  };

  const setStatus = (status: TableStatus) => {
    if (status === 'dipesan') {
      presentAlert({
        header: `Reservasi Meja ${pad2(selected.id)}`,
        cssClass: 'kk-alert',
        inputs: [
          { name: 'name', placeholder: 'Atas nama (mis. Ibu Cindy, 4 Pax)' },
          { name: 'time', placeholder: 'Jam datang (mis. 19.00)', value: '19.00' },
        ],
        buttons: [
          { text: 'Batal', role: 'cancel' },
          {
            text: 'Simpan',
            handler: (v: { name: string; time: string }) => {
              setTableStatus(selected.id, 'dipesan', { reservedFor: v.name || 'Tamu', reservedAt: v.time || '19.00' });
              toast(`Meja ${pad2(selected.id)} dipesan untuk ${v.name || 'Tamu'}`);
            },
          },
        ],
      });
      return;
    }
    setTableStatus(selected.id, status);
    toast(`Meja ${pad2(selected.id)} ditandai ${TABLE_BADGE[status].label.toLowerCase()}`);
  };

  const share = async () => {
    const r = await shareText(`Meja ${pad2(selected.id)} di KopiKala`, `Yuk ke KopiKala! Meja ${pad2(selected.id)} (${selected.zone}) lagi ${TABLE_BADGE[selectedStatus].label.toLowerCase()}.`);
    if (r === 'copied') toast('Tautan disalin ke clipboard', 'info');
  };

  return (
    <IonPage>
      {staff ? <StaffHeader title="Kelola Meja" /> : <GuestHeader />}
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { refresh(); window.setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
          {/* Ringkasan live */}
          <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-label-sm text-secondary">
                  Ketersediaan Meja Live
                </span>
                <h2 className="mt-1 text-headline-md text-primary">{stats.free} Meja Kosong</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-body-sm text-on-surface-variant">
                  Indoor: {stats.freeIndoor} • Outdoor: {stats.freeOutdoor} •
                  <span className="inline-flex items-center gap-0.5 text-label-md">
                    <Icon name="update" size={14} />
                    Update {Math.max(1, minutesAgo(data.lastSync, now))} mnt lalu
                  </span>
                </p>
              </div>
              <button type="button" aria-label="Segarkan" onClick={doRefresh} className="icon-btn h-11 w-11 bg-surface-container-lowest text-primary shadow-sm">
                <Icon name="sync" size={22} className={spinning ? 'kk-spin' : ''} />
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[rgba(75,46,42,0.08)] pt-3 text-label-md text-on-surface-variant">
              <span className="flex items-center gap-1"><Icon name="wifi" size={16} /> Wifi 100 Mbps Stabil</span>
              <span className="flex items-center gap-1"><Icon name="power" size={16} /> 80% Area Berstopkontak</span>
            </div>
          </section>

          {/* Toggle mode staf: hanya admin yang sedang melihat tampilan pelanggan */}
          {!staff && isStaff && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-4">
              <div className="flex items-center gap-3">
                <Icon name="admin_panel_settings" size={22} className="text-secondary" />
                <div>
                  <p className="text-label-lg text-primary">Mode Staf Cafe</p>
                  <p className="text-label-md font-medium text-on-surface-variant">Ubah status meja langsung</p>
                </div>
              </div>
              <Switch label="Mode Staf Cafe" checked={editMode} onChange={setEditMode} />
            </div>
          )}

          {/* Segmented tabs */}
          <div className="grid grid-cols-2 rounded-2xl bg-surface-container p-1">
            {([['grid', 'grid_view', 'Denah Grid'], ['list', 'format_list_bulleted', 'Daftar Rinci']] as const).map(([k, icon, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setView(k)}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-label-lg transition-all ${view === k ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
              >
                <Icon name={icon} size={20} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <ChipRow>
              {statusChips.map((c) => {
                const active = statusFilter === c.key;
                return (
                  <button key={c.key} type="button" onClick={() => setStatusFilter(c.key)} className={`filter-chip ${active ? 'filter-chip-active' : ''}`}>
                    {c.label}
                    <span className={`rounded-full px-1.5 text-label-sm ${active ? 'bg-white/20' : 'bg-surface-container'}`}>{c.n}</span>
                  </button>
                );
              })}
            </ChipRow>
            <ChipRow>
              {AREA_CHIPS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setAreaFilter(c.key)}
                  className={`h-8 shrink-0 whitespace-nowrap rounded-lg px-3 text-label-md transition-colors ${areaFilter === c.key ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}
                >
                  {c.label}
                </button>
              ))}
            </ChipRow>
          </div>

          {tables.length === 0 ? (
            <EmptyState icon="table_restaurant" title="Tidak ada meja" text="Coba ubah filter status atau area untuk melihat meja lainnya." />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {tables.map((t) => {
                const st = statusOf(t);
                const note = footnote({ ...t, status: st }, now, staff);
                const active = t.id === selected.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    className={`flex flex-col rounded-2xl bg-surface-container-lowest p-3 text-left shadow-sm transition-all active:scale-[0.98] ${active ? 'ring-2 ring-primary-container' : 'ring-1 ring-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="text-label-md font-semibold text-on-surface-variant">{t.area}</span>
                        <p className="text-counter text-primary">{pad2(t.id)}</p>
                      </div>
                      <Badge tone={TABLE_BADGE[st].tone} className="!px-2 !py-0.5 !text-[10px]">{TABLE_BADGE[st].label}</Badge>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5 border-t border-[rgba(75,46,42,0.08)] pt-2.5">
                      <span className="flex items-center gap-1.5 text-label-md font-medium text-on-surface-variant">
                        <Icon name={t.icon} size={16} />
                        {t.seatLabel}
                      </span>
                      <span className={`truncate text-label-md font-semibold ${note.cls}`}>{note.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tables.map((t) => {
                const st = statusOf(t);
                const note = footnote({ ...t, status: st }, now, staff);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    className={`flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 text-left shadow-sm ${t.id === selected.id ? 'ring-2 ring-primary-container' : ''}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-container-low">
                      <span className="text-[9px] font-bold text-on-surface-variant">Meja</span>
                      <span className="text-headline-sm leading-none text-primary">{pad2(t.id)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-lg text-primary">{t.zone}</p>
                      <p className="truncate text-label-md font-medium text-on-surface-variant">{t.seatLabel} • {t.feature}</p>
                      <p className={`truncate text-label-md font-semibold ${note.cls}`}>{note.text}</p>
                    </div>
                    <Badge tone={TABLE_BADGE[st].tone}>{TABLE_BADGE[st].label}</Badge>
                  </button>
                );
              })}
            </div>
          )}

          {!staff && (
            <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm font-semibold text-primary">Suasana &amp; Tips Datang</h3>
                <span className="chip bg-surface-container-lowest text-secondary">Suhu 24°C</span>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Jam ramai biasanya dimulai pukul 19.30 WIB menjelang sesi Live Music. Kamu bisa menandai meja kosong terlebih dahulu atau langsung datang ke lokasi.
              </p>
              <div className="flex flex-wrap gap-4 text-label-md text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-600" /> Kosong (Langsung Duduk)</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-600" /> Sedang Dipakai</span>
              </div>
            </section>
          )}
        </div>
      </IonContent>

      {/* Detail meja terpilih (bottom sheet menempel) */}
      <IonFooter className="kk-footer ion-no-border">
        <div className="glass rounded-t-3xl border-b-0 px-4 pb-3 pt-2">
          <button type="button" aria-label={sheetOpen ? 'Ciutkan detail meja' : 'Buka detail meja'} onClick={() => setSheetOpen((v) => !v)} className="mx-auto mb-1 flex h-4 w-16 items-center justify-center">
            <span className="h-1 w-9 rounded-full bg-[#e8d8c4]" />
          </button>
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={() => setSheetOpen((v) => !v)} className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-headline-md text-primary">Meja {pad2(selected.id)}</h3>
                <Badge tone={TABLE_BADGE[selectedStatus].tone}>{TABLE_BADGE[selectedStatus].long}</Badge>
                <Icon name={sheetOpen ? 'expand_more' : 'expand_less'} size={20} className="text-on-surface-variant" />
              </div>
              <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
                {selected.zone} • Kapasitas {selected.seats} Kursi
                {selected.status === 'dipesan' && selected.reservedFor ? ` • a.n. ${selected.reservedFor}` : ''}
              </p>
            </button>
            <button type="button" aria-label="Bagikan meja" onClick={share} className="icon-btn h-11 w-11 bg-surface-container text-primary">
              <Icon name="share" size={20} />
            </button>
          </div>
          {sheetOpen && (
          <>
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-surface-container-low px-3 py-2 text-label-md font-semibold text-on-surface-variant">
            <Icon name="check_circle" size={18} className="text-secondary" />
            {staff && selected.order ? `Order: ${selected.order}` : selected.feature}
          </div>

          {canEdit && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                ['kosong', 'check', 'Set Kosong', 'bg-emerald-50 text-emerald-800'],
                ['terisi', 'close', 'Set Terisi', 'bg-red-50 text-red-700'],
                ['dipesan', 'event_seat', 'Set Reservasi', 'bg-orange-50 text-orange-800'],
              ] as const).map(([s, icon, label, cls]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  disabled={selected.status === s}
                  className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl px-1 text-label-md font-bold transition-all active:scale-95 disabled:opacity-40 ${cls}`}
                >
                  <Icon name={icon} size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {!staff && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleSaveTable(selected.id);
                  toast(data.savedTable === selected.id ? 'Meja dihapus dari simpanan' : `Meja ${pad2(selected.id)} disimpan — tunjukkan ke kasir saat tiba`, data.savedTable === selected.id ? 'info' : 'success');
                }}
                disabled={selected.status !== 'kosong' && data.savedTable !== selected.id}
                className="btn-soft"
              >
                <Icon name="bookmark" size={20} fill={data.savedTable === selected.id} />
                {data.savedTable === selected.id ? 'Tersimpan' : 'Simpan Meja'}
              </button>
              <a href={CAFE.mapsUrl} target="_blank" rel="noreferrer" className="btn-primary">
                <Icon name="directions" size={20} />
                Arah ke Cafe
              </a>
            </div>
          )}
          </>
          )}
        </div>
      </IonFooter>
    </IonPage>
  );
}

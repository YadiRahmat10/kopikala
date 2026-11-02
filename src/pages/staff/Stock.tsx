import { useState } from 'react';
import { IonContent, IonPage, IonRefresher, IonRefresherContent, useIonActionSheet } from '@ionic/react';
import { useApp } from '../../state/AppState';
import { menuStatus, rupiah } from '../../lib/format';
import { StaffHeader } from '../../components/Headers';
import { AddMenuModal } from '../../components/AddMenuModal';
import { Badge, ChipRow, EmptyState, Icon, MENU_BADGE, Stepper, Switch, useToast } from '../../components/ui';
import type { Category, MenuItem } from '../../data/types';

const CATS: ('Semua' | Category)[] = ['Semua', 'Kopi', 'Non-Kopi', 'Pastry', 'Makanan', 'Camilan', 'Musiman'];

function statusText(m: MenuItem) {
  const s = menuStatus(m);
  if (s === 'habis') return 'Habis (Sold Out)';
  if (s === 'menipis') return `Sisa ${m.stock} Porsi (Menipis)`;
  return m.stock === null ? 'Tersedia (Bahan Melimpah)' : `Tersedia (${m.stock} Porsi)`;
}

const Stock: React.FC = () => {
  const { data, lastAddedId, refresh, changeStock, soldOut, restock, toggleMenuActive, setQuota, removeMenu } = useApp();
  const toast = useToast();
  const [presentSheet] = useIonActionSheet();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<(typeof CATS)[number]>('Semua');
  const [lowOnly, setLowOnly] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);

  const menu = data.menu;
  const count = (c: (typeof CATS)[number]) => (c === 'Semua' ? menu.length : menu.filter((m) => m.category === c).length);
  const stats = {
    active: menu.filter((m) => m.active && menuStatus(m) !== 'habis').length,
    low: menu.filter((m) => menuStatus(m) === 'menipis').length,
    out: menu.filter((m) => menuStatus(m) === 'habis').length,
  };
  const lastAdded = menu.find((m) => m.id === lastAddedId);

  const q = query.trim().toLowerCase();
  const list = menu
    .filter((m) => cat === 'Semua' || m.category === cat)
    .filter((m) => !q || `${m.name} ${m.sku} ${m.category}`.toLowerCase().includes(q))
    .filter((m) => !lowOnly || menuStatus(m) === 'menipis')
    .filter((m) => !hideInactive || m.active);

  const more = (m: MenuItem) =>
    presentSheet({
      header: m.name,
      subHeader: `${m.sku} • ${rupiah(m.price)}`,
      buttons: [
        { text: m.stock === null ? 'Batasi Kuota Porsi Harian' : 'Jadikan Tanpa Kuota', handler: () => setQuota(m.id, m.stock === null) },
        { text: m.active ? 'Sembunyikan dari QR Menu' : 'Tampilkan di QR Menu', handler: () => toggleMenuActive(m.id) },
        { text: 'Hapus Menu', role: 'destructive', handler: () => { removeMenu(m.id); toast(`${m.name} dihapus`, 'info'); } },
        { text: 'Batal', role: 'cancel' },
      ],
    });

  return (
    <IonPage>
      <StaffHeader title="Stok & Menu" />
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { refresh(); window.setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="eyebrow">Inventaris Barista</span>
                <h1 className="mt-0.5 text-headline-md text-primary">Kelola Stok &amp; Menu</h1>
              </div>
              <span className="chip mt-1 bg-secondary-container/80 text-on-secondary-container">
                Sinkron Live Dapur
              </span>
            </div>
            <p className="mt-1 text-body-md text-on-surface-variant">Pembaruan status menu langsung tercermin pada QR Meja pelanggan &amp; sistem POS.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Aktif', icon: 'check_circle', n: stats.active, unit: 'item', cls: 'bg-surface-container text-primary' },
              { label: 'Restock', icon: 'warning', n: stats.low, unit: 'segera', cls: 'bg-secondary-container/60 text-primary' },
              { label: 'Habis', icon: 'remove_shopping_cart', n: stats.out, unit: 'menu', cls: 'bg-red-100 text-red-800' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
                <div className="flex items-center justify-between text-label-md">
                  {s.label}
                  <Icon name={s.icon} size={18} />
                </div>
                <p className="mt-2 text-counter">
                  {s.n} <span className="text-label-md font-semibold">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary min-h-[56px] w-full bg-primary text-body-lg font-bold">
            <Icon name="add_circle" size={22} />
            Tambah Menu Baru
          </button>

          {lastAdded && (
            <div className="flex items-center gap-3 rounded-2xl bg-surface-container p-3 ring-1 ring-emerald-200">
              <div className="icon-btn h-10 w-10 bg-emerald-100 text-emerald-700">
                <Icon name="check_circle" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-lg text-primary">Menu Baru Ditambahkan</p>
                <p className="truncate text-body-sm text-on-surface-variant">{lastAdded.name} {lastAdded.active ? 'siap dipesan pelanggan' : 'tersimpan sebagai draf'}</p>
              </div>
              <span className={`chip ${lastAdded.active ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'}`}>{lastAdded.active ? 'Aktif Live' : 'Draf'}</span>
            </div>
          )}

          <label className="flex items-center gap-2 rounded-2xl bg-surface-container px-4">
            <Icon name="search" size={22} className="text-on-surface-variant" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama menu, SKU, atau kategori..." className="h-12 w-full bg-transparent text-body-md outline-none placeholder:text-on-surface-variant/70" />
            {query && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery('')} className="text-on-surface-variant">
                <Icon name="close" size={18} />
              </button>
            )}
          </label>

          <ChipRow>
            {CATS.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className={`filter-chip ${cat === c ? 'filter-chip-active' : ''}`}>
                {c} ({count(c)})
              </button>
            ))}
          </ChipRow>
          <div className="-mt-1 flex flex-wrap gap-2">
            <button type="button" onClick={() => setLowOnly((v) => !v)} className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-label-md font-semibold ${lowOnly ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-primary'}`}>
              <Icon name="filter_list" size={16} /> Hanya Stok Menipis
            </button>
            <button type="button" onClick={() => setHideInactive((v) => !v)} className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-label-md font-semibold ${hideInactive ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-primary'}`}>
              <Icon name="visibility_off" size={16} /> Sembunyikan Nonaktif
            </button>
          </div>

          {list.length === 0 && <EmptyState icon="inventory_2" title="Menu tidak ditemukan" text="Ubah kata kunci atau filter untuk melihat menu lainnya." />}

          {list.map((m) => {
            const s = menuStatus(m);
            const habis = s === 'habis';
            const isNew = m.id === lastAddedId;
            const tag = isNew ? 'Baru' : m.tag;
            return (
              <article key={m.id} className={`flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm ${isNew ? 'ring-2 ring-emerald-200' : ''} ${!m.active ? 'opacity-70' : ''}`}>
                <div className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
                    <img src={m.image} alt="" className={`h-full w-full object-cover ${habis ? 'grayscale' : ''}`} />
                    {habis ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-label-sm text-white">HABIS</span>
                    ) : (
                      tag && <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${isNew ? 'bg-emerald-600 text-white' : 'bg-secondary-container text-on-secondary-container'}`}>{tag}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="truncate text-headline-sm text-primary">{m.name}</h3>
                      <button type="button" aria-label="Opsi lainnya" onClick={() => more(m)} className="icon-btn -mr-1 h-8 w-8 text-on-surface-variant">
                        <Icon name="more_vert" size={20} />
                      </button>
                    </div>
                    <p className="text-label-md">
                      <span className="text-secondary">{m.category} • {m.sku}</span>
                      <span className="ml-2 font-bold text-primary">{rupiah(m.price)}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge tone={MENU_BADGE[s]}>{statusText(m)}</Badge>
                      {!m.active && <Badge tone="muted">Disembunyikan</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-2xl bg-surface-container-low p-2 pl-3">
                  {habis ? (
                    <>
                      <button type="button" onClick={() => { restock(m.id); toast('Stok berhasil diperbarui'); }} className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 text-label-md font-bold text-on-primary active:scale-95">
                        <Icon name="add_box" size={18} /> Restock Batch (+10)
                      </button>
                      <span className="flex items-center gap-2 text-label-md text-on-surface-variant">
                        QR Menu:
                        <Switch label="Tampilkan di QR menu" checked={m.active} onChange={() => toggleMenuActive(m.id)} />
                      </span>
                    </>
                  ) : (
                    <>
                      {m.stock === null ? (
                        <span className="flex items-center gap-2 text-label-md text-on-surface-variant">
                          Batas Kuota:
                          <span className="rounded-lg bg-white px-2.5 py-1.5 text-label-md font-bold text-primary">Tanpa Kuota</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-label-md text-on-surface-variant">
                          Stok:
                          <Stepper size="sm" value={m.stock} onChange={(d) => changeStock(m.id, d)} />
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { soldOut(m.id); toast(`${m.name} ditandai habis`, 'info'); }} className="flex h-9 items-center gap-1 rounded-2xl bg-surface-container px-2.5 text-label-md text-primary">
                          <Icon name="block" size={16} /> Habiskan
                        </button>
                        <Switch label="Tampilkan di QR menu" checked={m.active} onChange={() => toggleMenuActive(m.id)} />
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </IonContent>
      <AddMenuModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </IonPage>
  );
};

export default Stock;

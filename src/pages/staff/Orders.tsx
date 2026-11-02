import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonRefresher, IonRefresherContent, useIonAlert, useIonViewDidEnter, useIonViewWillLeave } from '@ionic/react';
import { useApp } from '../../state/AppState';
import { clockLabel, durationLabel, minutesAgo, pad2, rupiah } from '../../lib/format';
import { StaffHeader } from '../../components/Headers';
import { Badge, ChipRow, EmptyState, Icon, ORDER_BADGE, useToast } from '../../components/ui';
import type { Order, OrderStatus } from '../../data/types';

type Filter = 'aktif' | 'baru' | 'belum-bayar' | 'selesai' | 'semua';

const ACTIVE: OrderStatus[] = ['baru', 'diproses', 'diantar'];
const isActive = (o: Order) => ACTIVE.includes(o.status);

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; icon: string; label: (o: Order) => string }>> = {
  baru: { to: 'diproses', icon: 'coffee_maker', label: () => 'Terima & Proses' },
  diproses: { to: 'diantar', icon: 'room_service', label: (o) => (o.tableId ? 'Antar ke Meja' : 'Siap Diambil') },
  diantar: { to: 'selesai', icon: 'task_alt', label: () => 'Selesai' },
};

const tableLabel = (o: Order) => (o.tableId ? `Meja ${pad2(o.tableId)}` : 'Takeaway');

function agoLabel(ts: number, now: number) {
  return minutesAgo(ts, now) < 1 ? 'baru saja' : `${durationLabel(ts, now)} lalu`;
}

function PaymentChip({ o }: { o: Order }) {
  const method = o.payment === 'qris' ? 'QRIS' : 'Kasir';
  return o.paid ? (
    <Badge tone="green" icon="verified">{method} • Lunas</Badge>
  ) : (
    <Badge tone="red" icon="payments">{method} • Belum Bayar</Badge>
  );
}

function OrderCard({ o, now }: { o: Order; now: number }) {
  const { setOrderStatus, markOrderPaid } = useApp();
  const toast = useToast();
  const [presentAlert] = useIonAlert();
  const next = NEXT[o.status];
  const badge = ORDER_BADGE[o.status];
  const done = o.status === 'selesai' || o.status === 'batal';

  const cancel = () =>
    presentAlert({
      header: `Batalkan #${o.code}?`,
      message: `Pesanan ${o.customer} (${tableLabel(o)}) akan dibatalkan.`,
      cssClass: 'kk-alert',
      buttons: [
        { text: 'Tidak', role: 'cancel' },
        { text: 'Batalkan', role: 'destructive', handler: () => { setOrderStatus(o.id, 'batal'); toast(`Pesanan #${o.code} dibatalkan`, 'info'); } },
      ],
    });

  return (
    <article className={`card gap-3 ${o.status === 'baru' ? 'ring-2 ring-secondary/50' : ''} ${done ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-container text-on-primary">
          {o.tableId ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Meja</span>
              <span className="text-headline-md leading-none">{pad2(o.tableId)}</span>
            </>
          ) : (
            <Icon name="shopping_bag" size={26} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-headline-sm text-primary">{o.customer}</h3>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <p className="text-label-md font-medium text-on-surface-variant">
            #{o.code} • {tableLabel(o)} • {clockLabel(o.createdAt)}
          </p>
          <p className="text-label-sm font-medium text-secondary">{agoLabel(o.createdAt, now)}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
        {o.items.map((it, i) => (
          <li key={i} className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2 text-body-sm">
              <span className="text-on-surface">
                <b className="text-primary">{it.qty}x</b> {it.name}
              </span>
              <span className="shrink-0 font-semibold text-on-surface-variant">{rupiah(it.price * it.qty)}</span>
            </div>
            {it.note && (
              <span className="flex w-fit items-start gap-1 rounded-lg bg-amber-50 px-2 py-1 text-label-md font-semibold text-amber-900">
                <Icon name="edit_note" size={16} className="shrink-0" />
                {it.note}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <PaymentChip o={o} />
        <span className="text-headline-sm text-primary">{rupiah(o.total)}</span>
      </div>

      {!done && (
        <div className="flex gap-2">
          <button type="button" aria-label="Batalkan pesanan" onClick={cancel} className="icon-btn h-12 w-12 bg-red-50 text-red-700">
            <Icon name="close" size={22} />
          </button>
          {!o.paid && (
            <button type="button" onClick={() => { markOrderPaid(o.id); toast(`#${o.code} lunas di kasir`); }} className="btn-soft flex-1 px-3">
              <Icon name="payments" size={18} />
              Tandai Lunas
            </button>
          )}
          {next && (
            <button type="button" onClick={() => setOrderStatus(o.id, next.to)} className="btn-primary flex-1 px-3">
              <Icon name={next.icon} size={18} />
              {next.label(o)}
            </button>
          )}
        </div>
      )}
      {o.status === 'selesai' && !o.paid && (
        <button type="button" onClick={() => markOrderPaid(o.id)} className="btn-soft w-full">
          <Icon name="payments" size={18} />
          Tandai Lunas
        </button>
      )}
    </article>
  );
}

/** Ringkasan pesanan aktif per meja: siapa saja yang pesan & sisa tagihan. */
function TableGroups({ orders }: { orders: Order[] }) {
  const groups = new Map<number | null, Order[]>();
  orders.forEach((o) => groups.set(o.tableId, [...(groups.get(o.tableId) ?? []), o]));
  const keys = [...groups.keys()].sort((a, b) => (a ?? 999) - (b ?? 999));

  return (
    <div className="flex flex-col gap-3">
      {keys.map((k) => {
        const list = groups.get(k)!;
        const unpaid = list.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
        const items = list.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);
        return (
          <section key={String(k)} className="card gap-2">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-headline-sm text-primary">
                <Icon name={k ? 'table_restaurant' : 'shopping_bag'} size={20} />
                {k ? `Meja ${pad2(k)}` : 'Takeaway'}
              </h3>
              <span className="chip shrink-0 bg-surface-container text-primary">{list.length} pesanan</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {list.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-label-md">
                  <span className="min-w-0 truncate text-on-surface">
                    <b>#{o.code}</b> {o.customer}
                  </span>
                  <Badge tone={ORDER_BADGE[o.status].tone} className="!px-2 !py-0.5 !text-[10px]">{ORDER_BADGE[o.status].label}</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-1 flex items-center justify-between border-t border-[rgba(75,46,42,0.08)] pt-2 text-label-md">
              <span className="font-medium text-on-surface-variant">{items} item</span>
              {unpaid ? <span className="font-bold text-red-700">Belum bayar {rupiah(unpaid)}</span> : <span className="font-bold text-emerald-700">Lunas</span>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const Orders: React.FC = () => {
  const { data, now, refresh, markOrdersSeen } = useApp();
  const [filter, setFilter] = useState<Filter>('aktif');
  const [view, setView] = useState<'list' | 'table'>('list');
  const [visible, setVisible] = useState(false);

  useIonViewDidEnter(() => setVisible(true));
  useIonViewWillLeave(() => setVisible(false));
  const unseen = data.orders.some((o) => !o.seen);
  // Selama halaman ini terbuka, pesanan yang masuk dianggap sudah dilihat admin
  useEffect(() => {
    if (visible && unseen) markOrdersSeen();
  }, [visible, unseen]); // eslint-disable-line react-hooks/exhaustive-deps

  const orders = [...data.orders].sort((a, b) => b.createdAt - a.createdAt);
  const active = orders.filter(isActive);
  const unpaid = orders.filter((o) => !o.paid && o.status !== 'batal');
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const revenue = orders.filter((o) => o.paid && o.status !== 'batal' && o.createdAt >= todayStart).reduce((s, o) => s + o.total, 0);

  const FILTERS: { key: Filter; label: string; n: number; match: (o: Order) => boolean }[] = [
    { key: 'aktif', label: 'Aktif', n: active.length, match: isActive },
    { key: 'baru', label: 'Baru', n: orders.filter((o) => o.status === 'baru').length, match: (o) => o.status === 'baru' },
    { key: 'belum-bayar', label: 'Belum Bayar', n: unpaid.length, match: (o) => !o.paid && o.status !== 'batal' },
    { key: 'selesai', label: 'Riwayat', n: orders.filter((o) => !isActive(o)).length, match: (o) => !isActive(o) },
    { key: 'semua', label: 'Semua', n: orders.length, match: () => true },
  ];
  const f = FILTERS.find((x) => x.key === filter)!;
  // Pesanan aktif selalu di atas, lalu yang terbaru
  const list = orders.filter(f.match).sort((a, b) => Number(isActive(b)) - Number(isActive(a)));

  return (
    <IonPage>
      <StaffHeader title="Pesanan" />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { refresh(); window.setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Aktif', value: String(active.length), cls: 'text-primary' },
              { label: 'Belum Bayar', value: String(unpaid.length), cls: unpaid.length ? 'text-red-700' : 'text-primary' },
              { label: 'Masuk Hari Ini', value: rupiah(revenue), cls: 'text-emerald-800', small: true },
            ].map((s) => (
              <div key={s.label} className="glass flex flex-col gap-0.5 rounded-xl p-3">
                <span className="text-label-sm font-semibold text-on-surface-variant">{s.label}</span>
                <span className={`${s.small ? 'text-label-lg' : 'text-headline-md'} truncate ${s.cls}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 rounded-2xl bg-surface-container p-1">
            {([['list', 'receipt_long', 'Daftar Pesanan'], ['table', 'table_restaurant', 'Per Meja']] as const).map(([k, icon, label]) => (
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

          {view === 'table' ? (
            active.length ? (
              <TableGroups orders={active} />
            ) : (
              <EmptyState icon="table_restaurant" title="Belum Ada Pesanan Aktif" text="Pesanan pelanggan yang sedang berjalan akan dikelompokkan per meja di sini." />
            )
          ) : (
            <>
              <ChipRow>
                {FILTERS.map((x) => (
                  <button key={x.key} type="button" onClick={() => setFilter(x.key)} className={`filter-chip ${filter === x.key ? 'filter-chip-active' : ''}`}>
                    {x.label}
                    <span className={`rounded-full px-1.5 text-label-sm ${filter === x.key ? 'bg-white/20' : 'bg-surface-container'}`}>{x.n}</span>
                  </button>
                ))}
              </ChipRow>
              {list.length ? (
                list.map((o) => <OrderCard key={o.id} o={o} now={now} />)
              ) : (
                <EmptyState icon="receipt_long" title="Tidak Ada Pesanan" text="Belum ada pesanan untuk filter ini. Pesanan baru dari pelanggan akan muncul otomatis." />
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Orders;

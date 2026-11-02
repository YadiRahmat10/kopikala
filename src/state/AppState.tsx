import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ActivityLog, AppData, CafeTable, CartLine, MenuItem, Order, OrderStatus, PaymentMethod, Session, Show, Stage, TableStatus } from '../data/types';
import { CAFE, createSeed } from '../data/seed';
import { pad2 } from '../lib/format';

const DATA_KEY = 'kopikala-data-v1';
const SESSION_KEY = 'kopikala-session-v1';

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* storage tidak tersedia */
  }
  return fallback();
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage tidak tersedia */
  }
}

/** Data tersimpan dari versi lama masih memakai URL gambar eksternal; ganti dengan foto lokal dari seed. */
function withLocalImages(data: AppData): AppData {
  const seed = createSeed();
  const pick = <T extends { id: string; image?: string }>(list: T[], seedList: T[]) =>
    list.map((it) => {
      const fresh = seedList.find((s) => s.id === it.id)?.image;
      return fresh && it.image?.startsWith('https://lh3.googleusercontent.com/') ? { ...it, image: fresh } : it;
    });
  // data versi lama belum punya daftar pesanan
  return { ...data, orders: data.orders ?? [], menu: pick(data.menu, seed.menu), shows: pick(data.shows, seed.shows) };
}

const sameLine = (c: CartLine, menuId: string, note: string) => c.menuId === menuId && (c.note ?? '') === note;

/** Tambah qty ke baris menu+catatan yang sama, atau buat baris baru. */
function mergeLine(cart: CartLine[], menuId: string, qty: number, note: string): CartLine[] {
  return cart.some((c) => sameLine(c, menuId, note))
    ? cart.map((c) => (sameLine(c, menuId, note) ? { ...c, qty: c.qty + qty } : c))
    : [...cart, { menuId, qty, ...(note ? { note } : {}) }];
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export type NewMenuInput = Omit<MenuItem, 'id' | 'sku' | 'createdAt'>;
export type NewShowInput = Omit<Show, 'id'>;

interface AppState {
  data: AppData;
  now: number;
  session: Session | null;
  /** true bila masuk sebagai admin */
  isStaff: boolean;
  lastAddedId: string | null;

  loginAdmin: (username: string, password: string) => boolean;
  loginCustomer: (name: string) => void;
  logout: () => void;

  refresh: () => void;
  resetDemo: () => void;

  setTableStatus: (id: number, status: TableStatus, extra?: Partial<CafeTable>) => void;
  freeAllDirty: () => number;
  toggleSaveTable: (id: number) => void;

  changeStock: (id: string, delta: number) => void;
  soldOut: (id: string) => void;
  restock: (id: string, qty?: number) => void;
  restockAllSoldOut: () => number;
  toggleMenuActive: (id: string) => void;
  setQuota: (id: string, limited: boolean) => void;
  removeMenu: (id: string) => void;
  addMenu: (input: NewMenuInput) => MenuItem;
  dismissAnnouncement: (id: string) => void;

  addToCart: (menuId: string, qty?: number, note?: string) => void;
  changeCart: (menuId: string, delta: number, note?: string) => void;
  editCartLine: (menuId: string, oldNote: string, next: { qty: number; note: string }) => void;
  clearCart: () => void;
  placeOrder: (tableId: number | null, payment: PaymentMethod) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  markOrderPaid: (id: string) => void;
  markOrdersSeen: () => void;

  toggleReminder: (showId: string) => void;
  toggleShowLive: (showId: string) => void;
  saveShow: (input: NewShowInput) => void;
  updateStage: (patch: Partial<Stage>) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => withLocalImages(load(DATA_KEY, () => createSeed())));
  const [session, setSession] = useState<Session | null>(() => load(SESSION_KEY, () => null));
  const [now, setNow] = useState(Date.now());
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => save(DATA_KEY, data), [data]);
  useEffect(() => save(SESSION_KEY, session), [session]);
  const isStaff = session?.role === 'admin';

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  // Sinkronkan perubahan dari tab/jendela lain (mis. staf & pelanggan dibuka berdampingan).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DATA_KEY && e.newValue) setData(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const log = (d: AppData, text: string, highlight: string, tone: ActivityLog['tone'], who = CAFE.staffName): AppData => ({
    ...d,
    logs: [{ id: uid('l'), who, text, highlight, tone, at: Date.now() }, ...d.logs].slice(0, 30),
  });

  const patchMenu = (d: AppData, id: string, fn: (m: MenuItem) => MenuItem) => ({
    ...d,
    menu: d.menu.map((m) => (m.id === id ? fn(m) : m)),
  });

  const nameOf = (d: AppData, id: string) => d.menu.find((m) => m.id === id)?.name ?? 'Menu';

  const loginAdmin = useCallback((username: string, password: string) => {
    if (username.trim().toLowerCase() !== CAFE.demoAdmin.username || password !== CAFE.demoAdmin.password) return false;
    setSession({ role: 'admin', name: CAFE.staffName });
    return true;
  }, []);

  const value = useMemo<AppState>(() => ({
    data,
    now,
    session,
    isStaff,
    lastAddedId,
    loginAdmin,
    loginCustomer: (name) => setSession({ role: 'pelanggan', name: name.trim() }),
    logout: () => {
      setSession(null);
      // keranjang milik sesi sebelumnya tidak terbawa ke pengguna berikutnya
      setData((d) => ({ ...d, cart: [] }));
    },

    refresh: () => {
      setNow(Date.now());
      setData((d) => ({ ...d, lastSync: Date.now() }));
    },
    resetDemo: () => {
      setData(createSeed());
      setLastAddedId(null);
    },

    setTableStatus: (id, status, extra = {}) =>
      setData((d) => {
        const next: AppData = {
          ...d,
          lastSync: Date.now(),
          tables: d.tables.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  since: status === 'kosong' || status === 'dipesan' ? undefined : Date.now(),
                  order: status === 'terisi' ? extra.order ?? t.order : undefined,
                  reservedFor: status === 'dipesan' ? extra.reservedFor : undefined,
                  reservedAt: status === 'dipesan' ? extra.reservedAt : undefined,
                }
              : t,
          ),
        };
        const label = { kosong: 'KOSONG', terisi: 'TERISI', dipesan: 'DIPESAN', kotor: 'PERLU DIBERSIHKAN' }[status];
        return log(next, `menandai Meja ${pad2(id)} menjadi`, label, status === 'kosong' ? 'success' : 'info');
      }),
    freeAllDirty: () => {
      const n = data.tables.filter((t) => t.status === 'kotor').length;
      if (n)
        setData((d) =>
          log(
            { ...d, tables: d.tables.map((t) => (t.status === 'kotor' ? { ...t, status: 'kosong', since: undefined } : t)) },
            `membersihkan ${n} meja sekaligus menjadi`,
            'KOSONG',
            'success',
          ),
        );
      return n;
    },
    toggleSaveTable: (id) => setData((d) => ({ ...d, savedTable: d.savedTable === id ? null : id })),

    changeStock: (id, delta) =>
      setData((d) =>
        patchMenu({ ...d, lastSync: Date.now() }, id, (m) => (m.stock === null ? m : { ...m, stock: Math.max(0, m.stock + delta) })),
      ),
    soldOut: (id) =>
      setData((d) => log(patchMenu(d, id, (m) => ({ ...m, stock: 0 })), `menandai ${nameOf(d, id)}`, 'HABIS', 'danger')),
    restock: (id, qty = 10) =>
      setData((d) =>
        log(
          patchMenu(d, id, (m) => ({ ...m, stock: (m.stock ?? 0) + qty, soldOutNote: undefined })),
          `restock ${nameOf(d, id)} +${qty} porsi,`,
          'TERSEDIA',
          'success',
        ),
      ),
    restockAllSoldOut: () => {
      const n = data.menu.filter((m) => m.stock === 0).length;
      if (n)
        setData((d) =>
          log(
            { ...d, menu: d.menu.map((m) => (m.stock === 0 ? { ...m, stock: 10, soldOutNote: undefined } : m)) },
            `restock cepat ${n} menu habis (+10),`,
            'TERSEDIA',
            'success',
          ),
        );
      return n;
    },
    toggleMenuActive: (id) => setData((d) => patchMenu(d, id, (m) => ({ ...m, active: !m.active }))),
    setQuota: (id, limited) => setData((d) => patchMenu(d, id, (m) => ({ ...m, stock: limited ? m.stock ?? 20 : null }))),
    removeMenu: (id) =>
      setData((d) => ({
        ...log(d, `menghapus menu ${nameOf(d, id)} dari`, 'KATALOG', 'danger'),
        menu: d.menu.filter((m) => m.id !== id),
        cart: d.cart.filter((c) => c.menuId !== id),
        announcements: d.announcements.filter((a) => a !== id),
      })),
    addMenu: (input) => {
      const nextSku = 200 + data.menu.length;
      const item: MenuItem = { ...input, id: uid('m'), sku: `SKU-${nextSku}`, createdAt: Date.now() };
      setData((d) =>
        log(
          {
            ...d,
            menu: [item, ...d.menu],
            announcements: item.active ? [item.id, ...d.announcements] : d.announcements,
          },
          `menambahkan menu ${item.name},`,
          item.active ? 'AKTIF LIVE' : 'DRAF',
          'success',
        ),
      );
      setLastAddedId(item.id);
      return item;
    },
    dismissAnnouncement: (id) => setData((d) => ({ ...d, announcements: d.announcements.filter((a) => a !== id) })),

    addToCart: (menuId, qty = 1, note = '') =>
      setData((d) => ({ ...d, cart: mergeLine(d.cart, menuId, qty, note.trim()) })),
    changeCart: (menuId, delta, note = '') =>
      setData((d) => ({
        ...d,
        cart: d.cart.map((c) => (sameLine(c, menuId, note) ? { ...c, qty: c.qty + delta } : c)).filter((c) => c.qty > 0),
      })),
    editCartLine: (menuId, oldNote, next) =>
      setData((d) => {
        const rest = d.cart.filter((c) => !sameLine(c, menuId, oldNote));
        return { ...d, cart: next.qty > 0 ? mergeLine(rest, menuId, next.qty, next.note.trim()) : rest };
      }),
    clearCart: () => setData((d) => ({ ...d, cart: [] })),
    placeOrder: (tableId, payment) => {
      const items = data.cart.flatMap((c) => {
        const m = data.menu.find((x) => x.id === c.menuId);
        return m ? [{ menuId: m.id, name: m.name, price: m.price, qty: c.qty, ...(c.note ? { note: c.note } : {}) }] : [];
      });
      const order: Order = {
        id: uid('o'),
        code: `A${String(data.orders.length + 1).padStart(3, '0')}`,
        customer: session?.name ?? 'Pelanggan',
        tableId,
        items,
        total: items.reduce((s, i) => s + i.price * i.qty, 0),
        payment,
        // QRIS dikonfirmasi pelanggan sebelum pesanan dikirim; kasir dibayar belakangan
        paid: payment === 'qris',
        status: 'baru',
        createdAt: Date.now(),
        seen: false,
      };
      setData((d) => {
        const summary = d.cart.map((c) => `${c.qty}x ${nameOf(d, c.menuId)}${c.note ? ` (${c.note})` : ''}`).join(', ');
        const menu = d.menu.map((m) => {
          const qty = d.cart.filter((c) => c.menuId === m.id).reduce((s, c) => s + c.qty, 0);
          return qty && m.stock !== null ? { ...m, stock: Math.max(0, m.stock - qty) } : m;
        });
        const tables = d.tables.map((t) =>
          t.id === tableId ? { ...t, status: 'terisi' as const, since: t.status === 'terisi' ? t.since : Date.now(), order: summary } : t,
        );
        return log(
          { ...d, menu, tables, cart: [], orders: [order, ...d.orders], lastSync: Date.now() },
          `pesanan #${order.code} ${tableId ? `Meja ${pad2(tableId)}` : 'takeaway'} (${payment === 'qris' ? 'QRIS' : 'bayar di kasir'}): ${summary}`,
          'MASUK',
          'info',
          order.customer,
        );
      });
      return order;
    },
    setOrderStatus: (id, status) =>
      setData((d) => ({ ...d, lastSync: Date.now(), orders: d.orders.map((o) => (o.id === id ? { ...o, status, seen: true } : o)) })),
    markOrderPaid: (id) =>
      setData((d) => {
        const o = d.orders.find((x) => x.id === id);
        return log(
          { ...d, orders: d.orders.map((x) => (x.id === id ? { ...x, paid: true } : x)) },
          `menerima pembayaran kasir #${o?.code ?? ''}`,
          'LUNAS',
          'success',
        );
      }),
    markOrdersSeen: () =>
      setData((d) => (d.orders.some((o) => !o.seen) ? { ...d, orders: d.orders.map((o) => (o.seen ? o : { ...o, seen: true })) } : d)),

    toggleReminder: (showId) =>
      setData((d) => ({
        ...d,
        reminders: d.reminders.includes(showId) ? d.reminders.filter((r) => r !== showId) : [...d.reminders, showId],
      })),
    toggleShowLive: (showId) =>
      setData((d) => ({ ...d, shows: d.shows.map((s) => (s.id === showId ? { ...s, hasLive: !s.hasLive } : s)) })),
    saveShow: (input) =>
      setData((d) =>
        log(
          { ...d, shows: [...d.shows.filter((s) => s.dayOffset !== input.dayOffset), { ...input, id: uid('s') }].sort((a, b) => a.dayOffset - b.dayOffset) },
          `menjadwalkan ${input.title},`,
          'TERKONFIRMASI',
          'success',
        ),
      ),
    updateStage: (patch) => setData((d) => ({ ...d, stage: { ...d.stage, ...patch } })),
  }), [data, now, session, isStaff, lastAddedId, loginAdmin]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp harus dipakai di dalam <AppProvider>');
  return ctx;
}

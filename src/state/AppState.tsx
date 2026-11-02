import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ActivityLog, AppData, CafeTable, MenuItem, Show, Stage, TableStatus } from '../data/types';
import { CAFE, createSeed } from '../data/seed';
import { pad2 } from '../lib/format';

const DATA_KEY = 'kopikala-data-v1';
const STAFF_KEY = 'kopikala-staff-v1';

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

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export type NewMenuInput = Omit<MenuItem, 'id' | 'sku' | 'createdAt'>;
export type NewShowInput = Omit<Show, 'id'>;

interface AppState {
  data: AppData;
  now: number;
  isStaff: boolean;
  lastAddedId: string | null;

  login: (pin: string) => boolean;
  logout: () => void;
  requestStaff: (onSuccess?: () => void) => void;
  pin: { open: boolean; close: () => void; succeed: () => void };

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

  addToCart: (menuId: string) => void;
  changeCart: (menuId: string, delta: number) => void;
  clearCart: () => void;
  placeOrder: (tableId: number | null) => void;

  toggleReminder: (showId: string) => void;
  toggleShowLive: (showId: string) => void;
  saveShow: (input: NewShowInput) => void;
  updateStage: (patch: Partial<Stage>) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load(DATA_KEY, () => createSeed()));
  const [isStaff, setIsStaff] = useState<boolean>(() => load(STAFF_KEY, () => false));
  const [now, setNow] = useState(Date.now());
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const pendingRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => save(DATA_KEY, data), [data]);
  useEffect(() => save(STAFF_KEY, isStaff), [isStaff]);

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

  const login = useCallback((pin: string) => {
    if (pin !== CAFE.demoPin) return false;
    setIsStaff(true);
    return true;
  }, []);

  const value = useMemo<AppState>(() => ({
    data,
    now,
    isStaff,
    lastAddedId,
    login,
    logout: () => setIsStaff(false),
    requestStaff: (onSuccess) => {
      if (isStaff) {
        onSuccess?.();
        return;
      }
      pendingRef.current = onSuccess;
      setPinOpen(true);
    },
    pin: {
      open: pinOpen,
      close: () => {
        pendingRef.current = undefined;
        setPinOpen(false);
      },
      succeed: () => {
        const cb = pendingRef.current;
        pendingRef.current = undefined;
        setPinOpen(false);
        cb?.();
      },
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

    addToCart: (menuId) =>
      setData((d) => {
        const line = d.cart.find((c) => c.menuId === menuId);
        return {
          ...d,
          cart: line ? d.cart.map((c) => (c.menuId === menuId ? { ...c, qty: c.qty + 1 } : c)) : [...d.cart, { menuId, qty: 1 }],
        };
      }),
    changeCart: (menuId, delta) =>
      setData((d) => ({
        ...d,
        cart: d.cart.map((c) => (c.menuId === menuId ? { ...c, qty: c.qty + delta } : c)).filter((c) => c.qty > 0),
      })),
    clearCart: () => setData((d) => ({ ...d, cart: [] })),
    placeOrder: (tableId) =>
      setData((d) => {
        const summary = d.cart.map((c) => `${c.qty}x ${nameOf(d, c.menuId)}`).join(', ');
        const menu = d.menu.map((m) => {
          const line = d.cart.find((c) => c.menuId === m.id);
          return line && m.stock !== null ? { ...m, stock: Math.max(0, m.stock - line.qty) } : m;
        });
        const tables = d.tables.map((t) =>
          t.id === tableId ? { ...t, status: 'terisi' as const, since: t.status === 'terisi' ? t.since : Date.now(), order: summary } : t,
        );
        return log(
          { ...d, menu, tables, cart: [], lastSync: Date.now() },
          `pesanan ${tableId ? `Meja ${pad2(tableId)}` : 'takeaway'}: ${summary}`,
          'MASUK',
          'info',
          'Pelanggan',
        );
      }),

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
  }), [data, now, isStaff, lastAddedId, pinOpen, login]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp harus dipakai di dalam <AppProvider>');
  return ctx;
}

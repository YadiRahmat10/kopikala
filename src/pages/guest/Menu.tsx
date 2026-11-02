import { useState } from "react";
import {
  IonContent,
  IonFooter,
  IonPage,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { useApp } from "../../state/AppState";
import { menuStatus, rupiah } from "../../lib/format";
import { GuestHeader } from "../../components/Headers";
import { CartModal } from "../../components/CartModal";
import { MenuNoteSheet } from "../../components/MenuNoteSheet";
import {
  ChipRow,
  EmptyState,
  Icon,
  Stepper,
  Switch,
  useToast,
} from "../../components/ui";
import type { Category, MenuItem } from "../../data/types";

const CATS: { key: string; label: string; match: Category[] }[] = [
  { key: "semua", label: "Semua", match: [] },
  { key: "kopi", label: "Kopi", match: ["Kopi"] },
  { key: "non", label: "Non-Kopi", match: ["Non-Kopi"] },
  { key: "makan", label: "Makanan & Pastry", match: ["Pastry", "Makanan"] },
  { key: "snack", label: "Snack", match: ["Camilan"] },
  { key: "musiman", label: "Musiman", match: ["Musiman"] },
];

function StockBadge({ m }: { m: MenuItem }) {
  const s = menuStatus(m);
  if (s === "habis")
    return (
      <span className="chip absolute left-3 top-3 bg-red-50/95 text-red-700">
        Habis Hari Ini
      </span>
    );
  if (s === "menipis")
    return (
      <span className="chip absolute left-3 top-3 bg-amber-50/95 text-amber-900">
        <Icon name="warning" size={14} />
        Sisa {m.stock} Porsi!
      </span>
    );
  return (
    <span className="chip absolute left-3 top-3 bg-emerald-50/95 text-emerald-800">
      Tersedia
    </span>
  );
}

const Menu: React.FC = () => {
  const { data, isStaff, refresh, changeStock, addToCart } =
    useApp();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("semua");
  const [showFilters, setShowFilters] = useState(true);
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [lowOnly, setLowOnly] = useState(false);
  const [staffEdit, setStaffEdit] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [picked, setPicked] = useState<MenuItem | null>(null);

  const editing = staffEdit && isStaff;
  const visible = data.menu.filter((m) => m.active);
  const match = CATS.find((c) => c.key === cat)!.match;
  const q = query.trim().toLowerCase();
  const list = visible
    .filter((m) => !match.length || match.includes(m.category))
    .filter(
      (m) =>
        !q ||
        `${m.name} ${m.description} ${m.category}`.toLowerCase().includes(q),
    )
    .filter((m) => !hideSoldOut || menuStatus(m) !== "habis")
    .filter((m) => !lowOnly || menuStatus(m) === "menipis")
    // Menu habis selalu di bawah
    .sort(
      (a, b) =>
        Number(menuStatus(a) === "habis") - Number(menuStatus(b) === "habis"),
    );

  const cartCount = data.cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = data.cart.reduce(
    (s, c) =>
      s + (data.menu.find((m) => m.id === c.menuId)?.price ?? 0) * c.qty,
    0,
  );
  const inCart = (id: string) =>
    data.cart
      .filter((c) => c.menuId === id)
      .reduce((s, c) => s + c.qty, 0);

  const resetFilters = () => {
    setQuery("");
    setCat("semua");
    setHideSoldOut(false);
    setLowOnly(false);
  };

  return (
    <IonPage>
      <GuestHeader />
      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            refresh();
            window.setTimeout(() => e.detail.complete(), 500);
          }}
        >
          <IonRefresherContent />
        </IonRefresher>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          {/* Banner akses barista (khusus admin) */}
          {isStaff && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary-container/80 p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon
                  name="tune"
                  size={22}
                  className="text-on-secondary-container"
                />
                <div className="min-w-0">
                  <p className="text-label-sm uppercase tracking-wider text-on-secondary-container">
                    Akses Barista
                  </p>
                  <p className="truncate text-body-sm text-primary">
                    Kelola porsi instan aktif dengan stepper (+ / -)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStaffEdit(!editing)}
                className={`flex min-h-[40px] shrink-0 items-center gap-1 rounded-full px-3.5 text-label-md font-bold transition-all active:scale-95 ${editing ? "bg-emerald-700 text-white" : "bg-primary text-on-primary"}`}
              >
                <Icon name={editing ? "check" : "bolt"} size={16} fill />
                {editing ? "Selesai" : "Staf Edit"}
              </button>
            </div>
          )}

          {/* Pencarian */}
          <div className="flex gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-xl bg-surface-container px-4">
              <Icon
                name="search"
                size={22}
                className="text-on-surface-variant"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kopi, pastry, camilan..."
                className="h-12 w-full bg-transparent text-body-md outline-none placeholder:text-on-surface-variant/70"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => setQuery("")}
                  className="text-on-surface-variant"
                >
                  <Icon name="close" size={18} />
                </button>
              )}
            </label>
            <button
              type="button"
              aria-label="Filter"
              onClick={() => setShowFilters((v) => !v)}
              className={`icon-btn h-12 w-12 rounded-xl ${showFilters ? "bg-primary-container text-on-primary" : "bg-surface-container text-primary"}`}
            >
              <Icon name="tune" size={22} />
            </button>
          </div>

          <div className="-mt-1 flex items-center justify-between text-label-md">
            <span className="flex items-center gap-1.5 font-semibold text-on-surface-variant">
              Stok diupdate live oleh Barista Kala
            </span>
            <span className="font-medium text-on-surface-variant">
              {list.length} Menu ditampilkan
            </span>
          </div>

          <ChipRow>
            {CATS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={`filter-chip ${cat === c.key ? "filter-chip-active" : ""}`}
              >
                {c.label}
                {c.key === "semua" && (
                  <span
                    className={`rounded-full px-1.5 text-label-sm ${cat === c.key ? "bg-white/20" : "bg-surface-container"}`}
                  >
                    {visible.length}
                  </span>
                )}
              </button>
            ))}
          </ChipRow>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <label className="flex items-center gap-2 text-label-md font-semibold text-primary">
                <Switch
                  label="Sembunyikan menu habis"
                  checked={hideSoldOut}
                  onChange={setHideSoldOut}
                />
                Sembunyikan menu habis
              </label>
              <button
                type="button"
                onClick={() => setLowOnly((v) => !v)}
                className={`flex h-10 items-center gap-1.5 rounded-full px-3.5 text-label-md font-bold shadow-sm ${lowOnly ? "bg-orange-600 text-white" : "bg-surface-container-lowest text-primary"}`}
              >
                <Icon name="local_fire_department" size={16} fill={lowOnly} />
                Stok Menipis Saja
              </button>
            </div>
          )}

          {list.length === 0 ? (
            <EmptyState
              icon="coffee_maker"
              title="Menu Belum Ditemukan"
              text="Coba kata kunci lain atau matikan filter stok untuk melihat semua pilihan seduhan kami."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-primary mt-2 px-6"
                >
                  Reset Semua Filter
                </button>
              }
            />
          ) : (
            list.map((m) => {
              const s = menuStatus(m);
              const habis = s === "habis";
              const qty = inCart(m.id);
              const maxed = m.stock !== null && qty >= m.stock;
              return (
                <article
                  key={m.id}
                  className={`overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm ${habis ? "opacity-70" : ""}`}
                >
                  <div className="relative aspect-[16/9] w-full bg-surface-container">
                    <img
                      src={m.image}
                      alt={m.name}
                      loading="lazy"
                      className={`h-full w-full object-cover ${habis ? "grayscale" : ""}`}
                    />
                    <StockBadge m={m} />
                    {qty > 0 && (
                      <span className="chip absolute right-3 top-3 bg-primary-container text-on-primary">
                        {qty} di pesanan
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-headline-sm ${habis ? "text-on-surface-variant" : "text-primary"}`}
                      >
                        {m.name}
                      </h3>
                      {m.tag && (
                        <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-body-sm text-on-surface-variant">
                      {m.description}
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-label-sm font-medium text-on-surface-variant">
                          Harga satuan
                        </p>
                        <p className="text-headline-sm text-primary">
                          {rupiah(m.price)}
                        </p>
                      </div>
                      {editing && m.stock !== null ? (
                        <Stepper
                          value={m.stock}
                          onChange={(d) => changeStock(m.id, d)}
                        />
                      ) : habis ? (
                        <span className="chip bg-surface-container text-on-surface-variant">
                          <Icon
                            name={m.soldOutNote ? "schedule" : "event_busy"}
                            size={14}
                          />
                          {m.soldOutNote ?? "Habis Terjual"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Tambah ${m.name}`}
                          disabled={maxed}
                          onClick={() => setPicked(m)}
                          className="icon-btn h-12 w-12 bg-primary-container text-on-primary shadow-md disabled:opacity-40"
                        >
                          <Icon name="add" size={24} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </IonContent>

      {cartCount > 0 && (
        <IonFooter className="kk-footer ion-no-border">
          <div className="px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex min-h-[56px] w-full items-center justify-between rounded-full bg-primary-container px-5 text-on-primary shadow-lg active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 text-label-lg">
                <span className="icon-btn h-8 w-8 bg-white/15">
                  <Icon name="shopping_bag" size={18} />
                </span>
                {cartCount} item • {rupiah(cartTotal)}
              </span>
              <span className="flex items-center gap-1 text-label-lg">
                Lihat Pesanan <Icon name="arrow_forward" size={18} />
              </span>
            </button>
          </div>
        </IonFooter>
      )}
      <CartModal isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MenuNoteSheet
        item={picked}
        maxQty={
          picked?.stock != null ? picked.stock - inCart(picked.id) : undefined
        }
        onClose={() => setPicked(null)}
        onSubmit={(qty, note) => {
          if (!picked) return;
          addToCart(picked.id, qty, note);
          toast(`${qty}x ${picked.name} ditambahkan`);
          setPicked(null);
        }}
      />
    </IonPage>
  );
};

export default Menu;

import { useRef, useState } from 'react';
import { IonContent, IonFooter, IonHeader, IonModal } from '@ionic/react';
import { useApp } from '../state/AppState';
import { IMG } from '../data/seed';
import { rupiah } from '../lib/format';
import type { Category, MenuItem, MenuTag } from '../data/types';
import { Icon, Stepper, Switch } from './ui';

const CATEGORIES: Category[] = ['Kopi', 'Non-Kopi', 'Pastry', 'Makanan', 'Camilan', 'Musiman'];
const TAGS: { tag: MenuTag; label: string; on: string }[] = [
  { tag: 'Signature', label: '★ Signature Kala', on: 'bg-primary text-on-primary' },
  { tag: 'Favorit', label: '♥ Favorit Tamu', on: 'bg-secondary text-white' },
  { tag: 'Musiman', label: '• Menu Musiman', on: 'bg-secondary-container text-on-secondary-container' },
];

const empty = () => ({
  image: '',
  name: '',
  category: 'Kopi' as Category,
  tag: undefined as MenuTag | undefined,
  price: '',
  hpp: '',
  limited: true,
  stock: 25,
  lowAt: 5,
  description: '',
  active: true,
  online: true,
});

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 9);
const grouped = (v: string) => (v ? new Intl.NumberFormat('id-ID').format(Number(v)) : '');

export function AddMenuModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addMenu } = useApp();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<MenuItem | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ReturnType<typeof empty>>(k: K, v: ReturnType<typeof empty>[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const price = Number(form.price || 0);
  const hpp = Number(form.hpp || 0);
  const margin = price > 0 && hpp > 0 ? Math.round(((price - hpp) / price) * 100) : null;

  const pickFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: 'Ukuran file melebihi 5 MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('image', String(reader.result));
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setForm(empty());
    setErrors({});
    setSaved(null);
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nama menu wajib diisi';
    if (!price) e.price = 'Harga jual wajib diisi';
    else if (hpp && hpp >= price) e.hpp = 'HPP harus lebih kecil dari harga jual';
    setErrors(e);
    if (Object.keys(e).length) {
      contentRef.current?.scrollToTop(300);
      return;
    }
    const isDrink = ['Kopi', 'Non-Kopi', 'Musiman'].includes(form.category);
    const item = addMenu({
      name: form.name.trim(),
      category: form.category,
      tag: form.tag,
      subtitle: form.tag === 'Signature' ? 'Signature KopiKala' : `${form.category} • Menu Baru`,
      description: form.description.trim() || `${form.name.trim()} racikan baru barista KopiKala.`,
      price,
      hpp: hpp || undefined,
      image: form.image || (isDrink ? IMG.dirtyMatcha : IMG.presetPastry),
      stock: form.limited ? form.stock : null,
      lowAt: form.lowAt,
      active: form.active,
      online: form.online,
    });
    setSaved(item);
    contentRef.current?.scrollToTop(300);
  };

  const label = (text: string, required = false) => (
    <span className="mb-2 block text-label-lg text-primary">
      {text} {required && <span className="text-red-600">*</span>}
    </span>
  );
  const err = (k: string) => errors[k] && <p className="mt-1 text-label-md text-red-700">{errors[k]}</p>;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => { onClose(); reset(); }} breakpoints={[0, 0.94]} initialBreakpoint={0.94} className="kk-sheet">
      <IonHeader className="ion-no-border">
        <div className="border-b border-white/60 bg-white/40 px-4 pb-3 pt-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow">Katalog Barista KopiKala</span>
                <span className="chip bg-secondary-container text-on-secondary-container">Aktif Langsung</span>
              </div>
              <h2 className="mt-1 text-headline-md text-primary">Tambah Menu Baru</h2>
              <p className="text-body-sm text-on-surface-variant">Item baru akan langsung tersedia di kasir POS dan QR menu pelanggan</p>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} className="icon-btn h-10 w-10 bg-surface-container text-on-surface-variant">
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>
      </IonHeader>

      <IonContent ref={contentRef}>
        <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
          {saved && (
            <div className="flex gap-3 rounded-2xl bg-[#1f4d36] p-4 text-white shadow-lg">
              <div className="icon-btn h-10 w-10 border-2 border-emerald-300/60 text-emerald-300">
                <Icon name="check_circle" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-label-lg text-emerald-200">Menu Berhasil Disimpan &amp; Dipublikasikan! 🎉</p>
                  <button type="button" aria-label="Tutup notifikasi" onClick={() => setSaved(null)} className="icon-btn h-7 w-7 bg-white/10">
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <p className="mt-1 text-body-sm text-white/90">
                  <b>'{saved.name}'</b> {saved.active ? 'kini aktif di kasir POS & QR menu pelanggan' : 'disimpan sebagai draf (belum tampil di QR menu)'}
                  {saved.stock !== null && <> (<b className="text-emerald-300">Stok: {saved.stock} Porsi</b>)</>}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={onClose} className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-label-md font-bold">
                    <Icon name="visibility" size={16} /> Lihat di Daftar
                  </button>
                  <button type="button" onClick={reset} className="h-9 rounded-full bg-white/10 px-3.5 text-label-md">
                    Daftar Baru Lainnya
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Foto */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-label-lg text-primary">Foto Menu Minuman / Pastry</span>
              <span className="text-label-md text-secondary">Rasio 1:1 / 16:9</span>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
            {form.image ? (
              <div className="relative overflow-hidden rounded-2xl">
                <img src={form.image} alt="Pratinjau" className="aspect-[16/9] w-full object-cover" />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className="chip bg-white/95 py-2 text-primary shadow">
                    <Icon name="photo_camera" size={14} /> Ganti
                  </button>
                  <button type="button" onClick={() => set('image', '')} className="chip bg-white/95 py-2 text-red-700 shadow">
                    <Icon name="delete" size={14} /> Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low p-4 text-center">
                <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2">
                  <span className="icon-btn h-14 w-14 bg-secondary-container text-on-secondary-container">
                    <Icon name="add_a_photo" size={26} />
                  </span>
                  <span className="text-label-lg text-primary">Unggah Foto Menu (JPG / PNG / WEBP)</span>
                  <span className="text-label-md font-medium text-on-surface-variant">Maksimal ukuran file 5 MB</span>
                </button>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-label-md font-medium text-on-surface-variant">Preset Sampel:</span>
                  <button type="button" onClick={() => set('image', IMG.presetLatte)} className="rounded-full bg-surface-container px-3 py-1.5 text-label-md">☕ Espresso / Latte</button>
                  <button type="button" onClick={() => set('image', IMG.presetPastry)} className="rounded-full bg-surface-container px-3 py-1.5 text-label-md">🥐 Pastry &amp; Bakery</button>
                </div>
              </div>
            )}
            {err('image')}
          </div>

          <label className="block">
            {label('Nama Menu', true)}
            <input className={`input ${errors.name ? 'ring-2 ring-red-400' : ''}`} value={form.name} maxLength={40} placeholder="mis. Dirty Matcha Cold Foam" onChange={(e) => set('name', e.target.value)} />
            {err('name')}
          </label>

          <div>
            {label('Kategori Menu', true)}
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('category', c)}
                  className={`h-12 rounded-xl text-body-md font-medium transition-all active:scale-95 ${form.category === c ? 'bg-primary font-bold text-on-primary' : 'bg-surface-container text-on-surface'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => set('tag', form.tag === t.tag ? undefined : t.tag)}
                  className={`rounded-full px-3 py-1.5 text-label-md font-bold transition-colors ${form.tag === t.tag ? t.on : 'bg-surface-container text-on-surface-variant'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Harga */}
          <div className="rounded-2xl bg-surface-container-low p-3">
            <div className="grid grid-cols-2 gap-3">
              {([['price', 'Harga Jual (Rp)', true], ['hpp', 'Estimasi HPP (Rp)', false]] as const).map(([k, text, req]) => (
                <label key={k} className="block">
                  {label(text, req)}
                  <div className={`flex items-center gap-2 rounded-xl bg-white px-3 ${errors[k] ? 'ring-2 ring-red-400' : ''}`}>
                    <span className="text-body-sm text-on-surface-variant">Rp</span>
                    <input
                      inputMode="numeric"
                      value={grouped(form[k])}
                      placeholder="0"
                      onChange={(e) => set(k, digits(e.target.value))}
                      className="h-12 w-full min-w-0 bg-transparent text-headline-sm outline-none placeholder:text-outline-variant"
                    />
                  </div>
                </label>
              ))}
            </div>
            {err('price')}
            {err('hpp')}
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-container px-3 py-2 text-label-md">
              <span className="flex items-center gap-1 font-semibold text-on-surface-variant">
                <Icon name="trending_up" size={16} /> Estimasi Margin Keuntungan:
              </span>
              <span className={`font-bold ${margin !== null && margin < 30 ? 'text-orange-700' : 'text-emerald-700'}`}>
                {margin === null ? '—' : `~${margin}% (Laba ${rupiah(price - hpp)})`}
              </span>
            </div>
          </div>

          {/* Kuota */}
          <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-label-lg text-primary">Batasi Kuota Porsi Harian</p>
                <p className="text-label-md font-medium text-on-surface-variant">Otomatis ubah status ke 'Habis' saat stok 0</p>
              </div>
              <Switch label="Batasi kuota porsi" checked={form.limited} onChange={(v) => set('limited', v)} />
            </div>
            {form.limited && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="mb-2 text-label-md text-on-surface-variant">Jumlah Porsi Awal</p>
                  <Stepper value={form.stock} min={1} max={999} onChange={(d) => {
                      const stock = Math.max(1, form.stock + d * 5);
                      setForm((f) => ({ ...f, stock, lowAt: Math.min(f.lowAt, Math.max(1, stock - 1)) }));
                    }} />
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="mb-2 text-label-md text-on-surface-variant">Peringatan Menipis</p>
                  <div className="flex items-center gap-1">
                    <Icon name="warning" size={16} className="text-orange-600" />
                    <Stepper size="sm" value={form.lowAt} min={1} max={Math.max(1, form.stock - 1)} onChange={(d) => set('lowAt', form.lowAt + d)} />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-orange-700">Sisa {form.lowAt} Porsi</p>
                </div>
              </div>
            )}
          </div>

          <label className="block">
            {label('Deskripsi & Cita Rasa')}
            <textarea
              rows={3}
              maxLength={160}
              value={form.description}
              placeholder="mis. Perpaduan matcha Uji premium dengan signature cold foam lembut..."
              onChange={(e) => set('description', e.target.value)}
              className="input resize-none"
            />
            <span className="mt-1 block text-right text-label-sm text-on-surface-variant">{form.description.length}/160</span>
          </label>

          <div className="flex flex-col divide-y divide-surface-container rounded-2xl bg-surface-container-low px-3">
            {([
              ['active', 'Tampilkan Langsung di Menu QR Pelanggan', 'Pelanggan meja dapat langsung memesan'],
              ['online', 'Tersedia untuk Pesanan Online / Takeaway', 'Buka kuota untuk kasir takeaway & kurir'],
            ] as const).map(([k, title, sub]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-label-lg text-primary">{title}</p>
                  <p className="text-label-md font-medium text-on-surface-variant">{sub}</p>
                </div>
                <Switch label={title} checked={form[k]} onChange={(v) => set(k, v)} />
              </div>
            ))}
          </div>
        </div>
      </IonContent>

      <IonFooter className="ion-no-border">
        <div className="flex gap-2 border-t border-white/60 bg-white/40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={onClose} className="btn-soft shrink-0 px-5">Batal</button>
          <button type="button" onClick={submit} className="btn-primary flex-1 whitespace-nowrap">
            <Icon name="check_circle" size={20} />
            Simpan &amp; Publikasikan
          </button>
        </div>
      </IonFooter>
    </IonModal>
  );
}

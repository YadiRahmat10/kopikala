# KopiKala — Aplikasi Mobile (Ionic React)

Implementasi desain dari folder `../stitch_coffe` menggunakan **Ionic React 8 + React Router 5 + Vite + Tailwind CSS**, siap dibungkus menjadi aplikasi Android/iOS dengan **Capacitor**.

## Menjalankan

```bash
npm install
npm run dev        # buka http://localhost:5173 (gunakan mode perangkat mobile di DevTools)
npm run build      # typecheck + build produksi ke folder dist/
```

## Build Android / iOS

```bash
npm run build
npx cap add android     # sekali saja (butuh Android Studio)
npx cap sync
npx cap open android
# iOS: npm i @capacitor/ios && npx cap add ios && npx cap open ios  (butuh Xcode)
```

## Alur Aplikasi

| Mode | Tab | Layar stitch |
|---|---|---|
| Tamu | Beranda | `beranda_ringkasan_live` |
| Tamu | Meja | `daftar_denah_meja` |
| Tamu | Menu | `menu_stok_real_time` |
| Tamu | Live Music | `jadwal_live_music` |
| — | Tombol **Mode Staf** → PIN (demo **1234**) | modal PIN di `beranda_ringkasan_live` |
| Staf | Ringkasan | `portal_khusus_staf_kopikala` |
| Staf | Kelola Meja | denah meja + aksi Set Kosong/Terisi/Reservasi |
| Staf | Stok & Menu | `kelola_stok_menu_staf`, `form_tambah_menu_baru_modal_terbuka`, `sukses_tambah_menu_toast_notifikasi`, `daftar_stok_menu_dirty_matcha_aktif` |
| Staf | Live Music | kontrol panggung & jadwal |
| Tamu | Notifikasi menu baru | `notifikasi_menu_baru_pelanggan_dirty_matcha` |

Semua perubahan staf (status meja, stok, menu baru, jadwal musik) langsung tercermin di sisi tamu. Data disimpan di `localStorage` (lihat `src/state/AppState.tsx`) — ganti dengan API/backend sungguhan untuk sinkronisasi antar-perangkat.

## Struktur

```
src/
  data/        tipe & data awal (meja, menu, jadwal)
  state/       AppState (context global + persistensi)
  lib/         helper format (Rupiah, waktu, status)
  components/  Header, PinModal, AddMenuModal, CartModal, NewMenuModal, UI dasar
  pages/guest  Beranda, Menu, Live Music
  pages/staff  Ringkasan, Stok & Menu, Live Music staf
  pages/shared Denah meja (tamu & staf)
  tabs/        Tab bar tamu & staf
  theme/       global.css (token desain dari DESIGN.md)
```

Catatan: foto menu/musisi memakai URL gambar dari ekspor Stitch (butuh internet). Font Plus Jakarta Sans & ikon Material Symbols sudah dibundel lokal.

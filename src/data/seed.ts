import type { AppData, CafeTable, MenuItem, Show } from './types';

const G = 'https://lh3.googleusercontent.com/aida-public/';

export const IMG = {
  avatar: G + 'AB6AXuA1R-APmB7A23BeC0KhRYV5ikRYwlcS9SyWGqWFpaDgPCsVyMqVM3T86QVw5YcL_z6S8de7N3acyyhHVy12mR8Brj8M1UvGSNWV1owQlsEDOu93tI5nFAVdaKQY2s0UeHlvmJiE9sp1tFk_Aw9kNvtIQ5h-8DR6Iq7pATWSPfXpWdCqNtvC_p58D813_j6wFPjT6R_XSeVMu8WEaBCGRsX5DdKhRAif8xmMQ4E0fwA',
  bandSmall: G + 'AB6AXuBkmh-PKjFwgUvY-vwJEV9OoHbUByA7mtH7LjUI25Rn003NILGJBHvKnLUrI9MgBHfnj4naLpUpUWGBsDk-pC9mf1BeMA8x-L2dOjwdpvyindtV7FP-sABN62BEV6JRLx4Xm0AdSZSLfxTeqgXhXV8YHvYOCOKmdyDZv5AQIGjRkbx7tLyuAqa_jtZpKpiZpI0LvcmD1_F2A_qdBZrnrVLhMZ1E-DVUPQrgXevPMtk',
  bandHero: G + 'AB6AXuARvtQcZhTmSrMXnFTmsZD-7JM6ysEsg3WfC62eS7I_IIDnJoJmAfbqJnTNjzf9nW20DCIsZ0erSFFrUUkib-b4F5fw_1Np1luBcJGCgmKF-IH0OcRzHV_asrPcCa3LS3DjTP9ARvxaihrDi14CYAGAsfDS1-PkvZ2BGOJG1xBxByGhK8tRyqNtIIq5OHLtDVIKGKeAqp8VWLTgi_2jTAtZjgSNzNc55aCSrcE3Fvs',
  bandStage: G + 'AB6AXuDmTSaF6zMgxsaiV4_425L13cOGJKILOxg-VaU9Fq8PyIJm14nbMM5GEmzfkPkzUWto2Fb9WKnMBuSDXDKmTS7_kp6Pa5HHz-ECF-y4l5wDgTXpXUdLl0bX1ER-rvhVk5vB2N9xdhXWNpDGmEO4S-p2Zxq8fgEaIWmYlyiJxT1fu4HEg1_wSOFnBqcG7xjBXw97yxm9EU_2wcH0n8K43TNKhb9FcX2C3G_g7zvR0X0',
  kopiAren: G + 'AB6AXuDpqOJUQhtU5EPQ5vmTpErD7if4oncT_tCkLCx4g4smYGcgZzkDV5HcEFlNCuO5yFHoJQlyWeCkVtq9qMMSU5mrrE_a1IkEOWt6NbQPTFMc1fufU6vMSo28npAw-sF6xhKTDR821CNveP6Jz1o0en6APLTYECItsx74whMxA3de715AWe-k1Nv0foHjuLBsi5iV2xZF4OdREfiZjUGwiK82V8eMOslGJ61I72UBRMM',
  pistachio: G + 'AB6AXuCxDd59jw_OJant-FRGBsHX-sbylr9dgHBZZ_hqYsm1Hyk9Zjepl5L7VNAb6eeo9hKm2eo6HWuq9c-3mp8w3pFxRi89_8FXqzZPN3rEuTw_l9i6zKGFCw2eRn1QRwSpp0BdoP4kKmhga-ROXFXkiBX8l7DJhDblpdinyoa6hYvc40hFqqCve8iNpcYZarX16dV4aYD2H2ltCKM73eqNdmi_QmsSplhA9osl3GzQMMo',
  v60: G + 'AB6AXuDKOJxn6MlrFANwLn54LMOsTbCcqr1dKob8ePeHsSLSiF6E3T3pD9368e2tu5VVfgj3Bj4fw6M6_rNJK19jl6Ni2zsqxFCXzaVTLUOHRHebgiyveGFUMPrxGOdTEzmyxehZAMkgSTZmZfmIlde8EqYf6qi1tumzbbcowX5V1wrdev0_--eZgqp6jU_evFRIrw3JXxb0aux210MKlUp8d7UKDXoWntBRsZQAaWHXfcc',
  fries: G + 'AB6AXuAqRkAOiZdIpwXXWWuEvPmyTN6Um0-ytj6F1bkQi1jvseXROsqbyW3kudjgArsHuUCsWbFy5Ciau1g7VuozQaOJyE6xjLWcM6yjKn9LviYvWpIp2Z-wjCUDMBDypreYhL34UAPKA3mIMhQxgboE9rHwbXwTynuhg0tOUMiOUaNS1ScRBZsOOJFbZy3feJEi3MOeojdG_4YI40qynXppA5FyT99ADbuiP6Ywo9xEBG0',
  croissant: G + 'AB6AXuCLA0joJgTf87Jecp6lbmEzXep2cUf0d9v_txj_b6N8AbRR2xrOCKeCVi2B-XIuQc6bsG0dfNx3v4xSDm_0JbNJu4cmighKCz5m3E6w9s9omC4e1StoJtbJ1m4qcLNLo0EH6fvjAbT0-a6yqLpWjx6kyrE4lyTHJjpXsHBlwFHJC3d_79KGW-5qQSDYw9cD6MOuoHYH2QNE9aCMLichNoAljl2iLdcRmBVGD5Ixrlw',
  cheesecake: G + 'AB6AXuAJBsmTnwfE5o4ZyJhNFpCDdN77Zu8p-oQGHHV-6lWUgoH4-JQlDReXQGeUVQ1-jWgB8o8hHMHZmCUOeAc9PIYiJgpcuyknFhdVpIiOJKb9sgb8qY1wR6lQwOEXTcJLbpxbnIKBbUadv8UVwiewPfeaKjCCg6PbwRsUxOqtp2EkZd6fGOuLDSa5YJwKxDYhMb7yd5s1K83GmRKJ80Z4CaG-3GVWASh_f3kfjMbI7UU',
  matcha: G + 'AB6AXuCJevKjMVSiRZ6k367hjCZC1D18RiUTQ-GuacGeJ6xlt1MV0L0h5G53LYKuK_a1UDtFgjyGChaZQdkokXhe60S2dwqlWG6c4hX4q4V9Q8A0g29e7zSSewemS6JhqSDQ_cwvGj6foapopAVRgHnFmq1j0wjJNhV-fmuHUILdoCaGUTWtRaMlSc4wH1eHEcPv8-6izPig-XXkln0Ryk8n6Jl6adTSh2_xhZvw7_1kacA',
  dirtyMatcha: G + 'AB6AXuCen6mKWv3y62KGyyCDxUmM4kMMuUsdfyvKWvJ2TTGGzGO27V1IeFDvK84IEq9G9ApU6dW8GD7jWmgH-q8AZLmYth4lhyZn07Ie-M1h8DIhzzWYqVHcVrbUyREiMEBlymucNhc8mUBiousDxNMgAele2S0TXZh9RxbYYfAOl6yCJIX4H1pu-SweKl6uZWO9iwd3zrIc-E_QtLo0zYPNA4PYSKIHTzORSxJJyz0AoBA',
  presetLatte: G + 'AB6AXuAzKfBCmwyUMDbO796fZQ4xhGxmlL_ODxO170cXBLSWp_K2sFbOh8dfzxc9_mydyt-bx9tzkqXRsfXrLcf7DFcDJ1oim6nnX3NNZKxJMqpMiT3EkK8Aakerd5w5JaHZ82PMXhi2sQAG4WTvYlKRr7DkBeyi9l8_e7Oq4mowRzhNH6yCELjs6P5PD4h7zoeC-DF20slbOc4bHaYKGYIL91CUNvkgnxhNPkBjfjVFXAY',
  presetPastry: G + 'AB6AXuC9FcFgj9nxKUvdxZRjnkjLZHp9lMj2UEfuGrrBfFpb-40Nje7siWXGhppOwMmK5lXuGsyTSaWFDcEyLfKW5S3lsx9FtZ51-huFgPPgVKFj6WHGh1EJEFTdY4vdoLeSYrPbBs_lWRzwKWmJgpS_98zGppBsNkUXHH0AaKxn93tCqs8nTYr0lVVYeYlxJdTsom35gYgz72jEgPF-Sn9DGY0A_dWUnVUe6QIvP01kF4Y',
};

export const CAFE = {
  name: 'KopiKala',
  address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.+Senopati+No.+42+Kebayoran+Baru+Jakarta+Selatan',
  open: 8,
  close: 23,
  staffName: 'Barista Dimas',
  shift: 'Shift Sore',
  shiftHours: '15.00 - 23.00 WIB',
  demoPin: '1234',
};

const min = 60_000;

function seedTables(now: number): CafeTable[] {
  const t = (
    id: number, area: CafeTable['area'], zone: string, seats: number, seatLabel: string, icon: string,
    feature: string, status: CafeTable['status'], extra: Partial<CafeTable> = {},
  ): CafeTable => ({ id, area, zone, seats, seatLabel, icon, feature, status, ...extra });

  return [
    t(1, 'Indoor', 'Indoor Non-Smoking', 2, '2 Kursi', 'person', 'Dekat Stopkontak & AC Dingin', 'kosong'),
    t(2, 'Indoor', 'Indoor Utama', 4, '4 Kursi', 'groups', 'Dekat Jendela Besar', 'terisi', { since: now - 75 * min, order: '2x Aren Latte, 1x Croissant' }),
    t(3, 'Indoor', 'Indoor Non-Smoking', 4, '4 Kursi', 'groups', 'Meja Kayu Panjang', 'kosong'),
    t(4, 'Outdoor', 'Outdoor Taman', 2, '2 Kursi', 'person', 'View Taman & Kolam', 'kosong'),
    t(5, 'Outdoor', 'Outdoor Teras', 6, '6 Kursi', 'diversity_3', 'Dekat Panggung Live Music', 'dipesan', { reservedFor: 'Ibu Cindy (6 Pax)', reservedAt: '19.00' }),
    t(6, 'Indoor', 'Indoor Lounge', 6, '6 Kursi Sofa', 'chair', 'Sofa Empuk & Stopkontak', 'terisi', { since: now - 60 * min }),
    t(7, 'Indoor', 'Indoor Bar', 1, '1 Kursi Bar', 'countertops', 'Power Outlet ✅', 'kosong'),
    t(8, 'Smoking', 'Semi-Outdoor Smoking', 4, '4 Kursi', 'smoking_rooms', 'Area Merokok Berventilasi', 'kotor', { since: now - 5 * min }),
    t(9, 'Indoor', 'Indoor Non-Smoking', 2, '2 Kursi', 'person', 'Dekat Stopkontak', 'kosong'),
    t(10, 'Indoor', 'Indoor Utama', 4, '4 Kursi', 'groups', 'Dekat Bar Espresso', 'terisi', { since: now - 20 * min }),
    t(11, 'Indoor', 'Indoor Bar', 1, '1 Kursi Bar', 'countertops', 'Power Outlet ✅', 'kosong'),
    t(12, 'Outdoor', 'Outdoor Taman', 4, '4 Kursi', 'groups', 'Di Bawah Pohon Rindang', 'kosong'),
    t(13, 'Outdoor', 'Outdoor Teras', 2, '2 Kursi', 'person', 'Dekat Panggung', 'terisi', { since: now - 35 * min }),
    t(14, 'Outdoor', 'Outdoor Taman', 4, '4 Kursi', 'groups', 'Lampu Gantung Hangat', 'kosong'),
    t(15, 'Smoking', 'Semi-Outdoor Smoking', 2, '2 Kursi', 'smoking_rooms', 'Area Merokok Berventilasi', 'terisi', { since: now - 10 * min }),
  ];
}

function seedMenu(now: number): MenuItem[] {
  const base = { online: true, active: true, createdAt: now - 30 * 24 * 60 * min };
  return [
    { ...base, id: 'm-aren', sku: 'SKU-001', name: 'Kopi Susu Kala Aren', category: 'Kopi', subtitle: 'Signature KopiKala', tag: 'Signature', description: 'Espresso house blend, gula aren organik, fresh milk dingin berkrim lembut.', price: 25000, hpp: 9000, image: IMG.kopiAren, stock: null, lowAt: 5 },
    { ...base, id: 'm-pistachio', sku: 'SKU-204', name: 'Pistachio Oat Latte', category: 'Kopi', subtitle: 'Sirup artisanal pistachio menipis', tag: 'Musiman', description: 'Espresso murni, pasta pistachio panggang khas Italia, oat milk lembut.', price: 38000, hpp: 15000, image: IMG.pistachio, stock: 3, lowAt: 5 },
    { ...base, id: 'm-v60', sku: 'SKU-010', name: 'Manual Brew V60', category: 'Kopi', subtitle: 'Single Origin Aceh Gayo', tag: 'Single Origin', description: 'Biji Aceh Gayo Wine anaerob, karakter rasa anggur merah, kismis, manis plum seimbang.', price: 35000, hpp: 12000, image: IMG.v60, stock: 18, lowAt: 5 },
    { ...base, id: 'm-matcha', sku: 'SKU-101', name: 'Matcha Oat Latte', category: 'Non-Kopi', subtitle: 'Artisan Blend', description: 'Matcha Uji premium dikocok halus dengan oat milk creamy dan sedikit madu.', price: 34000, hpp: 12000, image: IMG.matcha, stock: 12, lowAt: 5 },
    { ...base, id: 'm-fries', sku: 'SKU-301', name: 'Truffle French Fries', category: 'Camilan', subtitle: 'Batch kentang terakhir dapur', tag: 'Favorit', description: 'Kentang shoestring renyah dengan aroma minyak truffle putih & taburan keju parmesan.', price: 28000, hpp: 10000, image: IMG.fries, stock: 2, lowAt: 5 },
    { ...base, id: 'm-croissant', sku: 'SKU-112', name: 'Croissant Butter Almond', category: 'Pastry', subtitle: 'Batch pagi telah ludes terjual', description: 'Lapis pastry butter Prancis gurih dengan isian krim almond manis lembut.', price: 32000, hpp: 13000, image: IMG.croissant, stock: 0, lowAt: 3, soldOutNote: 'Restock Besok 08.00' },
    { ...base, id: 'm-basque', sku: 'SKU-115', name: 'Basque Burnt Cheesecake', category: 'Pastry', subtitle: 'Cheesecake khas Spanyol', description: 'Cheesecake karamel khas Spanyol dengan tekstur leleh lembut di tengah dan rasa gurih manis.', price: 36000, hpp: 14000, image: IMG.cheesecake, stock: 0, lowAt: 3 },
  ];
}

function seedShows(): Show[] {
  return [
    { id: 's-senja', dayOffset: 0, title: 'Senja Akustik Trio', genre: 'Pop Akustik, Folk & Classic Hits', icon: 'music_note', hasLive: true, start: '19.30', end: '22.00', sessions: ['19.30', '21.00'], location: 'Panggung Utama Area Outdoor Belakang (Dekat Kolam Air Terjun)', image: IMG.bandHero },
    { id: 's-jazz', dayOffset: 1, title: 'The Beans Jazz Quartet', genre: 'Smooth Jazz, Bossa Nova & Chill Classics', icon: 'piano', hasLive: true, start: '19.30', end: '22.30', location: 'Area Bar Espresso' },
    { id: 's-sunset', dayOffset: 2, title: 'Sunset Chill with Nadin & Friends', genre: 'Indie Pop, Folk Sentimental Sore Hari', icon: 'queue_music', hasLive: true, start: '16.00', end: '19.00', timeNote: 'Sunset Session', location: 'Rooftop Garden' },
    { id: 's-rest1', dayOffset: 3, title: 'Hari Istirahat Musik', genre: 'Playlist Cafe Cozy curated by Barista KopiKala', icon: 'headset', hasLive: false },
    { id: 's-rest2', dayOffset: 4, title: 'Hari Istirahat Musik', genre: 'Lo-Fi Study Beats untuk WFC & diskusi tenang', icon: 'menu_book', hasLive: false },
    { id: 's-openmic', dayOffset: 5, title: 'Open Mic Acoustic Night', genre: 'Patron jamming session & komunitas musik lokal', icon: 'mic', hasLive: true, start: '19.00', end: '21.30', location: 'Panggung Utama Outdoor' },
    { id: 's-pop', dayOffset: 6, title: 'Playlist Pop Sunset', genre: 'Pilihan lagu hits hangat penutup hari kerja', icon: 'graphic_eq', hasLive: false },
  ];
}

export function createSeed(now = Date.now()): AppData {
  return {
    tables: seedTables(now),
    menu: seedMenu(now),
    shows: seedShows(),
    logs: [
      { id: 'l1', who: 'Barista Dimas', text: 'menandai Meja 04 menjadi', highlight: 'KOSONG', tone: 'success', at: now - 8 * min },
      { id: 'l2', who: 'Kitchen (Kiki)', text: 'menandai Basque Cheesecake', highlight: 'HABIS', tone: 'danger', at: now - 20 * min },
      { id: 'l3', who: 'Supervisor Maya', text: 'mengonfirmasi soundcheck Senja Akustik', highlight: 'OK', tone: 'success', at: now - 95 * min },
    ],
    stage: { artistArrived: true, soundcheck: true, micReady: true, songRequests: 14, masterLevel: 70 },
    reminders: [],
    savedTable: null,
    announcements: [],
    cart: [],
    lastSync: now - 2 * min,
  };
}

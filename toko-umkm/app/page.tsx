'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react';
import Navbar from '../components/Navbar';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  unit?: string | null;
  category: string;
  image_url?: string | null;
}

const CUSTOM_IMAGES: Record<string, string> = {
  'Sosis Bakar': '/images/sosis bakar.jpg',
  'Otak-otak Singapore': '/images/otak-otak singapore.jpeg',
  'Fish Roll': '/images/fish roll.jpg',
  'Dumpling Cheese': '/images/dumpling cheese.jpg',
  'Dumpling Chicken': '/images/dumpling chicken.webp',
  'Duo Twister': '/images/duo twister.jpg',
  'Nugget': '/images/nugget.jpg',
  'Chikua': '/images/chikua.jpg',
  'Bakso': '/images/bakso.jpg',
  'Sosis Goreng': '/images/sosis goreng.jpg',
  'Kentang Goreng': '/images/kentang goreng.jpg',
  'Rich Velvet': '/images/rich velvet.jpg',
  'TaroOndi': '/images/taro.jpg',
  'Greentea Ever': '/images/greentea.jpg',
  'RICH Chocolate': '/images/chocolate.jpg',
  'Hazelnut Crush': '/images/hazelnut.jpg',
};

const HERO_ITEMS = {
  sosis: {
    name: 'Sosis Bakar',
    tag: 'Best Seller • 13k',
    local: '/images/sosis bakar.jpg',
    fallback:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  },
  velvet: {
    name: 'Rich Velvet',
    tag: 'R: 10k | L: 15k',
    local: '/images/rich velvet.jpg',
    fallback:
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
  },
  greentea: {
    name: 'Greentea Ever',
    tag: 'R: 10k | L: 15k',
    local: '/images/greentea.jpg',
    fallback:
      'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80',
  },
  otak: {
    name: 'Otak-otak Singapore',
    tag: 'Favorit • 13k',
    local: '/images/otak-otak singapore.jpeg',
    fallback:
      'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
  },
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [heroFallback, setHeroFallback] = useState<Record<string, boolean>>({});
  const [cardFailedCustom, setCardFailedCustom] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list: Product[] = Array.isArray(data) ? data : data.products ?? [];
        const foods = list.filter((p) => p.category === 'Makanan').slice(0, 2);
        const drinks = list.filter((p) => p.category === 'Minuman').slice(0, 2);
        setFeatured([...foods, ...drinks]);
      })
      .catch(() => {});
  }, []);

  const renderHeroCard = (
    item: (typeof HERO_ITEMS)['sosis'],
    aspectClass: string
  ) => {
    const src = heroFallback[item.name] ? item.fallback : item.local;
    return (
      <Link
        href="/katalog"
        className="group block rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-md transition"
      >
        <div className={`${aspectClass} overflow-hidden bg-stone-100`}>
          <img
            src={src}
            alt={item.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            onError={() =>
              setHeroFallback((prev) => ({
                ...prev,
                [item.name]: true,
              }))
            }
          />
        </div>
        <div className="p-3 bg-white flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-stone-900 truncate">
            {item.name}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
            {item.tag}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-stone-50 to-stone-50 border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Kiri: Teks Utama */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                100% HALAL • NATAMA TASTE
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.12]">
                Jajanan Bakar Hangat &amp; Minuman Segar Favoritmu
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                Nikmati Sosis Bakar, Otak-otak Singapore, aneka Dumpling mulai
                Rp 10.000, hingga minuman creamy &amp; yakult segar ukuran Regular
                (10k) dan Large (15k).
              </p>

              {/* Tombol CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/katalog"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold shadow-sm hover:bg-stone-800 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Lihat Semua Menu
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/lacak-pesanan"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm font-semibold hover:bg-stone-100 transition"
                >
                  <Search className="w-4 h-4" />
                  Lacak Pesanan
                </Link>
              </div>

              {/* Keunggulan Singkat */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200/80 max-w-md">
                <div>
                  <p className="text-xl font-bold text-stone-900">26+</p>
                  <p className="text-xs text-stone-600">Pilihan Menu</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-stone-900">Rp 10k</p>
                  <p className="text-xs text-stone-600">Harga Terjangkau</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700">Halal</p>
                  <p className="text-xs text-stone-600">Segar Setiap Hari</p>
                </div>
              </div>
            </div>

            {/* Kanan: Bento Grid (Makanan 4:3, Minuman 4:5 agar tidak terpotong) */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="space-y-4">
                  {renderHeroCard(HERO_ITEMS.sosis, 'aspect-[4/3]')}
                  {renderHeroCard(HERO_ITEMS.velvet, 'aspect-[4/5]')}
                </div>
                <div className="space-y-4">
                  {renderHeroCard(HERO_ITEMS.greentea, 'aspect-[4/5]')}
                  {renderHeroCard(HERO_ITEMS.otak, 'aspect-[4/3]')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KATEGORI MENU */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/katalog"
            className="group rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 flex items-start justify-between gap-4 hover:border-amber-400 hover:shadow-md transition"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold mb-3">
                <Utensils className="w-3.5 h-3.5" />
                14 Menu Makanan
              </span>
              <h2 className="text-xl font-bold text-stone-900 group-hover:text-amber-800 transition">
                Sosis Bakar, Otak-otak &amp; Aneka Dumpling
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Paket hemat isi 4, 6, sampai 12 pcs hanya Rp 10.000. Sosis Bakar &amp;
                Otak-otak Singapore Rp 13.000.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
          </Link>

          <Link
            href="/katalog"
            className="group rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 flex items-start justify-between gap-4 hover:border-sky-400 hover:shadow-md transition"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs font-semibold mb-3">
                <Coffee className="w-3.5 h-3.5" />
                12 Menu Minuman
              </span>
              <h2 className="text-xl font-bold text-stone-900 group-hover:text-sky-800 transition">
                Minuman Creamy, Yakult &amp; Teh Segar
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Rich Velvet, TaroOndi, Greentea Ever, Strawberry/Orange Yakult,
                hingga Lychee Tea. Regular 10k • Large 15k.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700 shrink-0">
              <Coffee className="w-6 h-6" />
            </div>
          </Link>
        </div>
      </section>

      {/* PREVIEW MENU PILIHAN DARI DATABASE */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                Rekomendasi Hari Ini
              </p>
              <h2 className="text-2xl font-bold text-stone-900 mt-1">
                Menu Favorit Natama Taste
              </h2>
            </div>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-900 hover:text-amber-700"
            >
              Lihat semua
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((item) => {
              const customSrc = CUSTOM_IMAGES[item.name];
              const imgSrc =
                customSrc && !cardFailedCustom[item.id]
                  ? customSrc
                  : item.image_url;
              return (
                <Link
                  key={item.id}
                  href="/katalog"
                  className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition"
                >
                  <div className="aspect-square bg-stone-100 overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() =>
                          setCardFailedCustom((prev) => ({
                            ...prev,
                            [item.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Utensils className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-amber-700">
                        {item.category}
                      </span>
                      {item.unit && (
                        <span className="text-xs text-stone-500">
                          {item.unit}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-stone-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm font-bold text-stone-900 mt-2">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CARA PESAN & KEPERCAYAAN */}
      <section className="bg-white border-t border-stone-200 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-stone-900">
              Pesan Mudah dalam 3 Langkah
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Praktis untuk jajan santai maupun pesan bareng teman &amp; keluarga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900">1. Pilih Menu Favorit</h3>
              <p className="text-sm text-stone-600 mt-1">
                Jelajahi menu makanan &amp; minuman di katalog lalu masukkan ke keranjang.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900">2. Checkout Cepat</h3>
              <p className="text-sm text-stone-600 mt-1">
                Isi data pemesan dan pilih metode pembayaran yang tersedia dengan aman.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900">3. Pantau Status</h3>
              <p className="text-sm text-stone-600 mt-1">
                Cek progres pesanan kapan saja melalui halaman Lacak Pesanan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-300 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">UMKM Natama • Natama Taste</span>
            <span className="text-stone-500">| Halal &amp; Segar</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/katalog" className="hover:text-white transition">
              Katalog
            </Link>
            <Link href="/lacak-pesanan" className="hover:text-white transition">
              Lacak Pesanan
            </Link>
            <Link href="/checkout" className="hover:text-white transition">
              Keranjang
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  Eye,
  LayoutGrid,
  RefreshCw,
  Search,
  ShoppingBag,
  Utensils,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getCartKey } from '@/lib/cart';
import { getSupabaseClient } from '@/lib/supabase-client';

interface Product {
  id: string;
  sku?: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  unit?: string | null;
  category: string;
  image_url?: string | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category?: string;
  quantity: number;
}

const CUSTOM_IMAGES: Record<string, string> = {
  'Sosis Bakar': '/images/sosis bakar.jpg',
  'Otak-otak Singapore': '/images/otak-otak singapore.jpeg',
  'Fish Roll': '/images/fish roll.jpg',
  'Dumpling Cheese': '/images/dumpling cheese.jpg',
  'Dumpling Chicken': '/images/dumpling chicken.webp',
  'Dumpling Salmon': '/images/dumpling-salmon.jpg',
  'Dumpling Kepiting': '/images/dumpling-kepiting.jpg',
  'Dumpling Udang': '/images/dumpling-udang.jpg',
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
  'Strawberry Yakult': '/images/strawberry-yakult.jpg',
  'Orange Yakult': '/images/orange-yakult.jpg',
  'Blackcurrant': '/images/blackcurrant.jpg',
  'Lemon Tea': '/images/lemon-tea.jpg',
  'Lemon Grass': '/images/lemon-grass.jpg',
  'Lemon Squash': '/images/lemon-squash.jpg',
  'Lychee Tea': '/images/lychee-tea.jpg',
};

function AllMenuIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FoodIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 16a7.5 7.5 0 0 1 15 0H4.5Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M2.5 19h19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DrinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14.5 2.5L12.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7.5 8l1.2 11.7a1.5 1.5 0 0 0 1.5 1.3h3.6a1.5 1.5 0 0 0 1.5-1.3L16.5 8h-9Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 13h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function KatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [failedCustom, setFailedCustom] = useState<Record<string, boolean>>({});
  const [failedDb, setFailedDb] = useState<Record<string, boolean>>({});
  const [isSeller, setIsSeller] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Gagal mengambil data produk dari server.');
      }

      const list: Product[] = Array.isArray(data) ? data : data.products ?? [];
      setProducts(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Tidak dapat terhubung ke database. Cek file .env.local kamu.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const supabase = getSupabaseClient();
    const checkRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsSeller(false);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setIsSeller(profile?.role === 'penjual');
      } catch {
        setIsSeller(false);
      }
    };

    checkRole();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const categories = ['Semua', 'Makanan', 'Minuman'];

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCategory =
        selectedCategory === 'Semua' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        (item.description ?? '').toLowerCase().includes(keyword);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, search]);

  const handleAddToCart = (product: Product) => {
    if (isSeller || product.stock <= 0) return;

    const hasUploadedDbImg = Boolean(
      product.image_url && product.image_url.includes('menu-images') && !failedDb[product.id]
    );
    const customSrc = CUSTOM_IMAGES[product.name];
    const imageSrc = hasUploadedDbImg
      ? product.image_url
      : customSrc && !failedCustom[product.id]
        ? customSrc
        : product.image_url;

    const cartKey = getCartKey();
    const raw = localStorage.getItem(cartKey);
    const cart: CartItem[] = raw ? JSON.parse(raw) : [];
    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: imageSrc,
        category: product.category,
        quantity: 1,
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cart-updated'));

    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Banner Mode Pratinjau untuk Penjual */}
          {isSeller && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-950">
                  <p className="font-semibold">Mode Pratinjau Penjual</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Anda sedang melihat tampilan toko sebagaimana dilihat pembeli. Akun penjual tidak dapat memesan menu.
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shrink-0 transition"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kembali ke Dashboard
              </Link>
            </div>
          )}

          {/* Header & Filter */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">
                Menu Resmi • Halal
              </p>
              <h1 className="text-3xl font-bold text-stone-900">
                Natama Taste
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                Aneka jajanan bakar/goreng &amp; minuman segar pilihan (Regular 10k • Large 15k).
              </p>
            </div>

            {/* Search & Segmented Category Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full pl-9 pr-4 py-2 text-sm text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="inline-flex items-center p-1 bg-stone-200/70 border border-stone-200 rounded-xl shrink-0">
                {categories.map((category) => {
                  const active = selectedCategory === category;
                  const iconColor =
                    category === 'Makanan'
                      ? 'text-amber-600'
                      : category === 'Minuman'
                        ? 'text-sky-600'
                        : 'text-stone-800';

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                        active
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span className={active ? iconColor : 'text-stone-500'}>
                        {category === 'Semua' && <AllMenuIcon className="w-4 h-4" />}
                        {category === 'Makanan' && <FoodIcon className="w-4 h-4" />}
                        {category === 'Minuman' && <DrinkIcon className="w-4 h-4" />}
                      </span>
                      <span>{category}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-stone-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-5 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-9 bg-stone-200 rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h2 className="font-semibold text-red-900">Gagal Memuat Katalog</h2>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
              <Utensils className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-stone-900">
                Menu belum ditemukan
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                Coba ubah kata kunci pencarian atau pilih kategori Semua.
              </p>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isDrink = product.category?.toLowerCase() === 'minuman';
                const isAdded = addedId === product.id;
                const outOfStock = product.stock <= 0;

                const hasUploadedDbImg = Boolean(
                  product.image_url &&
                    product.image_url.includes('menu-images') &&
                    !failedDb[product.id]
                );
                const customSrc = CUSTOM_IMAGES[product.name];
                const tryingCustom = !hasUploadedDbImg && Boolean(customSrc && !failedCustom[product.id]);
                const activeSrc = hasUploadedDbImg
                  ? product.image_url
                  : tryingCustom
                    ? customSrc
                    : !failedDb[product.id]
                      ? product.image_url
                      : null;

                return (
                  <div
                    key={product.id}
                    className="group bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition"
                  >
                    <div>
                      {/* Foto Produk Bisa Diklik ke Halaman Detail */}
                      <Link
                        href={`/katalog/${product.id}`}
                        className="block relative aspect-square bg-stone-100 overflow-hidden"
                      >
                        {!activeSrc ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                            {isDrink ? (
                              <DrinkIcon className="w-10 h-10 mb-1" />
                            ) : (
                              <FoodIcon className="w-10 h-10 mb-1" />
                            )}
                            <span className="text-xs">{product.category}</span>
                          </div>
                        ) : (
                          <img
                            src={activeSrc}
                            alt={product.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            onError={() => {
                              if (tryingCustom) {
                                setFailedCustom((prev) => ({
                                  ...prev,
                                  [product.id]: true,
                                }));
                              } else {
                                setFailedDb((prev) => ({
                                  ...prev,
                                  [product.id]: true,
                                }));
                              }
                            }}
                          />
                        )}
                      </Link>

                      {/* Badge & Detail Produk */}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                              isDrink
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {isDrink ? (
                              <DrinkIcon className="w-3.5 h-3.5" />
                            ) : (
                              <FoodIcon className="w-3.5 h-3.5" />
                            )}
                            {product.category}
                          </span>

                          {product.unit && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700">
                              {product.unit}
                            </span>
                          )}
                        </div>

                        <Link href={`/katalog/${product.id}`} className="block">
                          <h2 className="font-semibold text-stone-900 line-clamp-1 hover:text-amber-700 transition">
                            {product.name}
                          </h2>
                        </Link>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2 min-h-[32px]">
                          {product.description || 'Menu pilihan Natama Taste.'}
                        </p>
                      </div>
                    </div>

                    {/* Harga & Tombol */}
                    <div className="px-4 pb-4 pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-bold text-stone-900">
                          {formatRupiah(product.price)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            outOfStock ? 'text-red-600' : 'text-stone-500'
                          }`}
                        >
                          {outOfStock ? 'Stok habis' : `Stok: ${product.stock}`}
                        </span>
                      </div>

                      {isSeller ? (
                        <Link
                          href={`/katalog/${product.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
                        >
                          <Eye className="w-4 h-4" />
                          Pratinjau Detail
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={outOfStock}
                          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-900 text-white hover:bg-stone-800'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              Ditambahkan
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              {outOfStock ? 'Habis' : 'Tambah ke Keranjang'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
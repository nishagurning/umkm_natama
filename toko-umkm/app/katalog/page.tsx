'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Coffee,
  RefreshCw,
  Search,
  ShoppingBag,
  Utensils,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
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

// GANTI GAMBAR PRODUK DI SINI:
// Pastikan file fotonya sudah dimasukkan ke folder: toko-umkm/public/images/
// Contoh: taruh file "rendang.jpg" di public/images/rendang.jpg -> tulis '/images/rendang.jpg'
// Bisa juga diisi link gambar lain (https://...)
const CUSTOM_IMAGES: Record<string, string> = {
  'Rendang Daging Kemasan 250g': '/images/rendang.jpg',
  'Sambal Roa Pedas Gurih 150g': '/images/sambal-roa.jpg',
  'Keripik Tempe Sagu Renyah': '/images/keripik-tempe.jpg',
  'Brownies Panggang Cokelat': '/images/brownies.jpg',
  'Kopi Susu Gula Aren 250ml': '/images/Kopi Susu Gula Aren.jpg',
  'Teh Tarik Rempah Botol 250ml': '/images/teh-tarik.jpg',
  'Wedang Jahe Merah Instan': '/images/wedang-jahe.jpg',
  'Matcha Latte Dingin': '/images/Matcha Latte Dingin.jpg',
};

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
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

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
  }, []);

  const categories = useMemo(() => {
    const base = ['Semua', 'Makanan', 'Minuman'];
    const extra = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).filter((c) => !base.includes(c));
    return [...base, ...extra];
  }, [products]);

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
    if (product.stock <= 0) return;

    const imageSrc = CUSTOM_IMAGES[product.name] || product.image_url;
    const raw = localStorage.getItem('cart');
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

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cart-updated'));

    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">
              Menu Pilihan UMKM Natama
            </p>
            <h1 className="text-3xl font-bold text-stone-900">
              Katalog Makanan & Minuman
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Sajian kuliner rumahan dan minuman segar langsung dari pelaku UMKM lokal.
            </p>
          </div>

          {/* Search & Category Pills */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="relative self-start w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari makanan atau minuman..."
                className="w-full pl-9 pr-4 py-2 text-sm text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {category === 'Makanan' && <Utensils className="w-3.5 h-3.5" />}
                    {category === 'Minuman' && <Coffee className="w-3.5 h-3.5" />}
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-stone-200" />
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
              Menu belum tersedia
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Belum ada produk untuk kategori atau kata kunci ini. Tambahkan lewat halaman Admin atau SQL Supabase.
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
              const imageSrc = CUSTOM_IMAGES[product.name] || product.image_url;
              const showFallback = !imageSrc || brokenImages[product.id];

              return (
                <div
                  key={product.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {/* Foto Produk */}
                    <div className="relative h-44 bg-stone-100 overflow-hidden">
                      {showFallback ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                          {isDrink ? (
                            <Coffee className="w-10 h-10 mb-1" />
                          ) : (
                            <Utensils className="w-10 h-10 mb-1" />
                          )}
                          <span className="text-xs">{product.category}</span>
                        </div>
                      ) : (
                        <img
                          src={imageSrc!}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={() =>
                            setBrokenImages((prev) => ({
                              ...prev,
                              [product.id]: true,
                            }))
                          }
                        />
                      )}

                      {/* Badge Kategori */}
                      <span
                        className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${
                          isDrink
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isDrink ? (
                          <Coffee className="w-3 h-3" />
                        ) : (
                          <Utensils className="w-3 h-3" />
                        )}
                        {product.category}
                      </span>
                    </div>

                    {/* Detail Produk */}
                    <div className="p-4">
                      <h2 className="font-semibold text-stone-900 line-clamp-1">
                        {product.name}
                      </h2>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 min-h-[32px]">
                        {product.description || 'Produk olahan UMKM berkualitas.'}
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

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={outOfStock}
                      className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
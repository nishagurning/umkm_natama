'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Utensils,
} from 'lucide-react';
import Navbar from '../../../components/Navbar';

interface Product {
  id: string;
  sku?: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  unit?: string | null;
  variants?: string[] | null;
  category: string;
  image_url?: string | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category?: string;
  variant?: string;
  note?: string;
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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DetailProdukPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);
  const [failedCustom, setFailedCustom] = useState(false);
  const [failedDb, setFailedDb] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${productId}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || !data.product) {
          throw new Error(data?.error || 'Menu tidak ditemukan.');
        }
        setProduct(data.product);
        if (Array.isArray(data.product.variants) && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Gagal memuat detail produk.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [productId]);

  const maxStock = product?.stock && product.stock > 0 ? product.stock : 1;
  const parsedQty = parseInt(qtyInput, 10);
  const validQty =
    Number.isNaN(parsedQty) || parsedQty < 1
      ? 1
      : Math.min(maxStock, parsedQty);

  const handleQtyChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly === '') {
      setQtyInput('');
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (num > maxStock) {
      setQtyInput(String(maxStock));
    } else {
      setQtyInput(String(num));
    }
  };

  const handleQtyBlur = () => {
    if (!qtyInput || parseInt(qtyInput, 10) < 1) {
      setQtyInput('1');
    }
  };

  const handleQuickNote = (text: string) => {
    setNote((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${trimmed}, ${text}`;
    });
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;

    setQtyInput(String(validQty));
    const customSrc = CUSTOM_IMAGES[product.name];
    const imageSrc = customSrc && !failedCustom ? customSrc : product.image_url;
    const cleanNote = note.trim();

    const raw = localStorage.getItem('cart');
    const cart: CartItem[] = raw ? JSON.parse(raw) : [];
    const existingIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        (item.variant || '') === selectedVariant &&
        (item.note || '') === cleanNote
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += validQty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: imageSrc,
        category: product.category,
        variant: selectedVariant || undefined,
        note: cleanNote || undefined,
        quantity: validQty,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cart-updated'));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const customSrc = product ? CUSTOM_IMAGES[product.name] : undefined;
  const tryingCustom = Boolean(customSrc && !failedCustom);
  const activeSrc = tryingCustom
    ? customSrc
    : !failedDb
      ? product?.image_url
      : null;

  const isDrink = product?.category?.toLowerCase() === 'minuman';
  const quickNotes = isDrink
    ? ['Es sedikit', 'Less sugar', 'Tanpa es']
    : ['Saus pisah', 'Tidak pedas', 'Ekstra saus'];

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/katalog"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-stone-200 rounded-2xl p-6 animate-pulse">
            <div className="aspect-square bg-stone-200 rounded-xl" />
            <div className="space-y-4 py-2">
              <div className="h-5 bg-stone-200 rounded w-1/3" />
              <div className="h-8 bg-stone-200 rounded w-3/4" />
              <div className="h-6 bg-stone-200 rounded w-1/4" />
              <div className="h-20 bg-stone-200 rounded w-full" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h1 className="font-semibold text-red-900">{error}</h1>
            <Link
              href="/katalog"
              className="mt-4 inline-block px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg"
            >
              Lihat Menu Lainnya
            </Link>
          </div>
        )}

        {!loading && !error && product && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
              {activeSrc ? (
                <img
                  src={activeSrc}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                  onError={() => {
                    if (tryingCustom) setFailedCustom(true);
                    else setFailedDb(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <Utensils className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      isDrink
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {product.category}
                  </span>
                  {product.unit && (
                    <span className="px-3 py-1 rounded-md text-xs font-medium bg-stone-100 text-stone-700">
                      {product.unit}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Halal
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-stone-900">
                  {product.name}
                </h1>

                <p className="text-2xl font-bold text-amber-700 mt-3">
                  {formatRupiah(product.price)}
                </p>

                <p className="text-sm text-stone-600 leading-relaxed mt-4">
                  {product.description || 'Menu olahan segar pilihan dari Natama Taste.'}
                </p>

                {Array.isArray(product.variants) && product.variants.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                      Pilihan Varian / Ukuran
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                            selectedVariant === variant
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {variant}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan Pembelian */}
                <div className="mt-5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Catatan Pembelian (Opsional)
                  </label>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {quickNotes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleQuickNote(item)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      isDrink
                        ? 'Contoh: Es sedikit, jangan terlalu manis...'
                        : 'Contoh: Saus dipisah, tanpa mayones...'
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white resize-none"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
                  <span>Kode Menu: {product.sku || '-'}</span>
                  <span>
                    {product.stock > 0
                      ? `Stok tersedia: ${product.stock}`
                      : 'Stok habis'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Jumlah Bisa Diklik & Diketik Langsung */}
                  <div className="inline-flex items-center border border-stone-200 rounded-xl bg-stone-50 p-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQtyInput(String(Math.max(1, validQty - 1)))
                      }
                      className="p-2.5 text-stone-700 hover:text-stone-900 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Jumlah pesanan"
                      value={qtyInput}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      onBlur={handleQtyBlur}
                      className="w-12 py-1.5 text-center text-sm font-semibold text-stone-900 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 rounded-lg"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setQtyInput(String(Math.min(maxStock, validQty + 1)))
                      }
                      className="p-2.5 text-stone-700 hover:text-stone-900 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 ${
                      added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" />
                        Masuk Keranjang
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Tambah ({formatRupiah(product.price * validQty)})
                      </>
                    )}
                  </button>
                </div>

                {added && (
                  <Link
                    href="/checkout"
                    className="block text-center w-full py-2.5 rounded-xl border border-stone-900 text-stone-900 text-sm font-semibold hover:bg-stone-100 transition"
                  >
                    Lanjut ke Keranjang &amp; Checkout →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
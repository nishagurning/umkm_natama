'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getCartKey } from '@/lib/cart';
import { getSupabaseClient } from '@/lib/supabase-client';
import {
  ArrowLeft,
  Check,
  Eye,
  LayoutGrid,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

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

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState('');
  const [note, setNote] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [inCartQty, setInCartQty] = useState(0);
  const [added, setAdded] = useState(false);
  const [failedCustom, setFailedCustom] = useState(false);
  const [failedDb, setFailedDb] = useState(false);

  const syncInCartQty = (id: string) => {
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
      const total = Array.isArray(cart)
        ? cart
            .filter((item) => item.id === id)
            .reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      setInCartQty(total);
    } catch {
      setInCartQty(0);
    }
  };

  useEffect(() => {
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

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Produk tidak ditemukan.');

        const prod: Product = data.product ?? data;
        setProduct(prod);
        const list = prod.variants && prod.variants.length > 0 ? prod.variants : ['Standar'];
        setSelectedVariant(list[0]);
        syncInCartQty(prod.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat produk.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();

    const handleCartChange = () => {
      if (productId) syncInCartQty(productId);
    };
    window.addEventListener('cart-updated', handleCartChange);
    window.addEventListener('storage', handleCartChange);
    return () => {
      window.removeEventListener('cart-updated', handleCartChange);
      window.removeEventListener('storage', handleCartChange);
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white border border-stone-200 rounded-2xl p-8 animate-pulse h-96" />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
          <p className="text-red-600 font-medium">{error || 'Produk tidak ditemukan.'}</p>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Katalog
          </Link>
        </main>
      </div>
    );
  }

  const variants =
    product.variants && product.variants.length > 0 ? product.variants : ['Standar'];
  const isDrink = product.category?.toLowerCase() === 'minuman';
  const isLargeDrink =
    selectedVariant.includes('15k') ||
    (isDrink && selectedVariant.toLowerCase().includes('large'));
  const unitPrice = isLargeDrink ? 15000 : product.price;

  const remainingStock = Math.max(0, product.stock - inCartQty);
  const parsedQty = parseInt(qtyInput, 10);
  const isQtyEmptyOrZero = !qtyInput.trim() || isNaN(parsedQty) || parsedQty < 1;
  const isOverStock = !isQtyEmptyOrZero && parsedQty > remainingStock;
  const outOfStock = product.stock <= 0 || remainingStock <= 0;
  const cannotOrder = isSeller || outOfStock || isQtyEmptyOrZero || isOverStock;

  const quickNotes = isDrink
    ? ['Es sedikit', 'Tanpa es', 'Less sugar']
    : ['Saus pisah', 'Tidak pedas', 'Ekstra saus'];

  const hasUploadedDbImg = Boolean(
    product.image_url && product.image_url.includes('menu-images') && !failedDb
  );
  const customSrc = CUSTOM_IMAGES[product.name];
  const tryingCustom = !hasUploadedDbImg && Boolean(customSrc && !failedCustom);
  const imageSrc = hasUploadedDbImg
    ? product.image_url
    : tryingCustom
      ? customSrc
      : !failedDb
        ? product.image_url
        : null;

  const addQuickNote = (text: string) => {
    setNote((prev) => {
      if (!prev.trim()) return text;
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${prev.trim()}, ${text}`;
    });
  };

  const handleQtyChange = (val: string) => {
    const onlyDigits = val.replace(/\D/g, '');
    setQtyInput(onlyDigits);
  };

  const stepQty = (delta: number) => {
    const current = isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty;
    const maxAllowed = Math.max(1, remainingStock);
    const next = Math.min(maxAllowed, Math.max(1, current + delta));
    setQtyInput(String(next));
  };

  const handleAddToCart = () => {
    if (cannotOrder) return;

    const cleanNote = note.trim();
    const cartKey = getCartKey();
    const raw = localStorage.getItem(cartKey);
    const cart: CartItem[] = raw ? JSON.parse(raw) : [];

    const existingIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        (item.variant || 'Standar') === selectedVariant &&
        (item.note || '') === cleanNote
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += parsedQty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: unitPrice,
        image_url: imageSrc,
        category: product.category,
        variant: selectedVariant,
        note: cleanNote,
        quantity: parsedQty,
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cart-updated'));
    syncInCartQty(product.id);

    setAdded(true);
    setQtyInput('1');
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isSeller && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-950">
                <p className="font-semibold">Mode Pratinjau Penjual</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Anda sedang mengecek tampilan detail menu. Pemesanan dinonaktifkan untuk akun penjual.
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

        <Link
          href="/katalog"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>

        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Foto Produk */}
          <div className="md:col-span-5 aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => {
                  if (tryingCustom) {
                    setFailedCustom(true);
                  } else {
                    setFailedDb(true);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
                Foto belum tersedia
              </div>
            )}
          </div>

          {/* Info & Form Pesan */}
          <div className="md:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  isDrink ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-800'
                }`}
              >
                {product.category}
              </span>
              {product.unit && (
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700">
                  {product.unit}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Halal
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{product.name}</h1>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {formatRupiah(unitPrice)}
              </p>
              <p className="text-sm text-stone-600 mt-3 leading-relaxed">
                {product.description || 'Menu pilihan berkualitas dari Natama Taste.'}
              </p>
            </div>

            {/* Pilihan Varian */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Pilihan Varian / Ukuran
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                      selectedVariant === variant
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>

            {!isSeller && (
              <>
                {/* Catatan Pembelian */}
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Catatan Pembelian (Opsional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickNotes.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => addQuickNote(chip)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer"
                      >
                        + {chip}
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
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <span>Kode Menu: {product.sku || '-'}</span>
              <span>
                Stok tersedia: <strong>{product.stock}</strong>
                {!isSeller && inCartQty > 0 && ` (${inCartQty} sudah di keranjang)`}
              </span>
            </div>

            {isSeller ? (
              <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-medium text-stone-700">
                  Mode Pratinjau Penjual — tombol pemesanan disembunyikan untuk akun ini.
                </span>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shrink-0"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Edit di Dashboard
                </Link>
              </div>
            ) : (
              <>
                {/* Peringatan Jika Melebihi Stok */}
                {isOverStock && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Jumlah pesanan (<strong>{parsedQty}</strong>) melebihi stok yang tersedia (
                      <strong>maksimal {remainingStock}</strong>
                      {inCartQty > 0 ? ` karena ${inCartQty} sudah ada di keranjang` : ''}).
                    </span>
                  </div>
                )}

                {outOfStock && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {product.stock <= 0
                        ? 'Maaf, stok menu ini sedang habis.'
                        : `Semua stok (${product.stock}) menu ini sudah berada di keranjang Anda.`}
                    </span>
                  </div>
                )}

                {/* Jumlah + Tombol Tambah */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <div className="inline-flex items-center justify-between border border-stone-200 rounded-xl bg-stone-50 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => stepQty(-1)}
                      disabled={outOfStock || isQtyEmptyOrZero || parsedQty <= 1}
                      className="p-2 text-stone-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                      aria-label="Kurangi"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={qtyInput}
                      disabled={outOfStock}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      className="w-14 text-center bg-transparent font-bold text-sm focus:outline-none"
                      aria-label="Jumlah"
                    />
                    <button
                      type="button"
                      onClick={() => stepQty(1)}
                      disabled={outOfStock || (!isQtyEmptyOrZero && parsedQty >= remainingStock)}
                      className="p-2 text-stone-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                      aria-label="Tambah"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={cannotOrder}
                    className={`flex-1 py-3.5 px-6 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" />
                        Masuk ke Keranjang!
                      </>
                    ) : outOfStock ? (
                      'Stok Habis / Penuh'
                    ) : isOverStock ? (
                      `Maksimal ${remainingStock} pcs`
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Tambah ({formatRupiah(unitPrice * (isQtyEmptyOrZero ? 0 : parsedQty))})
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
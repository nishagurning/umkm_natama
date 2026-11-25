'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getSupabaseClient } from '@/lib/supabase-client';
import { getCartKey, setActiveCartUser } from '@/lib/cart';
import { STORE_PAYMENT_CONFIG } from '@/lib/payment-config';
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  LogIn,
  UserCheck,
  MapPin,
  Store,
  AlertTriangle,
  LayoutGrid,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  variant?: string;
  note?: string;
  quantity: number;
}

const getUnitPrice = (item: CartItem) => {
  const variantText = (item.variant || '').toLowerCase();
  if (
    variantText.includes('15k') ||
    (item.category === 'Minuman' && variantText.includes('large'))
  ) {
    return 15000;
  }
  return Number(item.price) || 0;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [stockLoaded, setStockLoaded] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [hasSavedPhone, setHasSavedPhone] = useState(false);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [courier, setCourier] = useState('Ambil di Outlet');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
      setCart(Array.isArray(saved) ? saved : []);
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    const loadStock = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.products ?? [];
        const map: Record<string, number> = {};
        for (const p of list) {
          map[p.id] = Number(p.stock ?? 0);
        }
        setStockMap(map);
      } catch {
        // Biarkan jika sementara gagal mengambil stok
      } finally {
        setStockLoaded(true);
      }
    };

    const loadAuthAndProfile = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsLoggedIn(true);
          setAccessToken(session.access_token);
          setUserId(session.user.id);
          setActiveCartUser(session.user.id);

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, role')
            .eq('id', session.user.id)
            .single();

          setIsSeller(profile?.role === 'penjual');

          const resolvedName =
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'Pembeli';

          const resolvedPhone =
            profile?.phone || session.user.user_metadata?.phone || '';

          setCustomerName(resolvedName);
          setCustomerPhone(resolvedPhone);
          setHasSavedPhone(Boolean(resolvedPhone.trim()));
        } else {
          setIsLoggedIn(false);
          setIsSeller(false);
          setAccessToken('');
          setUserId('');
          setActiveCartUser(null);
        }
      } finally {
        loadCart();
        setMounted(true);
      }
    };

    loadStock();
    loadAuthAndProfile();

    window.addEventListener('cart-updated', loadCart);
    return () => window.removeEventListener('cart-updated', loadCart);
  }, []);

  const syncCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    localStorage.setItem(getCartKey(), JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('storage'));
  };

  const updateQty = (idx: number, delta: number) => {
    const next = cart.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setQtyDrafts((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
    syncCart(next);
  };

  const handleQtyInput = (idx: number, rawVal: string) => {
    const onlyDigits = rawVal.replace(/\D/g, '');
    setQtyDrafts((prev) => ({ ...prev, [idx]: onlyDigits }));

    if (onlyDigits !== '') {
      const parsed = parseInt(onlyDigits, 10);
      if (parsed >= 1) {
        const next = cart.map((item, i) =>
          i === idx ? { ...item, quantity: parsed } : item
        );
        syncCart(next);
      }
    }
  };

  const handleQtyBlur = (idx: number) => {
    const draft = qtyDrafts[idx];
    if (draft === undefined) return;

    const parsed = parseInt(draft, 10);
    if (!draft || isNaN(parsed) || parsed < 1) {
      const next = cart.map((item, i) =>
        i === idx ? { ...item, quantity: 1 } : item
      );
      syncCart(next);
    }

    setQtyDrafts((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
  };

  const removeItem = (idx: number) => {
    const next = cart.filter((_, i) => i !== idx);
    setQtyDrafts({});
    syncCart(next);
  };

  const qtyByProduct = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of cart) {
      counts[item.id] = (counts[item.id] || 0) + (Number(item.quantity) || 0);
    }
    return counts;
  }, [cart]);

  const hasStockIssue = useMemo(() => {
    if (!stockLoaded) return false;
    return cart.some((item) => {
      const available = stockMap[item.id];
      if (available === undefined) return false;
      const totalOrdered = qtyByProduct[item.id] || 0;
      return available <= 0 || totalOrdered > available || item.quantity < 1;
    });
  }, [cart, stockMap, qtyByProduct, stockLoaded]);

  const isPickup = courier === 'Ambil di Outlet';

  const subtotal = cart.reduce(
    (sum, item) => sum + getUnitPrice(item) * item.quantity,
    0
  );

  const shippingCost =
    cart.length === 0 || isPickup
      ? 0
      : courier === 'Diantar ke Tempat (Kurir Lokal)'
      ? subtotal >= 150000
        ? 0
        : 10000
      : subtotal >= 350000
      ? 0
      : 18000;

  const total = subtotal + shippingCost;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSeller) return;
    if (!isLoggedIn) {
      router.push('/login?redirect=/checkout');
      return;
    }
    if (hasStockIssue) return;

    setError('');
    setLoading(true);
    try {
      if (!hasSavedPhone && customerPhone.trim() && userId) {
        const supabase = getSupabaseClient();
        await supabase
          .from('profiles')
          .update({ phone: customerPhone.trim() })
          .eq('id', userId);
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          address: isPickup ? 'Ambil di Outlet' : address.trim(),
          city: isPickup ? '-' : city.trim(),
          courier,
          shippingCost,
          paymentMethod,
          items: cart.map((item) => ({
            id: item.id,
            variant: item.variant || 'Standar',
            note: item.note || '',
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout gagal');

      localStorage.removeItem(getCartKey());
      window.dispatchEvent(new Event('cart-updated'));
      window.dispatchEvent(new Event('storage'));
      router.push(`/lacak-pesanan?q=${data.order.order_number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Keranjang & Checkout</h1>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {isSeller ? 'Pratinjau Katalog' : 'Tambah Menu Lain'}
          </Link>
        </div>

        {!mounted ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-stone-500">
            Memuat keranjang...
          </div>
        ) : isSeller ? (
          <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="text-lg font-bold text-zinc-900">
              Halaman Checkout Khusus Pembeli
            </h2>
            <p className="text-sm text-stone-600">
              Anda sedang login sebagai akun <strong>Penjual</strong> ({customerName}).
              Akun penjual tidak dapat membuat pesanan di toko sendiri.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800"
              >
                <LayoutGrid className="w-4 h-4" />
                Kembali ke Dashboard Penjual
              </Link>
              <Link
                href="/katalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50"
              >
                Pratinjau Katalog
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-600">Keranjang belanja masih kosong.</p>
            <Link
              href="/katalog"
              className="inline-block px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
            >
              Belanja di Katalog
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-5 h-fit">
              {!isLoggedIn ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-amber-900 space-y-0.5">
                    <p className="font-bold text-sm">Masuk Akun Diperlukan</p>
                    <p>Silakan masuk atau daftar sebagai pembeli dulu untuk membuat pesanan.</p>
                  </div>
                  <Link
                    href="/login?redirect=/checkout"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Masuk / Daftar
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <UserCheck className="w-4 h-4" />
                    Data Pemesan Otomatis dari Akun
                  </div>
                  <div className="text-sm text-zinc-900">
                    <p className="font-semibold">{customerName}</p>
                    {hasSavedPhone && (
                      <p className="text-stone-600 text-xs mt-0.5">WhatsApp: {customerPhone}</p>
                    )}
                  </div>
                  {!hasSavedPhone && (
                    <div className="pt-1">
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Nomor WhatsApp (belum tersimpan di akun Anda)
                      </label>
                      <input
                        required
                        placeholder="0812..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 bg-white rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <h2 className="font-semibold text-lg">Pengambilan & Pembayaran</h2>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Pilih Metode Pengambilan
                  </label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Ambil di Outlet">Ambil di Outlet (Gratis)</option>
                    <option value="Diantar ke Tempat (Kurir Lokal)">
                      Diantar ke Tempat (Rp 10.000)
                    </option>
                    <option value="JNE Reguler">JNE Reguler (Rp 18.000)</option>
                    <option value="J&T Express">J&T Express (Rp 18.000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="QRIS">QRIS (Scan Kode QR)</option>
                    <option value="VA BCA">Transfer Bank BCA</option>
                    <option value="VA Mandiri">Transfer Bank Mandiri</option>
                    <option value="COD">COD / Bayar di Tempat</option>
                  </select>
                </div>
              </div>

              {paymentMethod !== 'COD' && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  {paymentMethod === 'QRIS' ? (
                    <p>
                      <strong>QRIS {STORE_PAYMENT_CONFIG.qrisMerchantName}:</strong> Kode QRIS
                      untuk scan pembayaran akan langsung muncul setelah Anda klik{' '}
                      <strong>Buat Pesanan</strong>.
                    </p>
                  ) : (
                    <p>
                      <strong>
                        {STORE_PAYMENT_CONFIG.banks[paymentMethod]?.bankName || paymentMethod}:
                      </strong>{' '}
                      No. Rekening{' '}
                      <span className="font-mono font-bold">
                        {STORE_PAYMENT_CONFIG.banks[paymentMethod]?.accountNumber}
                      </span>{' '}
                      a.n.{' '}
                      <strong>
                        {STORE_PAYMENT_CONFIG.banks[paymentMethod]?.accountHolder}
                      </strong>
                      .
                    </p>
                  )}
                </div>
              )}

              {isPickup ? (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5 text-xs text-stone-600">
                  <Store className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Pesanan diambil langsung di outlet <strong>Natama Taste</strong>. Anda tidak
                    perlu mengisi alamat pengiriman.
                  </span>
                </div>
              ) : (
                <div className="space-y-4 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 pt-2">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    Alamat Tujuan Pengantaran
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Alamat Lengkap & Patokan
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Contoh: Jl. Jamin Ginting No. 12, dekat minimarket..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Kota / Kecamatan
                    </label>
                    <input
                      required
                      placeholder="Contoh: Medan / Kec. Medan Baru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-4 h-fit">
              <h2 className="font-semibold text-lg">Ringkasan Pesanan</h2>
              <div className="divide-y divide-stone-100">
                {cart.map((item, idx) => {
                  const unitPrice = getUnitPrice(item);
                  const availableStock = stockMap[item.id];
                  const hasKnownStock = stockLoaded && availableStock !== undefined;
                  const totalOrderedForProduct = qtyByProduct[item.id] || item.quantity;
                  const isOut = hasKnownStock && availableStock <= 0;
                  const isOver = hasKnownStock && !isOut && totalOrderedForProduct > availableStock;
                  const remainingAfterOrder = hasKnownStock
                    ? Math.max(0, availableStock - totalOrderedForProduct)
                    : null;

                  return (
                    <div key={idx} className="py-3.5 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">{item.name}</p>
                          <p className="text-xs text-stone-500">
                            Varian: {item.variant || 'Standar'} • Rp{' '}
                            {unitPrice.toLocaleString('id-ID')}
                          </p>
                          {hasKnownStock && (
                            <p
                              className={`text-xs font-medium ${
                                isOut || isOver ? 'text-red-600' : 'text-stone-600'
                              }`}
                            >
                              Stok tersedia: <strong>{availableStock} pcs</strong>
                              {!isOut && !isOver && remainingAfterOrder !== null && (
                                <span className="text-stone-400">
                                  {' '}
                                  • Sisa nanti: {remainingAfterOrder} pcs
                                </span>
                              )}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                              Catatan: {item.note}
                            </p>
                          )}
                        </div>

                        <span className="font-semibold text-zinc-900 shrink-0">
                          Rp {(unitPrice * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`inline-flex items-center border rounded-lg bg-stone-50 ${
                            isOut || isOver ? 'border-red-300 bg-red-50/40' : 'border-stone-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => updateQty(idx, -1)}
                            disabled={item.quantity <= 1}
                            className="p-1.5 text-stone-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={qtyDrafts[idx] ?? String(item.quantity)}
                            onChange={(e) => handleQtyInput(idx, e.target.value)}
                            onBlur={() => handleQtyBlur(idx)}
                            className="w-10 text-center bg-transparent text-xs font-semibold tabular-nums focus:outline-none"
                            aria-label="Jumlah pesanan"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(idx, 1)}
                            disabled={hasKnownStock && totalOrderedForProduct >= availableStock}
                            className="p-1.5 text-stone-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>

                      {isOut && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Stok menu ini sedang habis. Silakan hapus dari keranjang.</span>
                        </div>
                      )}

                      {isOver && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Jumlah pesanan melebihi stok! Stok tersedia hanya{' '}
                            <strong>{availableStock} pcs</strong> (total di keranjang:{' '}
                            <strong>{totalOrderedForProduct} pcs</strong>). Silakan kurangi jumlahnya.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-stone-200 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Ongkir ({courier})</span>
                  <span>
                    {shippingCost === 0 ? 'Gratis' : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-stone-100">
                  <span>Total Bayar</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {hasStockIssue && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  Pesanan belum bisa diproses karena ada menu yang melebihi stok tersedia.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || hasStockIssue}
                className="w-full py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading
                  ? 'Memproses...'
                  : hasStockIssue
                  ? 'Jumlah Melebihi Stok'
                  : isLoggedIn
                  ? 'Buat Pesanan'
                  : 'Masuk untuk Buat Pesanan'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
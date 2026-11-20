'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [courier, setCourier] = useState('Ambil di Outlet');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(Array.isArray(saved) ? saved : []);
    } catch {
      setCart([]);
    } finally {
      setMounted(true);
    }
  }, []);

  const syncCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    localStorage.setItem('cart', JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('storage'));
  };

  const updateQty = (idx: number, delta: number) => {
    const next = cart.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    syncCart(next);
  };

  const removeItem = (idx: number) => {
    const next = cart.filter((_, i) => i !== idx);
    syncCart(next);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + getUnitPrice(item) * item.quantity,
    0
  );

  const shippingCost =
    cart.length === 0 || courier === 'Ambil di Outlet'
      ? 0
      : courier === 'Kurir Lokal / Ojek Online'
      ? subtotal >= 150000
        ? 0
        : 10000
      : subtotal >= 350000
      ? 0
      : 18000;

  const total = subtotal + shippingCost;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const isPickup = courier === 'Ambil di Outlet';
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          address: isPickup && !address.trim() ? 'Ambil di Outlet' : address.trim(),
          city: isPickup && !city.trim() ? '-' : city.trim(),
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

      localStorage.removeItem('cart');
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
            Tambah Menu Lain
          </Link>
        </div>

        {!mounted ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-stone-500">
            Memuat keranjang...
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
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-4 h-fit">
              <h2 className="font-semibold text-lg">Data Pemesan & Pengiriman</h2>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  required
                  placeholder="0812..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Pengiriman / Pengambilan
                  </label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Ambil di Outlet">Ambil di Outlet (Gratis)</option>
                    <option value="Kurir Lokal / Ojek Online">Kurir Lokal (Rp 10.000)</option>
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="QRIS">QRIS Instan</option>
                    <option value="VA BCA">Virtual Account BCA</option>
                    <option value="VA Mandiri">Virtual Account Mandiri</option>
                    <option value="COD">COD / Bayar di Tempat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Alamat Lengkap {courier === 'Ambil di Outlet' ? '(Opsional)' : ''}
                </label>
                <textarea
                  required={courier !== 'Ambil di Outlet'}
                  rows={2}
                  placeholder={
                    courier === 'Ambil di Outlet'
                      ? 'Boleh dikosongkan jika ambil langsung di outlet'
                      : 'Nama jalan, nomor rumah, patokan...'
                  }
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Kota / Kecamatan {courier === 'Ambil di Outlet' ? '(Opsional)' : ''}
                </label>
                <input
                  required={courier !== 'Ambil di Outlet'}
                  placeholder="Contoh: Medan / Kec. Medan Baru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-4 h-fit">
              <h2 className="font-semibold text-lg">Ringkasan Pesanan</h2>
              <div className="divide-y divide-stone-100">
                {cart.map((item, idx) => {
                  const unitPrice = getUnitPrice(item);
                  return (
                    <div key={idx} className="py-3 flex justify-between gap-3 text-sm">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500">
                          Varian: {item.variant || 'Standar'} • Rp{' '}
                          {unitPrice.toLocaleString('id-ID')}
                        </p>
                        {item.note && (
                          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            Catatan: {item.note}
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="inline-flex items-center border border-stone-200 rounded-lg bg-stone-50">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, -1)}
                              className="p-1.5 text-stone-600 hover:text-zinc-900"
                              aria-label="Kurangi jumlah"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(idx, 1)}
                              className="p-1.5 text-stone-600 hover:text-zinc-900"
                              aria-label="Tambah jumlah"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      </div>

                      <span className="font-semibold text-zinc-900 shrink-0">
                        Rp {(unitPrice * item.quantity).toLocaleString('id-ID')}
                      </span>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Buat Pesanan'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
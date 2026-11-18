'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface CartItem {
  id: string;
  name: string;
  price: number;
  variant: string;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [courier, setCourier] = useState('JNE Reguler');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('umkm_cart') || '[]'));
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 350000 || cart.length === 0 ? 0 : 18000;
  const total = subtotal + shippingCost;

  const removeItem = (idx: number) => {
    const next = cart.filter((_, i) => i !== idx);
    setCart(next);
    localStorage.setItem('umkm_cart', JSON.stringify(next));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          address,
          city,
          courier,
          shippingCost,
          paymentMethod,
          items: cart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout gagal');

      localStorage.removeItem('umkm_cart');
      window.dispatchEvent(new Event('cart-updated'));
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
        <h1 className="text-3xl font-bold">Keranjang & Checkout</h1>

        {cart.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
            <p className="text-stone-600">Keranjang belanja masih kosong.</p>
            <Link
              href="/katalog"
              className="inline-block px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium"
            >
              Belanja di Katalog
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Data Pengiriman & Pembayaran</h2>
              {error && <p className="text-xs text-red-600">{error}</p>}

              <input
                required
                placeholder="Nama Lengkap"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                required
                placeholder="Nomor WhatsApp (0812...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <textarea
                required
                rows={2}
                placeholder="Alamat Lengkap"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                required
                placeholder="Kota / Kabupaten"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="JNE Reguler">JNE Reguler</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="SiCepat">SiCepat</option>
                </select>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="QRIS">QRIS Instan</option>
                  <option value="VA BCA">Virtual Account BCA</option>
                  <option value="VA Mandiri">Virtual Account Mandiri</option>
                  <option value="COD">COD (Bayar di Tempat)</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-4 h-fit">
              <h2 className="font-semibold text-lg">Ringkasan Pesanan</h2>
              <div className="divide-y">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between text-sm gap-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-stone-500">
                        {item.variant} × {item.quantity}{' '}
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-600 ml-2 underline"
                        >
                          Hapus
                        </button>
                      </p>
                    </div>
                    <span className="font-medium">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Ongkir</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `Rp ${shippingCost.toLocaleString('id-ID')}`}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2">
                  <span>Total Bayar</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
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
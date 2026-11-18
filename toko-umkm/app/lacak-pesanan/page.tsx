'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface OrderItem {
  id: string;
  product_name: string;
  variant: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  city: string;
  courier: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_number?: string;
  order_items: OrderItem[];
}

function LacakContent() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const searchOrders = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    const q = params.get('q');
    if (q) {
      setQuery(q);
      searchOrders(q);
    }
  }, [params]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    searchOrders(query);
  };

  const simulatePay = async (orderId: string) => {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, payment_status: 'paid', order_status: 'processing' }),
    });
    searchOrders(query);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Lacak Pesanan</h1>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Masukkan Nomor Pesanan (ORD-...) atau No. WhatsApp"
          className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm"
        />
        <button className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium">
          {loading ? 'Mencari...' : 'Lacak'}
        </button>
      </form>

      <div className="space-y-4">
        {orders.map((ord) => (
          <div key={ord.id} className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 border-b pb-3">
              <div>
                <p className="font-mono font-bold">{ord.order_number}</p>
                <p className="text-xs text-stone-500">
                  {ord.customer_name} · {ord.city} · {ord.courier}
                </p>
              </div>
              <div className="text-right text-xs">
                <p>Status: <strong>{ord.order_status}</strong></p>
                <p>Pembayaran: <strong>{ord.payment_status}</strong> ({ord.payment_method})</p>
              </div>
            </div>

            <div className="text-sm space-y-1">
              {ord.order_items?.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.product_name} ({i.variant}) × {i.quantity}</span>
                  <span>Rp {(i.price * i.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span>Rp {Number(ord.total_amount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {ord.tracking_number && (
              <p className="text-xs bg-stone-100 p-2 rounded">
                No. Resi: <strong className="font-mono">{ord.tracking_number}</strong>
              </p>
            )}

            {ord.payment_status === 'unpaid' && (
              <button
                onClick={() => simulatePay(ord.id)}
                className="px-4 py-2 bg-emerald-800 text-white text-xs font-medium rounded-lg"
              >
                Konfirmasi Pembayaran (Simulasi Gateway)
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function LacakPesananPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-sm">Memuat...</div>}>
        <LacakContent />
      </Suspense>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getSupabaseClient } from '@/lib/supabase-client';
import { PackageCheck, ArrowRight } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  variant: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  courier: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function PesananSayaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setLoggedIn(false);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/orders?mine=true', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-3xl font-bold">Pesanan Saya</h1>

        {loading ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-stone-500">
            Memuat riwayat pesanan...
          </div>
        ) : !loggedIn ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
            <p className="text-stone-600">Silakan masuk untuk melihat riwayat pesanan Anda.</p>
            <Link
              href="/login?redirect=/pesanan-saya"
              className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium"
            >
              Masuk Akun
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
            <PackageCheck className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-600">Belum ada pesanan pada akun ini.</p>
            <Link
              href="/katalog"
              className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium"
            >
              Pesan Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <p className="font-bold text-zinc-900">{order.order_number}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(order.created_at).toLocaleString('id-ID')} • {order.courier}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                      {order.order_status}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                      {order.payment_method} ({order.payment_status})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span className="text-stone-700">
                        {item.product_name} ({item.variant}) × {item.quantity}
                      </span>
                      <span className="font-medium">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <span className="font-bold">
                    Total: Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                  <Link
                    href={`/lacak-pesanan?q=${order.order_number}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Detail Lacak <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
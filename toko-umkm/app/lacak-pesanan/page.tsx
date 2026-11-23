'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { STORE_PAYMENT_CONFIG } from '@/lib/payment-config';
import { Copy, Check, QrCode, Landmark, MessageCircle } from 'lucide-react';

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

function formatPaymentStatus(status: string) {
  switch (status) {
    case 'paid':
      return 'Lunas';
    case 'cod_pending':
      return 'Bayar di Tempat (COD)';
    case 'unpaid':
      return 'Menunggu Pembayaran';
    default:
      return status;
  }
}

function formatOrderStatus(status: string) {
  switch (status) {
    case 'pending_payment':
      return 'Menunggu Pembayaran';
    case 'processing':
      return 'Sedang Diproses';
    case 'shipped':
      return 'Dalam Pengiriman';
    case 'completed':
      return 'Selesai';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
}

function LacakContent() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrisMissing, setQrisMissing] = useState(false);

  const searchOrders = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
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

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
    } catch {
      // Abaikan jika browser memblokir clipboard
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Lacak & Pembayaran Pesanan</h1>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Masukkan Nomor Pesanan (ORD-...) atau No. WhatsApp"
          className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm"
        />
        <button className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium cursor-pointer">
          {loading ? 'Mencari...' : 'Lacak'}
        </button>
      </form>

      <div className="space-y-4">
        {orders.map((ord) => {
          const isQris = ord.payment_method.toUpperCase().includes('QRIS');
          const bankInfo = STORE_PAYMENT_CONFIG.banks[ord.payment_method];
          const waText = encodeURIComponent(
            `Halo ${STORE_PAYMENT_CONFIG.storeName}, saya ingin konfirmasi pembayaran pesanan:\n` +
              `No. Pesanan: ${ord.order_number}\n` +
              `Nama: ${ord.customer_name}\n` +
              `Metode: ${ord.payment_method}\n` +
              `Total: Rp ${Number(ord.total_amount).toLocaleString('id-ID')}\n` +
              `Berikut saya lampirkan bukti pembayarannya.`
          );
          const waLink = `https://wa.me/${STORE_PAYMENT_CONFIG.whatsappNumber}?text=${waText}`;

          return (
            <div
              key={ord.id}
              className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <p className="font-mono font-bold text-lg">{ord.order_number}</p>
                  <p className="text-xs text-stone-500">
                    {ord.customer_name} · {ord.city} · {ord.courier}
                  </p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p>
                    Status:{' '}
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      {formatOrderStatus(ord.order_status)}
                    </span>
                  </p>
                  <p>
                    Pembayaran:{' '}
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        ord.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {formatPaymentStatus(ord.payment_status)}
                    </span>{' '}
                    ({ord.payment_method})
                  </p>
                </div>
              </div>

              <div className="text-sm space-y-1.5">
                {ord.order_items?.map((i) => (
                  <div key={i.id} className="flex justify-between gap-2">
                    <span>
                      {i.product_name} ({i.variant}) × {i.quantity}
                    </span>
                    <span className="font-medium shrink-0">
                      Rp {(i.price * i.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-stone-100">
                  <span>Total Bayar</span>
                  <span>Rp {Number(ord.total_amount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {ord.tracking_number && (
                <p className="text-xs bg-stone-100 p-2.5 rounded-lg">
                  No. Resi: <strong className="font-mono">{ord.tracking_number}</strong>
                </p>
              )}

              {/* Instruksi Pembayaran QRIS / Transfer Bank */}
              {ord.payment_status === 'unpaid' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                      {isQris ? (
                        <QrCode className="w-4 h-4" />
                      ) : (
                        <Landmark className="w-4 h-4" />
                      )}
                      <span>
                        {isQris
                          ? 'Scan QRIS untuk Membayar'
                          : `Instruksi Transfer ${bankInfo?.bankName || ord.payment_method}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(`amt-${ord.id}`, String(ord.total_amount))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
                    >
                      {copiedKey === `amt-${ord.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Nominal Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Salin Nominal
                        </>
                      )}
                    </button>
                  </div>

                  {isQris ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-stone-200 rounded-xl p-4">
                      {!qrisMissing ? (
                        <img
                          src={STORE_PAYMENT_CONFIG.qrisImagePath}
                          alt="QRIS Natama Taste"
                          onError={() => setQrisMissing(true)}
                          className="w-48 h-48 object-contain rounded-lg border border-stone-200 bg-white"
                        />
                      ) : (
                        <div className="w-48 h-48 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center p-4 text-center text-xs text-stone-500 space-y-1">
                          <QrCode className="w-8 h-8 text-stone-400" />
                          <p className="font-semibold text-stone-700">Foto QRIS Belum Ada</p>
                          <p>
                            Simpan foto QRIS toko Anda di{' '}
                            <code className="bg-stone-200 px-1 rounded">
                              public/images/qris.jpg
                            </code>
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-stone-600 space-y-2">
                        <p className="font-semibold text-sm text-zinc-900">
                          {STORE_PAYMENT_CONFIG.qrisMerchantName}
                        </p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Buka aplikasi GoPay, OVO, DANA, ShopeePay, atau Mobile Banking.</li>
                          <li>Scan kode QRIS di samping.</li>
                          <li>
                            Pastikan nominal sesuai:{' '}
                            <strong className="text-zinc-900">
                              Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                            </strong>
                          </li>
                          <li>Simpan bukti bayar lalu klik tombol WhatsApp di bawah.</li>
                        </ol>
                      </div>
                    </div>
                  ) : bankInfo ? (
                    <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-stone-500">{bankInfo.bankName}</p>
                          <p className="text-lg font-mono font-bold text-zinc-900 tracking-wide">
                            {bankInfo.accountNumber}
                          </p>
                          <p className="text-xs text-stone-600">
                            a.n. <strong>{bankInfo.accountHolder}</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`rek-${ord.id}`, bankInfo.accountNumber)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer shrink-0"
                        >
                          {copiedKey === `rek-${ord.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Tersalin!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Salin Rekening
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-700">
                      Silakan hubungi penjual via WhatsApp di bawah untuk detail rekening tujuan.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-stone-600">
                      Setelah transfer, kirim bukti pembayaran agar pesanan segera diproses penjual.
                    </p>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shrink-0"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Kirim Bukti ke WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
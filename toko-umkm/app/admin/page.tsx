'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  MessageCircle,
  Wallet,
  AlertTriangle,
  Store,
  MapPin,
  Pencil,
  Save,
  X,
  Utensils,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit?: string | null;
  image_url?: string | null;
}

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
  customer_phone?: string;
  address?: string;
  city?: string;
  courier?: string;
  total_amount: number;
  payment_method?: string;
  payment_status: string;
  order_status: string;
  tracking_number?: string;
  created_at?: string;
  order_items?: OrderItem[];
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
  return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'pending_payment':
      return { label: 'Menunggu Bayar', cls: 'bg-amber-100 text-amber-800' };
    case 'processing':
      return { label: 'Diproses', cls: 'bg-sky-100 text-sky-800' };
    case 'shipped':
      return { label: 'Dikirim / Siap', cls: 'bg-indigo-100 text-indigo-800' };
    case 'completed':
      return { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800' };
    case 'cancelled':
      return { label: 'Dibatalkan', cls: 'bg-red-100 text-red-700' };
    default:
      return { label: status, cls: 'bg-stone-100 text-stone-700' };
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-800' };
    case 'cod_pending':
      return { label: 'COD (Bayar di Tempat)', cls: 'bg-amber-100 text-amber-800' };
    case 'unpaid':
      return { label: 'Belum Dibayar', cls: 'bg-red-100 text-red-700' };
    default:
      return { label: status, cls: 'bg-stone-100 text-stone-700' };
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState('Penjual Natama Taste');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter pesanan & produk
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'Semua' | 'Makanan' | 'Minuman'>('Semua');
  const [productSearch, setProductSearch] = useState('');
  const [resiDrafts, setResiDrafts] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [failedCustom, setFailedCustom] = useState<Record<string, boolean>>({});
  const [failedDb, setFailedDb] = useState<Record<string, boolean>>({});

  // State edit menu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Makanan');
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState(false);

  // Form tambah menu
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('1 pcs');
  const [savingProduct, setSavingProduct] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/products', { cache: 'no-store' }),
        fetch('/api/orders', { cache: 'no-store' }),
      ]);
      const pData = await pRes.json();
      const oData = await oRes.json();

      const productList = Array.isArray(pData) ? pData : pData?.products || [];
      const orderList = Array.isArray(oData) ? oData : oData?.orders || [];

      setProducts(productList);
      setOrders(orderList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const loadSeller = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          setSellerName(
            profile?.full_name || user.email?.split('@')[0] || 'Penjual Natama Taste'
          );
        }
      } catch {
        // Abaikan jika gagal memuat nama
      }
    };
    loadSeller();
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.dispatchEvent(new Event('auth-updated'));
    router.push('/login');
    router.refresh();
  };

  const startEditProduct = (p: Product) => {
    setConfirmDeleteId(null);
    setEditingId(p.id);
    setEditSku(p.sku || '');
    setEditName(p.name);
    setEditCategory(p.category || 'Makanan');
    setEditUnit(p.unit || '');
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
  };

  const saveEditProduct = async (id: string) => {
    setUpdatingProduct(true);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/products/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          id,
          sku: editSku.trim(),
          name: editName.trim(),
          category: editCategory,
          unit: editUnit.trim(),
          price: Number(editPrice),
          stock: Number(editStock),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan perubahan menu.');
        return;
      }

      setEditingId(null);
      showToast('Perubahan menu & stok berhasil disimpan!');
      loadData();
    } finally {
      setUpdatingProduct(false);
    }
  };

  const addProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          category,
          price: Number(price),
          stock: Number(stock),
          unit: unit.trim() || '1 pcs',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan menu baru.');
        return;
      }
      setName('');
      setSku('');
      setPrice('');
      setStock('');
      setUnit('1 pcs');
      showToast('Menu baru berhasil ditambahkan!');
      loadData();
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    if (!res.ok) {
      showToast('Gagal menghapus menu (kemungkinan menu sudah pernah dipesan).');
      return;
    }
    showToast('Menu berhasil dihapus.');
    loadData();
  };

  const updateOrder = async (
    id: string,
    payload: { order_status?: string; payment_status?: string; tracking_number?: string }
  ) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    if (res.ok) {
      showToast('Status pesanan berhasil diperbarui.');
      loadData();
    } else {
      showToast('Gagal memperbarui status pesanan.');
    }
  };

  const paidRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );

  const pendingActionCount = useMemo(
    () =>
      orders.filter(
        (o) => o.payment_status === 'unpaid' || o.order_status === 'processing'
      ).length,
    [orders]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= 5).length,
    [products]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter =
        orderFilter === 'all' ||
        (orderFilter === 'unpaid' && o.payment_status === 'unpaid') ||
        (orderFilter !== 'unpaid' && o.order_status === orderFilter);

      const q = orderSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        (o.customer_phone || '').toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory =
        productCategoryFilter === 'Semua' ||
        p.category?.toLowerCase() === productCategoryFilter.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900 flex flex-col lg:flex-row">
      {/* Sidebar Khusus Penjual */}
      <aside className="lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-zinc-950 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
            <img
              src="/images/logo natama.png"
              alt="Natama Taste"
              className="w-11 h-11 rounded-full object-cover border border-zinc-700 bg-black shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">Natama Taste</p>
              <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                Panel Penjual
              </span>
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4" />
                Pesanan Masuk
              </span>
              {pendingActionCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-zinc-900">
                  {pendingActionCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                Kelola Menu & Stok
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-200">
                {products.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2 hidden lg:block">
          <p className="text-xs text-zinc-400 truncate">Login: {sellerName}</p>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat Tampilan Toko
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-medium text-red-300 hover:bg-red-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Konten Utama Dashboard */}
      <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 inline-flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-amber-700" />
              {activeTab === 'orders' ? 'Pesanan Masuk' : 'Kelola Menu & Stok'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Kelola transaksi pelanggan dan ketersediaan menu Natama Taste.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-zinc-800 hover:bg-stone-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-600 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white text-xs font-medium flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 4 Kartu Statistik */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1">
            <p className="text-xs text-stone-500 inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Omzet Lunas
            </p>
            <p className="text-lg sm:text-xl font-bold text-zinc-900">
              {formatRupiah(paidRevenue)}
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1">
            <p className="text-xs text-stone-500 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Perlu Diproses / Cek
            </p>
            <p className="text-lg sm:text-xl font-bold text-amber-700">
              {pendingActionCount} pesanan
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1">
            <p className="text-xs text-stone-500 inline-flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
              Total Pesanan
            </p>
            <p className="text-lg sm:text-xl font-bold text-zinc-900">{orders.length}</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1">
            <p className="text-xs text-stone-500 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Stok Menipis (&le;5)
            </p>
            <p className="text-lg sm:text-xl font-bold text-zinc-900">
              {lowStockCount} / {products.length} menu
            </p>
          </div>
        </div>

        {/* TAB 1: PESANAN MASUK */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'unpaid', label: 'Belum Bayar' },
                  { key: 'processing', label: 'Diproses' },
                  { key: 'shipped', label: 'Dikirim / Siap' },
                  { key: 'completed', label: 'Selesai' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setOrderFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      orderFilter === f.key
                        ? 'bg-zinc-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cari ORD-... atau nama"
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-500">
                Belum ada pesanan pada filter ini.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((o) => {
                  const statusBadge = getOrderStatusBadge(o.order_status);
                  const payBadge = getPaymentStatusBadge(o.payment_status);
                  const cleanPhone = (o.customer_phone || '').replace(/\D/g, '');
                  const waPhone = cleanPhone.startsWith('0')
                    ? `62${cleanPhone.slice(1)}`
                    : cleanPhone;

                  return (
                    <div
                      key={o.id}
                      className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-base text-zinc-900">
                              {o.order_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${payBadge.cls}`}>
                              {payBadge.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600">
                            Pemesan: <strong>{o.customer_name}</strong>
                            {o.customer_phone && ` • ${o.customer_phone}`}
                            {o.payment_method && ` • Via ${o.payment_method}`}
                          </p>
                          <p className="text-xs text-stone-500 inline-flex items-center gap-1">
                            {o.courier === 'Ambil di Outlet' ? (
                              <>
                                <Store className="w-3.5 h-3.5 text-amber-700" />
                                Ambil di Outlet
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                                {o.courier}: {o.address}
                                {o.city && o.city !== '-' ? `, ${o.city}` : ''}
                              </>
                            )}
                          </p>
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-base font-bold text-zinc-900">
                            {formatRupiah(o.total_amount)}
                          </p>
                          {o.created_at && (
                            <p className="text-[11px] text-stone-400">
                              {new Date(o.created_at).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>

                      {o.order_items && o.order_items.length > 0 && (
                        <div className="bg-stone-50 rounded-xl p-3 space-y-1 text-xs">
                          {o.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between gap-2">
                              <span className="text-zinc-800">
                                <strong>{item.quantity}x</strong> {item.product_name}{' '}
                                <span className="text-stone-500">({item.variant})</span>
                              </span>
                              <span className="font-semibold text-zinc-900 shrink-0">
                                {formatRupiah(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {o.payment_status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrder(o.id, {
                                  payment_status: 'paid',
                                  order_status:
                                    o.order_status === 'pending_payment'
                                      ? 'processing'
                                      : o.order_status,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Tandai Lunas & Proses
                            </button>
                          )}

                          <select
                            value={o.payment_status}
                            onChange={(e) =>
                              updateOrder(o.id, { payment_status: e.target.value })
                            }
                            className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                          >
                            <option value="unpaid">Belum Dibayar</option>
                            <option value="cod_pending">COD</option>
                            <option value="paid">Lunas</option>
                          </select>

                          <select
                            value={o.order_status}
                            onChange={(e) =>
                              updateOrder(o.id, { order_status: e.target.value })
                            }
                            className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                          >
                            <option value="pending_payment">Menunggu Bayar</option>
                            <option value="processing">Sedang Diproses</option>
                            <option value="shipped">Dikirim / Siap Diambil</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              value={resiDrafts[o.id] ?? o.tracking_number ?? ''}
                              onChange={(e) =>
                                setResiDrafts((prev) => ({
                                  ...prev,
                                  [o.id]: e.target.value,
                                }))
                              }
                              placeholder="No. Resi / Catatan..."
                              className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-mono w-36"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateOrder(o.id, {
                                  tracking_number: resiDrafts[o.id] ?? o.tracking_number ?? '',
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium cursor-pointer"
                            >
                              Simpan
                            </button>
                          </div>

                          {waPhone && (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Chat WA
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KELOLA MENU & STOK */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <form
              onSubmit={addProduct}
              className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
            >
              <h2 className="font-semibold text-base inline-flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-700" />
                Tambah Menu Baru
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <input
                  required
                  placeholder="Kode (NTM-MKN-15)"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="Nama Makanan / Minuman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-sm lg:col-span-2"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                </select>
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="Harga (Rp)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-sm"
                />
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="Stok"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  placeholder="Satuan (contoh: 1 pcs / Isi 4 pcs / R: 10k | L: 15k)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-sm w-full sm:w-80"
                />
                <button
                  disabled={savingProduct}
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
                >
                  {savingProduct ? 'Menyimpan...' : 'Simpan Menu Baru'}
                </button>
              </div>
            </form>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-semibold text-base">
                  Daftar Menu Natama Taste ({filteredProducts.length})
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex bg-stone-100 p-1 rounded-xl">
                    {(['Semua', 'Makanan', 'Minuman'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setProductCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          productCategoryFilter === cat
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-stone-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari menu..."
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs text-stone-500">
                      <th className="py-2.5 pr-4">Menu</th>
                      <th className="py-2.5 pr-4">Kode</th>
                      <th className="py-2.5 pr-4">Kategori</th>
                      <th className="py-2.5 pr-4">Harga</th>
                      <th className="py-2.5 pr-4">Stok</th>
                      <th className="py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProducts.map((p) => {
                      const customSrc = CUSTOM_IMAGES[p.name];
                      const tryingCustom = Boolean(customSrc && !failedCustom[p.id]);
                      const activeSrc = tryingCustom
                        ? customSrc
                        : !failedDb[p.id]
                        ? p.image_url
                        : null;
                      const isEditing = editingId === p.id;

                      if (isEditing) {
                        return (
                          <tr key={p.id} className="bg-amber-50/50">
                            <td className="py-3 pr-3 space-y-1.5">
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nama menu"
                                className="w-44 px-2.5 py-1.5 border border-stone-300 bg-white rounded-lg text-xs font-medium"
                              />
                              <input
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                placeholder="Satuan (1 pcs)"
                                className="w-44 block px-2.5 py-1 border border-stone-300 bg-white rounded-lg text-[11px]"
                              />
                            </td>
                            <td className="py-3 pr-3">
                              <input
                                value={editSku}
                                onChange={(e) => setEditSku(e.target.value)}
                                className="w-28 px-2 py-1.5 border border-stone-300 bg-white rounded-lg text-xs font-mono"
                              />
                            </td>
                            <td className="py-3 pr-3">
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="px-2 py-1.5 border border-stone-300 bg-white rounded-lg text-xs"
                              >
                                <option value="Makanan">Makanan</option>
                                <option value="Minuman">Minuman</option>
                              </select>
                            </td>
                            <td className="py-3 pr-3">
                              <input
                                type="number"
                                min={0}
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-24 px-2 py-1.5 border border-stone-300 bg-white rounded-lg text-xs"
                              />
                            </td>
                            <td className="py-3 pr-3">
                              <input
                                type="number"
                                min={0}
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                className="w-20 px-2 py-1.5 border border-stone-300 bg-white rounded-lg text-xs font-semibold"
                              />
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={updatingProduct}
                                  onClick={() => saveEditProduct(p.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Batal
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id}>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center text-stone-400">
                                {activeSrc ? (
                                  <img
                                    src={activeSrc}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                    onError={() => {
                                      if (tryingCustom) {
                                        setFailedCustom((prev) => ({
                                          ...prev,
                                          [p.id]: true,
                                        }));
                                      } else {
                                        setFailedDb((prev) => ({
                                          ...prev,
                                          [p.id]: true,
                                        }));
                                      }
                                    }}
                                  />
                                ) : (
                                  <Utensils className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900">{p.name}</p>
                                {p.unit && (
                                  <p className="text-[11px] text-stone-500">{p.unit}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-stone-500">{p.sku}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                p.category === 'Minuman'
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium">{formatRupiah(p.price)}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                p.stock <= 0
                                  ? 'bg-red-100 text-red-700'
                                  : p.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {confirmDeleteId === p.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => deleteProduct(p.id)}
                                  className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold cursor-pointer"
                                >
                                  Yakin Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded border text-xs text-stone-600 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => startEditProduct(p)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Hapus
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
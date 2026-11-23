'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  ImagePlus,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Upload,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit?: string;
  image_url?: string | null;
}

interface OrderItem {
  id?: string;
  product_name?: string;
  name?: string;
  quantity: number;
  price: number;
  variant?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address?: string;
  shipping_city?: string;
  total_amount: number;
  payment_method?: string;
  payment_status: string;
  order_status: string;
  tracking_number?: string;
  created_at?: string;
  order_items?: OrderItem[];
}

const CUSTOM_IMAGES: Record<string, string> = {
  // Makanan
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
  // Minuman
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

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState('Penjual');

  // Form Tambah Menu
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('1 pcs');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  // Edit Menu Inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Makanan');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [uploadingEditImg, setUploadingEditImg] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Konfirmasi Hapus Inline
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter & Pencarian
  const [orderFilter, setOrderFilter] = useState<string>('semua');
  const [orderSearch, setOrderSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState<string>('Semua');
  const [productSearch, setProductSearch] = useState('');

  // Input Resi & Fallback Gambar
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [failedCustom, setFailedCustom] = useState<Record<string, boolean>>({});
  const [failedDb, setFailedDb] = useState<Record<string, boolean>>({});

  // Toast Notifikasi
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getAccessToken = async () => {
    const supabaseClient = getSupabaseClient();
    const { data } = await supabaseClient.auth.getSession();
    return data.session?.access_token || '';
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

      const productList: Product[] = Array.isArray(pData) ? pData : pData?.products || [];
      const orderList: Order[] = Array.isArray(oData) ? oData : oData?.orders || [];

      setProducts(productList);
      setOrders(orderList);

      const initialTracking: Record<string, string> = {};
      orderList.forEach((o) => {
        initialTracking[o.id] = o.tracking_number || '';
      });
      setTrackingInputs(initialTracking);
    } catch {
      showToast('Gagal memuat data terbaru.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSeller = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const { data } = await supabaseClient.auth.getUser();
        if (data.user) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', data.user.id)
            .single();
          if (profile?.full_name) setSellerName(profile.full_name);
        }
      } catch {
        // abaikan
      }
    };
    loadSeller();
    loadData();
  }, []);

  const uploadImageFile = async (file: File): Promise<string> => {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.error || `Gagal mengunggah foto (Error ${res.status})`);
    }
    return data.url;
  };

  const handleNewFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar (JPG, PNG, atau WEBP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 5 MB.', 'error');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const clearNewImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingNew(true);
    try {
      let uploadedUrl: string | null = null;
      if (imageFile) {
        uploadedUrl = await uploadImageFile(imageFile);
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim(),
          name: name.trim(),
          category,
          price: Number(price),
          stock: Number(stock),
          unit: unit.trim() || '1 pcs',
          image_url: uploadedUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || `Gagal menambahkan menu (Error ${res.status})`, 'error');
        return;
      }

      setSku('');
      setName('');
      setPrice('');
      setStock('');
      setUnit('1 pcs');
      clearNewImage();
      showToast('Menu baru berhasil ditambahkan!');
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan menu baru.';
      showToast(msg, 'error');
    } finally {
      setSavingNew(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditSku(p.sku || '');
    setEditName(p.name || '');
    setEditCategory(p.category || 'Makanan');
    setEditPrice(String(p.price ?? 0));
    setEditStock(String(p.stock ?? 0));
    setEditUnit(p.unit || '1 pcs');
    setEditImageUrl(p.image_url || null);
  };

  const handleEditFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditImg(true);
    try {
      const url = await uploadImageFile(file);
      setEditImageUrl(url);
      showToast('Foto baru siap disimpan. Klik tombol Simpan di baris ini.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto.';
      showToast(msg, 'error');
    } finally {
      setUploadingEditImg(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/products/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id,
          sku: editSku.trim(),
          name: editName.trim(),
          category: editCategory,
          price: Number(editPrice),
          stock: Number(editStock),
          unit: editUnit.trim() || '1 pcs',
          image_url: editImageUrl,
        }),
      });

      if (res.status === 404 || res.status === 405) {
        showToast(`Gagal menyimpan (Error ${res.status}). Pastikan file update/route.ts sudah dibuat.`, 'error');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || `Gagal menyimpan perubahan (Error ${res.status})`, 'error');
        return;
      }

      setEditingId(null);
      showToast('Perubahan menu berhasil disimpan!');
      await loadData();
    } catch {
      showToast('Terjadi kesalahan jaringan saat menyimpan.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Gagal menghapus menu.', 'error');
        return;
      }
      setConfirmDeleteId(null);
      showToast('Menu berhasil dihapus.');
      await loadData();
    } catch {
      showToast('Terjadi kesalahan saat menghapus.', 'error');
    }
  };

  const updateOrder = async (
    id: string,
    updates: { order_status?: string; payment_status?: string; tracking_number?: string },
    successMsg = 'Status pesanan diperbarui!'
  ) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Gagal memperbarui pesanan.', 'error');
        return;
      }
      showToast(successMsg);
      await loadData();
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  const handleLogout = async () => {
    const supabaseClient = getSupabaseClient();
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  // Hitung KPI
  const paidRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingOrdersCount = orders.filter(
    (o) => o.payment_status !== 'paid' || o.order_status === 'pending'
  ).length;

  const lowStockCount = products.filter((p) => Number(p.stock) <= 5).length;

  // Filter Pesanan
  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchSearch =
      !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (orderFilter === 'perlu_proses') {
      return o.payment_status !== 'paid' || o.order_status === 'pending';
    }
    if (orderFilter === 'diproses') return o.order_status === 'processing';
    if (orderFilter === 'dikirim') return o.order_status === 'shipped';
    if (orderFilter === 'selesai') return o.order_status === 'completed';
    return true;
  });

  // Filter Menu
  const filteredProducts = products.filter((p) => {
    const matchCat = productCatFilter === 'Semua' || p.category === productCatFilter;
    const q = productSearch.toLowerCase();
    const matchSearch =
      !q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const getProductImage = (p: Product) => {
    if (p.image_url && p.image_url.includes('menu-images') && !failedDb[p.id]) {
      return p.image_url;
    }
    const custom = CUSTOM_IMAGES[p.name];
    if (custom && !failedCustom[p.id]) return custom;
    if (p.image_url && !failedDb[p.id]) return p.image_url;
    return null;
  };

  const formatWaNumber = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    return digits;
  };

  return (
    <div className="min-h-screen flex bg-[#F8F7F4] text-zinc-900">
      {/* Sidebar Kiri */}
      <aside className="w-64 bg-zinc-950 text-white flex flex-col justify-between shrink-0 min-h-screen sticky top-0">
        <div className="p-5 space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo natama.png"
              alt="Logo Natama Taste"
              className="w-11 h-11 rounded-full object-cover border border-amber-500/40 bg-zinc-900"
            />
            <div>
              <div className="font-bold text-base leading-tight">Natama Taste</div>
              <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-300 rounded">
                Panel Penjual
              </span>
            </div>
          </div>

          {/* Navigasi */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4" />
                <span>Pesanan Masuk</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'orders' ? 'bg-white text-orange-600' : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'products'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Kelola Menu & Stok</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'products' ? 'bg-white text-orange-600' : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                {products.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-5 border-t border-zinc-800 space-y-2.5">
          <div className="text-xs text-zinc-400 truncate">Login: {sellerName}</div>
          <Link
            href="/katalog"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-200 hover:bg-zinc-900 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Tampilan Toko</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-red-950/60 border border-red-900/60 text-xs font-medium text-red-300 hover:bg-red-900/60 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2.5">
              {activeTab === 'orders' ? (
                <ShoppingCart className="w-6 h-6 text-orange-500" />
              ) : (
                <LayoutGrid className="w-6 h-6 text-orange-500" />
              )}
              <span>{activeTab === 'orders' ? 'Pesanan Masuk' : 'Kelola Menu & Stok'}</span>
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Kelola transaksi pelanggan dan ketersediaan menu Natama Taste.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium hover:bg-stone-50 transition"
          >
            <RefreshCw className={`w-4 h-4 text-stone-600 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memuat...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* 4 Kartu KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Omzet Lunas</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              Rp {paidRevenue.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Perlu Diproses / Cek</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-2">
              {pendingOrdersCount} pesanan
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <span>Total Pesanan</span>
            </div>
            <div className="text-2xl font-bold mt-2">{orders.length}</div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Stok Menipis (≤5)</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              <span className={lowStockCount > 0 ? 'text-red-600' : 'text-zinc-900'}>
                {lowStockCount}
              </span>{' '}
              / {products.length} menu
            </div>
          </div>
        </div>

        {/* TAB 1: PESANAN MASUK */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'perlu_proses', label: 'Perlu Cek / Proses' },
                  { id: 'diproses', label: 'Sedang Diproses' },
                  { id: 'dikirim', label: 'Dikirim' },
                  { id: 'selesai', label: 'Selesai' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      orderFilter === f.id
                        ? 'bg-zinc-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nomor order, nama, atau WA..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-2 border border-stone-200 rounded-xl text-sm w-full"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-stone-500 text-sm">
                Belum ada pesanan di kategori ini.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isPaid = order.payment_status === 'paid';
                  const isPickup =
                    !order.shipping_address ||
                    order.shipping_address.toLowerCase().includes('ambil di outlet');
                  const waNumber = formatWaNumber(order.customer_phone);

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4"
                    >
                      {/* Header Order */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-zinc-900">
                              {order.order_number}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isPaid ? 'Lunas' : 'Menunggu Pembayaran'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                              {order.payment_method || 'QRIS / Transfer'}
                            </span>
                          </div>
                          <div className="text-sm font-semibold mt-1.5">
                            {order.customer_name}{' '}
                            <span className="text-stone-500 font-normal">
                              ({order.customer_phone})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                            {isPickup ? (
                              <>
                                <Store className="w-3.5 h-3.5 text-stone-400" />
                                <span>Ambil di Outlet</span>
                              </>
                            ) : (
                              <>
                                <Bike className="w-3.5 h-3.5 text-stone-400" />
                                <span>
                                  Kirim ke: {order.shipping_address}
                                  {order.shipping_city ? `, ${order.shipping_city}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-stone-500">Total Tagihan</div>
                          <div className="text-xl font-bold text-orange-600">
                            Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                          </div>
                          {order.created_at && (
                            <div className="text-xs text-stone-400 mt-0.5">
                              {new Date(order.created_at).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Daftar Item */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="bg-stone-50 rounded-xl p-3 space-y-1.5">
                          {order.order_items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <div>
                                <span className="font-medium">
                                  {item.quantity}x {item.product_name || item.name}
                                </span>
                                {item.variant && (
                                  <span className="text-xs text-stone-500 ml-2">
                                    ({item.variant})
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-stone-700">
                                Rp{' '}
                                {(
                                  Number(item.price || 0) * Number(item.quantity || 1)
                                ).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Aksi Penjual */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {!isPaid && (
                            <button
                              onClick={() =>
                                updateOrder(
                                  order.id,
                                  { payment_status: 'paid', order_status: 'processing' },
                                  'Pesanan ditandai Lunas & Diproses!'
                                )
                              }
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Tandai Lunas & Proses</span>
                            </button>
                          )}

                          <select
                            value={order.order_status || 'pending'}
                            onChange={(e) =>
                              updateOrder(order.id, { order_status: e.target.value })
                            }
                            className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium bg-white"
                          >
                            <option value="pending">Menunggu (Pending)</option>
                            <option value="processing">Sedang Diproses / Dimasak</option>
                            <option value="shipped">Dikirim / Siap Diambil</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>

                          {waNumber && (
                            <a
                              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                `Halo ${order.customer_name}, kami dari Natama Taste terkait pesanan ${order.order_number}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Chat WA Pembeli</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="No. Resi / Info Kurir..."
                            value={trackingInputs[order.id] ?? ''}
                            onChange={(e) =>
                              setTrackingInputs((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-stone-200 rounded-xl text-xs w-48"
                          />
                          <button
                            onClick={() =>
                              updateOrder(
                                order.id,
                                { tracking_number: trackingInputs[order.id] || '' },
                                'Info resi/kurir tersimpan!'
                              )
                            }
                            className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition"
                          >
                            Simpan Resi
                          </button>
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
            {/* Form Tambah Menu Baru */}
            <form
              onSubmit={handleAddProduct}
              className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
            >
              <h2 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-600" />
                <span>Tambah Menu Baru</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <input
                  required
                  placeholder="Kode (NTM-MKN-15)"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  placeholder="Nama Makanan / Minuman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm sm:col-span-2"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm bg-white"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                </select>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Harga (Rp)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm"
                />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Stok"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <input
                  placeholder="Satuan (contoh: 1 pcs / Isi 4 pcs / R: 10k | L: 15k)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm"
                />

                {/* Upload Gambar */}
                <div className="flex items-center gap-4 border border-dashed border-stone-300 rounded-xl p-2.5 bg-stone-50/70">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview menu baru"
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-stone-200/70 flex items-center justify-center text-stone-400 shrink-0">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-zinc-800 hover:bg-stone-100 transition">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span>{imageFile ? 'Ganti Gambar' : 'Upload Gambar Menu'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNewFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-stone-500 mt-1 truncate">
                      {imageFile ? imageFile.name : 'Format JPG/PNG/WEBP (Maks 5 MB)'}
                    </p>
                  </div>

                  {imageFile && (
                    <button
                      type="button"
                      onClick={clearNewImage}
                      className="text-xs text-red-600 hover:underline px-2 shrink-0"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNew}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition"
                >
                  {savingNew ? 'Menyimpan...' : 'Simpan Menu Baru'}
                </button>
              </div>
            </form>

            {/* Daftar Menu */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-base">
                  Daftar Menu Natama Taste ({filteredProducts.length})
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    {['Semua', 'Makanan', 'Minuman'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setProductCatFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          productCatFilter === cat
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-stone-600 hover:text-zinc-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-48">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari menu..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 pr-3.5 py-1.5 border border-stone-200 rounded-xl text-sm w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs text-stone-500">
                      <th className="py-3 pr-3">Menu</th>
                      <th className="py-3 px-3">Kode</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Harga</th>
                      <th className="py-3 px-3">Stok</th>
                      <th className="py-3 pl-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProducts.map((p) => {
                      const isEditing = editingId === p.id;
                      const imgSrc = getProductImage(p);

                      if (isEditing) {
                        return (
                          <tr key={p.id} className="bg-amber-50/50">
                            <td className="py-3 pr-3 space-y-2">
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm bg-white"
                                placeholder="Nama menu"
                              />
                              <input
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                                placeholder="Satuan"
                              />
                              <div className="flex items-center gap-2">
                                {editImageUrl && (
                                  <img
                                    src={editImageUrl}
                                    alt="Preview"
                                    className="w-9 h-9 rounded object-cover border border-stone-300"
                                  />
                                )}
                                <label className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-medium hover:bg-stone-50">
                                  <Upload className="w-3 h-3 text-stone-600" />
                                  <span>{uploadingEditImg ? 'Mengunggah...' : 'Ganti Foto'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditFileChange}
                                    disabled={uploadingEditImg}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <input
                                value={editSku}
                                onChange={(e) => setEditSku(e.target.value)}
                                className="w-28 px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-mono bg-white"
                              />
                            </td>
                            <td className="py-3 px-3 align-top">
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                              >
                                <option value="Makanan">Makanan</option>
                                <option value="Minuman">Minuman</option>
                              </select>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <input
                                type="number"
                                min="0"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-24 px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm bg-white"
                              />
                            </td>
                            <td className="py-3 px-3 align-top">
                              <input
                                type="number"
                                min="0"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                className="w-20 px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm font-semibold bg-white"
                              />
                            </td>
                            <td className="py-3 pl-3 text-right align-top">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleSaveEdit(p.id)}
                                  disabled={savingEdit || uploadingEditImg}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>{savingEdit ? '...' : 'Simpan'}</span>
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Batal</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id} className="hover:bg-stone-50/70">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-3">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={p.name}
                                  onError={() => {
                                    if (CUSTOM_IMAGES[p.name] === imgSrc) {
                                      setFailedCustom((prev) => ({ ...prev, [p.id]: true }));
                                    } else {
                                      setFailedDb((prev) => ({ ...prev, [p.id]: true }));
                                    }
                                  }}
                                  className="w-11 h-11 rounded-xl object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                                  <Utensils className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-zinc-900">{p.name}</div>
                                <div className="text-xs text-stone-500">{p.unit || '1 pcs'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-stone-500">{p.sku}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                                p.category === 'Minuman'
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium">
                            Rp {Number(p.price).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                Number(p.stock) <= 5
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right">
                            {confirmDeleteId === p.id ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold"
                                >
                                  Yakin Hapus
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-3">
                                <button
                                  onClick={() => startEdit(p)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
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

      {/* Toast Mengambang Kanan Bawah */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
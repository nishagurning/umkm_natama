'use client';

import { useEffect, useState, FormEvent } from 'react';
import Navbar from '@/components/Navbar';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  tracking_number?: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Kopi & Minuman');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const loadData = async () => {
    const [pRes, oRes] = await Promise.all([fetch('/api/products'), fetch('/api/orders')]);
    const pData = await pRes.json();
    const oData = await oRes.json();
    setProducts(pData.products || []);
    setOrders(oData.orders || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addProduct = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sku,
        category,
        price: Number(price),
        stock: Number(stock),
      }),
    });
    setName('');
    setSku('');
    setPrice('');
    setStock('');
    loadData();
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  const updateOrder = async (id: string, order_status: string, tracking_number: string) => {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, order_status, tracking_number }),
    });
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <h1 className="text-3xl font-bold">Dashboard Admin UMKM</h1>

        {/* Tambah Produk */}
        <form onSubmit={addProduct} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Tambah Produk Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input required placeholder="SKU (PRD-004)" value={sku} onChange={(e) => setSku(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <input required placeholder="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 border rounded-lg text-sm sm:col-span-2" />
            <input required type="number" placeholder="Harga (Rp)" value={price} onChange={(e) => setPrice(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <input required type="number" placeholder="Stok" value={stock} onChange={(e) => setStock(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option>Kopi & Minuman</option>
              <option>Kriya & Keramik</option>
              <option>Fesyen Lokal</option>
              <option>Kuliner Kemasan</option>
            </select>
            <button className="px-5 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium">
              Simpan Produk
            </button>
          </div>
        </form>

        {/* Tabel Produk */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 overflow-x-auto">
          <h2 className="font-semibold text-lg">Daftar Produk ({products.length})</h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-stone-500">
                <th className="py-2">SKU</th>
                <th className="py-2">Nama</th>
                <th className="py-2">Harga</th>
                <th className="py-2">Stok</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 font-mono text-xs">{p.sku}</td>
                  <td className="py-2.5 font-medium">{p.name}</td>
                  <td className="py-2.5">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                  <td className="py-2.5">{p.stock}</td>
                  <td className="py-2.5">
                    <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-600 underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabel Pesanan */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 overflow-x-auto">
          <h2 className="font-semibold text-lg">Pesanan Masuk ({orders.length})</h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-stone-500">
                <th className="py-2">No. Pesanan</th>
                <th className="py-2">Pelanggan</th>
                <th className="py-2">Total</th>
                <th className="py-2">Bayar</th>
                <th className="py-2">Status & Resi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="py-3">{o.customer_name}</td>
                  <td className="py-3">Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                  <td className="py-3 text-xs">{o.payment_status}</td>
                  <td className="py-3 flex gap-2 items-center">
                    <select
                      defaultValue={o.order_status}
                      onChange={(e) => updateOrder(o.id, e.target.value, o.tracking_number || '')}
                      className="px-2 py-1 border rounded text-xs bg-white"
                    >
                      <option value="pending_payment">pending_payment</option>
                      <option value="processing">processing</option>
                      <option value="shipped">shipped</option>
                      <option value="completed">completed</option>
                    </select>
                    <input
                      defaultValue={o.tracking_number || ''}
                      placeholder="Input Resi..."
                      onBlur={(e) => updateOrder(o.id, o.order_status, e.target.value)}
                      className="px-2 py-1 border rounded text-xs font-mono w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
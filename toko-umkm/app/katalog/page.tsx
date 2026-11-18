'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  variants: string[];
  description: string;
}

export default function KatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered =
    category === 'Semua' ? products : products.filter((p) => p.category === category);

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('umkm_cart') || '[]');
    const variant = product.variants?.[0] || 'Standar';
    const existing = cart.find((c: { id: string; variant: string }) => c.id === product.id && c.variant === variant);

    if (existing) {
      existing.quantity = Math.min(product.stock, existing.quantity + 1);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        variant,
        quantity: 1,
      });
    }

    localStorage.setItem('umkm_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setNotif(`"${product.name}" masuk keranjang`);
    setTimeout(() => setNotif(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Katalog Produk</h1>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
                  category === cat
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Memuat produk...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <p className="text-xs text-stone-500">
                    {p.category} · Stok {p.stock}
                  </p>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-sm text-stone-600">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-bold">
                    Rp {Number(p.price).toLocaleString('id-ID')}
                  </span>
                  <button
                    disabled={p.stock <= 0}
                    onClick={() => addToCart(p)}
                    className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:bg-stone-300"
                  >
                    {p.stock <= 0 ? 'Habis' : '+ Keranjang'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {notif && (
          <div className="fixed bottom-5 right-5 bg-zinc-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg">
            {notif}
          </div>
        )}
      </main>
    </div>
  );
}
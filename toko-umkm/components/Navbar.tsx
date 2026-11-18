'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const syncCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('umkm_cart') || '[]');
      const total = saved.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    syncCart();
    window.addEventListener('cart-updated', syncCart);
    return () => window.removeEventListener('cart-updated', syncCart);
  }, []);

  const links = [
    { href: '/', label: 'Beranda' },
    { href: '/katalog', label: 'Katalog' },
    { href: '/lacak-pesanan', label: 'Lacak Pesanan' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          UMKM Natama
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? 'text-zinc-900 underline underline-offset-4'
                  : 'hover:text-zinc-900'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Keranjang ({cartCount})</span>
        </Link>
      </div>
    </header>
  );
}
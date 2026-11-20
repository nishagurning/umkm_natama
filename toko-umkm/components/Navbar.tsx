'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const raw = localStorage.getItem('cart');
        const cart = raw ? JSON.parse(raw) : [];
        const total = Array.isArray(cart)
          ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
          : 0;
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cart-updated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/katalog', label: 'Katalog' },
    { href: '/lacak-pesanan', label: 'Lacak Pesanan' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo + Nama Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/images/logo natama.png"
            alt="Logo Natama Taste"
            className="w-14 h-14 rounded-full object-cover border border-stone-200 bg-black"
          />
          <div className="leading-tight">
            <span className="block font-bold text-stone-900 text-lg">
              Natama Taste
            </span>
            <span className="block text-xs font-medium text-amber-700">
              Na Tabo Do On
            </span>
          </div>
        </Link>

        {/* Menu Navigasi */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition ${
                  active
                    ? 'font-semibold text-stone-900 underline underline-offset-4'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Tombol Keranjang */}
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Keranjang ({cartCount})</span>
        </Link>
      </div>
    </header>
  );
}
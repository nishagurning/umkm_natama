'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, LogIn, LogOut, Store, User } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';

interface UserInfo {
  name: string;
  role: 'pembeli' | 'penjual';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (Array.isArray(cart)) {
          const total = cart.reduce(
            (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
            0
          );
          setCartCount(total);
        }
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
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserInfo(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      setUserInfo({
        name:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Akun',
        role: profile?.role === 'penjual' ? 'penjual' : 'pembeli',
      });
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });
    window.addEventListener('auth-updated', loadUser);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener('auth-updated', loadUser);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUserInfo(null);
    window.dispatchEvent(new Event('auth-updated'));
    if (pathname.startsWith('/admin') || pathname.startsWith('/pesanan-saya')) {
      router.push('/katalog');
    }
    router.refresh();
  };

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition whitespace-nowrap ${
      pathname === href
        ? 'text-zinc-900 underline underline-offset-4 font-semibold'
        : 'text-stone-600 hover:text-zinc-900'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/images/logo natama.png"
            alt="Logo Natama Taste"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-stone-200 bg-black"
          />
          <div className="leading-tight">
            <span className="block text-base sm:text-lg font-bold text-zinc-900">
              Natama Taste
            </span>
            <span className="block text-xs font-medium text-amber-700">
              Na Tabo Do On
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={navLinkClass('/')}>
            Beranda
          </Link>
          <Link href="/katalog" className={navLinkClass('/katalog')}>
            Katalog
          </Link>
          <Link href="/lacak-pesanan" className={navLinkClass('/lacak-pesanan')}>
            Lacak Pesanan
          </Link>
          {userInfo?.role === 'pembeli' && (
            <Link href="/pesanan-saya" className={navLinkClass('/pesanan-saya')}>
              Pesanan Saya
            </Link>
          )}
          {userInfo?.role === 'penjual' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              <Store className="w-4 h-4" />
              Dashboard Penjual
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Keranjang</span> ({cartCount})
          </Link>

          {userInfo ? (
            <div className="flex items-center gap-2">
              <Link
                href={userInfo.role === 'penjual' ? '/admin' : '/pesanan-saya'}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-zinc-800 hover:bg-stone-100"
              >
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span className="max-w-[110px] truncate">{userInfo.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    userInfo.role === 'penjual'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {userInfo.role === 'penjual' ? 'Penjual' : 'Pembeli'}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:text-red-600 hover:border-red-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-sm font-medium text-zinc-900 hover:bg-stone-50"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>

      {/* Menu navigasi mobile */}
      <div className="md:hidden border-t border-stone-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs">
        <Link href="/" className={navLinkClass('/')}>
          Beranda
        </Link>
        <Link href="/katalog" className={navLinkClass('/katalog')}>
          Katalog
        </Link>
        <Link href="/lacak-pesanan" className={navLinkClass('/lacak-pesanan')}>
          Lacak Pesanan
        </Link>
        {userInfo?.role === 'pembeli' && (
          <Link href="/pesanan-saya" className={navLinkClass('/pesanan-saya')}>
            Pesanan Saya
          </Link>
        )}
        {userInfo?.role === 'penjual' && (
          <Link href="/admin" className="font-semibold text-amber-700 whitespace-nowrap">
            Dashboard Penjual
          </Link>
        )}
      </div>
    </header>
  );
}
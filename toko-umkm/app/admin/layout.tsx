'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase-client';
import { ShieldAlert, Lock } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'unauthenticated' | 'forbidden'>(
    'loading'
  );

  useEffect(() => {
    const checkSeller = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setStatus('unauthenticated');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'penjual') {
          setStatus('allowed');
        } else {
          setStatus('forbidden');
        }
      } catch {
        setStatus('unauthenticated');
      }
    };

    checkSeller();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <p className="text-sm text-stone-600">Memeriksa akses penjual...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-600 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900">Khusus Akun Penjual</h1>
          <p className="text-sm text-stone-600">
            Silakan masuk menggunakan akun Penjual Natama Taste untuk mengakses halaman ini.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login?redirect=/admin"
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
            >
              Masuk Penjual
            </Link>
            <Link
              href="/katalog"
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium text-zinc-800"
            >
              Ke Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900">Akses Ditolak</h1>
          <p className="text-sm text-stone-600">
            Akun Anda terdaftar sebagai <strong>Pembeli</strong>. Halaman ini hanya dapat diakses
            oleh akun <strong>Penjual</strong>.
          </p>
          <Link
            href="/katalog"
            className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
          >
            Kembali Belanja
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
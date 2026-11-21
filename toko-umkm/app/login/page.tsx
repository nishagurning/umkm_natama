'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getSupabaseClient } from '@/lib/supabase-client';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const translateAuthError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) return 'Email atau password salah.';
    if (lower.includes('email not confirmed'))
      return 'Email belum dikonfirmasi. Cek email atau matikan Confirm Email di Supabase.';
    if (lower.includes('user already registered'))
      return 'Email sudah terdaftar. Silakan pindah ke tab Masuk.';
    if (lower.includes('password should be at least'))
      return 'Password minimal 6 karakter.';
    return msg;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (mode === 'register') {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });

        if (signUpErr) throw signUpErr;

        if (data.session) {
          window.dispatchEvent(new Event('auth-updated'));
          router.push(redirectTo && redirectTo !== '/admin' ? redirectTo : '/katalog');
          router.refresh();
          return;
        }

        setMessage('Pendaftaran berhasil! Silakan masuk menggunakan email dan password Anda.');
        setMode('login');
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInErr) throw signInErr;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'pembeli';
        window.dispatchEvent(new Event('auth-updated'));

        if (redirectTo) {
          if (redirectTo.startsWith('/admin') && role !== 'penjual') {
            router.push('/katalog');
          } else {
            router.push(redirectTo);
          }
        } else if (role === 'penjual') {
          router.push('/admin');
        } else {
          router.push('/katalog');
        }
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? translateAuthError(err.message) : 'Terjadi kesalahan saat memproses akun.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link
        href="/katalog"
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </Link>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900">
            {mode === 'login' ? 'Masuk Akun' : 'Daftar Akun Pembeli'}
          </h1>
          <p className="text-sm text-stone-500">
            {mode === 'login'
              ? 'Masuk sebagai Pembeli atau Penjual Natama Taste.'
              : 'Buat akun pembeli untuk memesan dan melihat riwayat pesanan.'}
          </p>
        </div>

        <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              mode === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            Daftar Pembeli
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  placeholder="Contoh: Siti Aminah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  required
                  placeholder="0812..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Email</label>
            <input
              required
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Password</label>
            <input
              required
              type="password"
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading
              ? 'Memproses...'
              : mode === 'login'
              ? 'Masuk Sekarang'
              : 'Daftar Akun Pembeli'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <Navbar />
      <Suspense fallback={<div className="p-10 text-center text-stone-500">Memuat...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
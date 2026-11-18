import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col">
      {/* Header Navigasi */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            UMKM Natama
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="/" className="text-zinc-900 underline underline-offset-4">
              Beranda
            </Link>
            <Link href="/katalog" className="hover:text-zinc-900">
              Katalog
            </Link>
            <Link href="/lacak-pesanan" className="hover:text-zinc-900">
              Lacak Pesanan
            </Link>
            <Link href="/admin" className="hover:text-zinc-900">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Beranda */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 flex flex-col justify-center space-y-6">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
          Toko Online Resmi UMKM Natama
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
          Produk Lokal Pilihan Langsung dari Pengrajin & Produsen
        </h1>
        <p className="text-base text-stone-600 max-w-xl leading-relaxed">
          Belanja produk unggulan UMKM dengan kualitas terkurasi, pembayaran otomatis
          QRIS &amp; Virtual Account, serta pelacakan pengiriman yang transparan.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/katalog"
            className="px-6 py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Jelajahi Katalog Produk
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-lg border border-stone-300 bg-white text-zinc-900 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Buka Dashboard Admin
          </Link>
        </div>
      </main>
    </div>
  );
}
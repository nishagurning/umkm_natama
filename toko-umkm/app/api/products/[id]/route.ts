import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key =
    serviceKey && !serviceKey.startsWith('tempel_') ? serviceKey : anonKey;

  if (!url || !key) {
    throw new Error('Konfigurasi Supabase di .env.local belum lengkap.');
  }

  return createClient(url, key);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Menu tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Gagal memuat detail menu.',
      },
      { status: 500 }
    );
  }
}
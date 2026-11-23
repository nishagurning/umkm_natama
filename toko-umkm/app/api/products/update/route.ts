import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Silakan masuk sebagai penjual.' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase belum lengkap.' }, { status: 500 });
    }

    const authClient = createClient(url, anonKey);
    const { data: authData, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Sesi login tidak valid.' }, { status: 401 });
    }

    const supabase = createSupabaseAdmin();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role !== 'penjual') {
      return NextResponse.json(
        { error: 'Hanya akun Penjual yang dapat mengedit menu.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID menu tidak ditemukan.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.sku !== undefined) updates.sku = String(body.sku).trim();
    if (body.category !== undefined) updates.category = String(body.category).trim();
    if (body.unit !== undefined) updates.unit = String(body.unit).trim();
    if (body.price !== undefined) updates.price = Math.max(0, Number(body.price) || 0);
    if (body.stock !== undefined) updates.stock = Math.max(0, Number(body.stock) || 0);

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal memperbarui menu.' },
      { status: 500 }
    );
  }
}
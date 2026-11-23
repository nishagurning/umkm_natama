import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sku', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const body = await req.json();

    const { sku, name, category, price, stock, unit, image_url } = body;

    if (!sku || !name || !category) {
      return NextResponse.json({ error: 'SKU, nama, dan kategori wajib diisi.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          sku: String(sku).trim(),
          name: String(name).trim(),
          category: String(category).trim(),
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          unit: unit ? String(unit).trim() : '1 pcs',
          image_url: image_url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan produk baru.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produk wajib disertakan.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/products error:', err);
    return NextResponse.json({ error: 'Gagal menghapus produk.' }, { status: 500 });
  }
}
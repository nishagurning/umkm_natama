import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('products')
    .insert({
      sku: body.sku,
      name: body.name,
      category: body.category || 'Lainnya',
      price: Number(body.price),
      stock: Number(body.stock),
      unit: body.unit || '1 pcs',
      variants: body.variants?.length ? body.variants : ['Standar'],
      description: body.description || '',
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
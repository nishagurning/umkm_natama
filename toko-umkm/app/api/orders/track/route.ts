import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (!q) return NextResponse.json({ orders: [] });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .or(`order_number.ilike.%${q}%,customer_phone.ilike.%${q}%`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}
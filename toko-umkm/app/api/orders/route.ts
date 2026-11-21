import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase';

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const authClient = createClient(url, anonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const mineOnly = req.nextUrl.searchParams.get('mine') === 'true';

  if (mineOnly) {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Silakan masuk (login) terlebih dahulu untuk membuat pesanan.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const items = body.items as {
      id: string;
      variant?: string;
      note?: string;
      quantity: number;
    }[];

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang masih kosong.' }, { status: 400 });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);

      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.id)
        .single();

      if (!prod || prod.stock < qty) {
        return NextResponse.json(
          { error: `Stok produk ${prod?.name || ''} tidak mencukupi.` },
          { status: 400 }
        );
      }

      const rawVariant = (item.variant || 'Standar').trim();
      const lowerVariant = rawVariant.toLowerCase();
      const isLargeDrink =
        lowerVariant.includes('15k') ||
        (prod.category === 'Minuman' && lowerVariant.includes('large'));

      const unitPrice = isLargeDrink ? 15000 : prod.price;
      const cleanNote = (item.note || '').trim();
      const variantWithNote = cleanNote
        ? `${rawVariant} — Catatan: ${cleanNote}`
        : rawVariant;

      subtotal += unitPrice * qty;
      verifiedItems.push({
        prod,
        variant: variantWithNote,
        unitPrice,
        quantity: qty,
      });
    }

    const shippingCost = Number(body.shippingCost || 0);
    const totalAmount = subtotal + shippingCost;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const isCod = body.paymentMethod === 'COD';

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        address: body.address,
        city: body.city,
        courier: body.courier,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        payment_method: body.paymentMethod,
        payment_status: isCod ? 'cod_pending' : 'unpaid',
        order_status: isCod ? 'processing' : 'pending_payment',
      })
      .select()
      .single();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      verifiedItems.map((v) => ({
        order_id: order.id,
        product_id: v.prod.id,
        product_name: v.prod.name,
        variant: v.variant,
        price: v.unitPrice,
        quantity: v.quantity,
      }))
    );

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    for (const v of verifiedItems) {
      await supabase
        .from('products')
        .update({ stock: Math.max(0, v.prod.stock - v.quantity) })
        .eq('id', v.prod.id);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal memproses pesanan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from('orders')
      .update({
        ...(body.order_status && { order_status: body.order_status }),
        ...(body.payment_status && { payment_status: body.payment_status }),
        ...(body.tracking_number !== undefined && { tracking_number: body.tracking_number }),
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ order: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal memperbarui pesanan.' },
      { status: 500 }
    );
  }
}
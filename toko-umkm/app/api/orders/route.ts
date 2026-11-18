import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createSupabaseAdmin();
  const items = body.items as { id: string; variant: string; quantity: number }[];

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Keranjang masih kosong.' }, { status: 400 });
  }

  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const { data: prod } = await supabase
      .from('products')
      .select('*')
      .eq('id', item.id)
      .single();

    if (!prod || prod.stock < item.quantity) {
      return NextResponse.json(
        { error: `Stok produk ${prod?.name || ''} tidak mencukupi.` },
        { status: 400 }
      );
    }

    subtotal += prod.price * item.quantity;
    verifiedItems.push({ prod, variant: item.variant, quantity: item.quantity });
  }

  const shippingCost = Number(body.shippingCost || 0);
  const totalAmount = subtotal + shippingCost;
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  const isCod = body.paymentMethod === 'COD';

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
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

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  await supabase.from('order_items').insert(
    verifiedItems.map((v) => ({
      order_id: order.id,
      product_id: v.prod.id,
      product_name: v.prod.name,
      variant: v.variant,
      price: v.prod.price,
      quantity: v.quantity,
    }))
  );

  for (const v of verifiedItems) {
    await supabase
      .from('products')
      .update({ stock: v.prod.stock - v.quantity })
      .eq('id', v.prod.id);
  }

  return NextResponse.json({ order }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
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
}
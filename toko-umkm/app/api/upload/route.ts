import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'menu-images';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Cek token penjual
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login ulang.' }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: 'Sesi login tidak valid.' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'penjual') {
      return NextResponse.json({ error: 'Hanya akun penjual yang boleh mengunggah gambar.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File gambar belum dipilih.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar (JPG, PNG, atau WEBP).' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran gambar maksimal 5 MB.' }, { status: 400 });
    }

    // Pastikan bucket menu-images ada & bersifat public
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error: createBucketErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
      if (createBucketErr) {
        return NextResponse.json(
          { error: `Gagal membuat penyimpanan gambar: ${createBucketErr.message}` },
          { status: 500 }
        );
      }
    }

    // Bersihkan nama file agar aman di URL
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .slice(0, 40);
    const filePath = `menu-${Date.now()}-${baseName || 'produk'}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: `Gagal mengunggah gambar: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengunggah gambar.' }, { status: 500 });
  }
}
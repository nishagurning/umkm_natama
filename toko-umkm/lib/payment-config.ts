export const STORE_PAYMENT_CONFIG = {
  storeName: 'Natama Taste',
  // Ganti dengan nomor WhatsApp Penjual (awali 62, tanpa tanda + atau 0 di depan)
  whatsappNumber: '6281234567890',
  // Simpan foto QRIS toko Anda di folder: toko-umkm/public/images/qris.jpg
  qrisImagePath: '/images/qris.jpg',
  qrisMerchantName: 'Natama Taste',
  banks: {
    'VA BCA': {
      bankName: 'Bank BCA',
      accountNumber: '1234567890', // <-- Ganti dengan No. Rekening BCA asli Anda
      accountHolder: 'Natama Taste', // <-- Ganti dengan nama pemilik rekening
    },
    'VA Mandiri': {
      bankName: 'Bank Mandiri',
      accountNumber: '0987654321', // <-- Ganti dengan No. Rekening Mandiri asli Anda
      accountHolder: 'Natama Taste', // <-- Ganti dengan nama pemilik rekening
    },
  } as Record<
    string,
    { bankName: string; accountNumber: string; accountHolder: string }
  >,
};
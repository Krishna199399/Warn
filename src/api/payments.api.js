import client from './client';

// ─── Legacy Razorpay API (kept for backward compatibility) ────────────────────
export const paymentsApi = {
  createRazorpayOrder:  (data) => client.post('/payments/razorpay/create-order', data),
  verifyRazorpayPayment:(data) => client.post('/payments/razorpay/verify', data),
};

// ─── Manual Payment System (UPI + Cash) ──────────────────────────────────────
export const manualPaymentsApi = {
  // Mini Stock (Buyer) — Get seller's UPI/contact info before paying
  getSellerProfile: (sellerId) =>
    client.get(`/manual-payments/seller-profile/${sellerId}`),

  // Mini Stock — Submit payment proof (multipart/form-data)
  submitProof: (formData) =>
    client.post('/manual-payments/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get proof status for a specific order
  getProofByOrder: (orderId) =>
    client.get(`/manual-payments/proof/${orderId}`),

  // Payment history (role-aware)
  getHistory: () =>
    client.get('/manual-payments/history'),

  // Whole Stock (Seller) — Pending payments dashboard list
  getPending: () =>
    client.get('/manual-payments/pending'),

  // Whole Stock — Stats (pending / verified / rejected counts)
  getStats: () =>
    client.get('/manual-payments/stats'),

  // Whole Stock — Approve or reject a proof
  verifyProof: (data) =>
    client.post('/manual-payments/verify', data),
};

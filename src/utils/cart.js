// Cart utility functions

export const calculateSubtotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateTax = (subtotal, taxRate = 0.18) => {
  return subtotal * taxRate;
};

export const calculateDeliveryCharge = (subtotal, freeShippingThreshold = 5000) => {
  return subtotal >= freeShippingThreshold ? 0 : 100;
};

export const applyDiscount = (subtotal, discountPercent = 0) => {
  return subtotal * (discountPercent / 100);
};

export const calculateTotal = (cart, options = {}) => {
  const {
    taxRate = 0.18,
    deliveryCharge = 100,
    discountPercent = 0,
    freeShippingThreshold = 5000,
  } = options;

  const subtotal = calculateSubtotal(cart);
  const discount = applyDiscount(subtotal, discountPercent);
  const subtotalAfterDiscount = subtotal - discount;
  const tax = calculateTax(subtotalAfterDiscount, taxRate);
  const delivery = subtotal >= freeShippingThreshold ? 0 : deliveryCharge;
  const total = subtotalAfterDiscount + tax + delivery;

  return {
    subtotal,
    discount,
    tax,
    delivery,
    total,
  };
};

export const validatePromoCode = (code) => {
  // Mock promo codes - replace with API call in production
  const promoCodes = {
    'SAVE10': { discount: 10, description: '10% off' },
    'SAVE20': { discount: 20, description: '20% off' },
    'FREESHIP': { discount: 0, description: 'Free shipping', freeShipping: true },
  };

  return promoCodes[code.toUpperCase()] || null;
};

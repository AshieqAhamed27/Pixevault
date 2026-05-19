export const coupons = [
  {
    code: 'PIXEL10',
    label: 'PixelVault launch discount',
    percent: 10,
    minSubtotal: 199,
    maxDiscount: 300,
  },
  {
    code: 'STUDENT15',
    label: 'Student savings',
    percent: 15,
    minSubtotal: 149,
    maxDiscount: 250,
    categories: ['career-placement', 'student-projects', 'ai-courses'],
  },
  {
    code: 'BUNDLE20',
    label: 'Bundle buyer discount',
    percent: 20,
    minSubtotal: 899,
    maxDiscount: 600,
    bundleOnly: true,
  },
];

export function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function findCoupon(code) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return coupons.find((coupon) => coupon.code === normalized) || null;
}

export function applyCouponToCart(code, items = [], products = []) {
  const coupon = findCoupon(code);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

  if (!coupon) {
    return {
      valid: false,
      code: normalizeCouponCode(code),
      label: '',
      discount: 0,
      message: code ? 'Coupon code was not found.' : '',
    };
  }

  if (subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      code: coupon.code,
      label: coupon.label,
      discount: 0,
      message: `Minimum cart value is Rs. ${coupon.minSubtotal.toLocaleString('en-IN')}.`,
    };
  }

  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const eligibleSubtotal = items.reduce((sum, item) => {
    const product = productBySlug.get(item.slug) || item;
    if (coupon.bundleOnly && product.bundle !== true && product.category !== 'product-bundles') return sum;
    if (Array.isArray(coupon.categories) && !coupon.categories.includes(product.category)) return sum;
    return sum + Number(item.price || 0) * Number(item.qty || 1);
  }, 0);

  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      code: coupon.code,
      label: coupon.label,
      discount: 0,
      message: coupon.bundleOnly
        ? 'This coupon is only for product bundles.'
        : 'This coupon is not valid for the selected products.',
    };
  }

  const rawDiscount = Math.round((eligibleSubtotal * coupon.percent) / 100);
  const discount = Math.min(rawDiscount, coupon.maxDiscount || rawDiscount, subtotal);

  return {
    valid: true,
    code: coupon.code,
    label: coupon.label,
    percent: coupon.percent,
    discount,
    message: `${coupon.label} applied.`,
  };
}

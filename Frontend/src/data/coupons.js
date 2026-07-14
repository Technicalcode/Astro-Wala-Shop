export const COUPONS = [
  { code: "ASTRO10",   discount: 10,  type: "percent", label: "10% off" },
  { code: "SAVE150",   discount: 150, type: "flat",    label: "Rs.150 flat off" },
  { code: "RUDRA20",   discount: 20,  type: "percent", label: "20% off on any order" },
  { code: "WELCOME50", discount: 50,  type: "flat",    label: "Rs.50 off for new users" },
];

/**
 * Validate and apply a coupon code against a given subtotal.
 * @param {string} code - The coupon code entered by the user.
 * @param {number} subtotal - The cart subtotal in rupees.
 * @returns {{ valid: boolean, discount: number, message: string, coupon?: object }}
 */
export function applyCoupon(code, subtotal) {
  const coupon = COUPONS.find(
    (c) => c.code === code.toUpperCase().trim()
  );

  if (!coupon) {
    return { valid: false, discount: 0, message: "Invalid coupon code" };
  }

  const discount =
    coupon.type === "percent"
      ? Math.round(subtotal * coupon.discount / 100)
      : coupon.discount;

  return {
    valid: true,
    discount,
    message: `${coupon.label} applied!`,
    coupon,
  };
}

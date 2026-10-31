export type DemoCoupon = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
};
export function demoCoupon(code: string, subtotal: number): DemoCoupon | null {
  const defaults: DemoCoupon[] = [
    {
      id: "1",
      code: "DIVINOS10",
      discount_type: "percent",
      value: 10,
      min_order: 0,
      max_uses: 1000,
      used_count: 0,
      expires_at: "2027-12-31",
      is_active: true,
    },
    {
      id: "2",
      code: "BEMVINDO50",
      discount_type: "fixed",
      value: 50,
      min_order: 250,
      max_uses: 500,
      used_count: 0,
      expires_at: "2027-12-31",
      is_active: true,
    },
  ];
  const coupons: DemoCoupon[] =
    JSON.parse(localStorage.getItem("divinos-demo-coupons") || "null") ||
    defaults;
  const c = coupons.find(
    (c) =>
      c.code === code.toUpperCase().trim() &&
      c.is_active &&
      c.min_order <= subtotal &&
      (!c.expires_at || new Date(c.expires_at) > new Date()) &&
      (!c.max_uses || c.used_count < c.max_uses),
  );
  return c || null;
}
export function freeShipping() {
  if (typeof window === "undefined") return 499;
  return Number(
    JSON.parse(localStorage.getItem("divinos-settings") || "null")
      ?.free_shipping ?? 499,
  );
}

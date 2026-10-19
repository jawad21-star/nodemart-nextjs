export const shop = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME ?? "NodeMart",
  currency: process.env.NEXT_PUBLIC_SHOP_CURRENCY ?? "Rs.",
  shippingFee: Number(process.env.SHOP_SHIPPING_FEE ?? 250),
  freeShippingOver: Number(process.env.SHOP_FREE_SHIPPING_OVER ?? 5000),
  phone: process.env.NEXT_PUBLIC_SHOP_PHONE ?? "+92 300 0000000",
  email: process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "support@nodemart.test",
} as const;

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

export const PAYMENT_METHOD_LABELS = {
  cod: "Cash on Delivery",
  bank: "Bank Transfer",
} as const;

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
} as const;

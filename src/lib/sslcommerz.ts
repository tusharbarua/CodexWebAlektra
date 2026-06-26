import crypto from "node:crypto";
import type { Order } from "@prisma/client";

const sandboxUrl = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const liveUrl = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";
const validationSandboxUrl = "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
const validationLiveUrl = "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

export function sslCommerzEnabled() {
  return Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
}

export async function initiateSslCommerz(order: Order) {
  if (!sslCommerzEnabled()) {
    throw new Error("SSLCommerz credentials are not configured.");
  }

  const tranId = `${order.orderNumber}-${crypto.randomUUID().slice(0, 8)}`;
  const body = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD!,
    total_amount: String(order.totalBdt),
    currency: "BDT",
    tran_id: tranId,
    success_url: process.env.SSLCOMMERZ_SUCCESS_URL!,
    fail_url: process.env.SSLCOMMERZ_FAIL_URL!,
    cancel_url: process.env.SSLCOMMERZ_CANCEL_URL!,
    cus_name: order.customerName,
    cus_email: order.customerEmail,
    cus_phone: order.customerPhone,
    cus_add1: String((order.shippingAddress as Record<string, unknown>).line1 ?? "Bangladesh"),
    cus_city: String((order.shippingAddress as Record<string, unknown>).city ?? "Dhaka"),
    cus_country: "Bangladesh",
    shipping_method: "Courier",
    product_name: `Alektra order ${order.orderNumber}`,
    product_category: "Renewable Energy",
    product_profile: "general"
  });

  const endpoint = process.env.SSLCOMMERZ_SANDBOX === "false" ? liveUrl : sandboxUrl;
  const response = await fetch(endpoint, { method: "POST", body });
  const payload = (await response.json()) as { GatewayPageURL?: string; status?: string; failedreason?: string };

  if (!payload.GatewayPageURL) {
    throw new Error(payload.failedreason || "SSLCommerz initiation failed.");
  }

  return { transactionId: tranId, redirectUrl: payload.GatewayPageURL, payload };
}

export async function validateSslCommerz(valId: string) {
  if (!sslCommerzEnabled()) {
    throw new Error("SSLCommerz credentials are not configured.");
  }

  const endpoint = process.env.SSLCOMMERZ_SANDBOX === "false" ? validationLiveUrl : validationSandboxUrl;
  const url = new URL(endpoint);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", process.env.SSLCOMMERZ_STORE_ID!);
  url.searchParams.set("store_passwd", process.env.SSLCOMMERZ_STORE_PASSWORD!);
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  return response.json() as Promise<Record<string, unknown>>;
}

export async function initiateThermalPayment(input: {
  requestNumber: string;
  amountBdt: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
}) {
  if (!sslCommerzEnabled()) throw new Error("SSLCommerz credentials are not configured.");
  const transactionId = `${input.requestNumber}-${crypto.randomUUID().slice(0, 8)}`;
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const body = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD!,
    total_amount: String(input.amountBdt),
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${origin}/api/thermal-payments/success`,
    fail_url: `${origin}/thermal/inspection-request/success?request=${input.requestNumber}`,
    cancel_url: `${origin}/thermal/inspection-request/success?request=${input.requestNumber}`,
    cus_name: input.customerName,
    cus_email: input.customerEmail,
    cus_phone: input.customerPhone,
    cus_add1: input.address,
    cus_city: "Bangladesh",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: `Alektra Thermal inspection ${input.requestNumber}`,
    product_category: "Thermal Inspection",
    product_profile: "non-physical-goods"
  });
  const endpoint = process.env.SSLCOMMERZ_SANDBOX === "false" ? liveUrl : sandboxUrl;
  const response = await fetch(endpoint, { method: "POST", body });
  const payload = (await response.json()) as { GatewayPageURL?: string; failedreason?: string };
  if (!payload.GatewayPageURL) throw new Error(payload.failedreason || "SSLCommerz initiation failed.");
  return { transactionId, redirectUrl: payload.GatewayPageURL };
}

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  sku: string;
  stock?: number;
  quantity: number;
};

export const CART_STORAGE_KEY = "alektra-cart";
export const CART_UPDATED_EVENT = "alektra-cart-updated";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]") as CartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.id && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  const next = items.filter((item) => item.quantity > 0);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: next }));
}

export function cartSummary(items: CartItem[]) {
  return {
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  };
}

export function addCartItem(product: Omit<CartItem, "quantity">, quantity = 1) {
  const current = readCart();
  const existing = current.find((item) => item.id === product.id);
  const maxStock = product.stock ?? Number.POSITIVE_INFINITY;
  const next = existing
    ? current.map((item) =>
        item.id === product.id
          ? { ...item, quantity: Math.min(maxStock, item.quantity + quantity) }
          : item
      )
    : [...current, { ...product, quantity: Math.min(maxStock, Math.max(1, quantity)) }];
  writeCart(next);
  return next;
}

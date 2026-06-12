export function numberFormat(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0, ...options }).format(value);
}

export function money(value: number) {
  return `৳${numberFormat(value)}`;
}

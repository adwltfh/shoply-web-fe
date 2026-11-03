const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Formats a price in cents, e.g. 3200 → "$32.00". */
export function formatPrice(cents: number) {
  return usd.format(cents / 100);
}

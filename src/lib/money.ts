const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formats integer rupiah, e.g. 129000 -> "Rp 129.000". */
export function formatIdr(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return idrFormatter.format(Math.trunc(amount)).replace(/ /g, " ");
}

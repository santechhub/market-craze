import { getRegion } from "./region";

const isIn = () => getRegion() === "in";

/** Money in the selected market's currency (USD or INR). */
export const usd = (n: number) =>
  isIn()
    ? n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
    : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

export function big(n?: number | null) {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (isIn()) {
    if (a >= 1e7) return `₹${(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
    return usd(n);
  }
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return usd(n);
}

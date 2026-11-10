import { CATEGORIES } from "../src/lib/categories.js";
import type { Rating } from "../src/lib/types.js";
import { finnhub, handle, pool } from "./_lib/util.js";

// Analyst ratings change about monthly, so this runs roughly once a day:
// the CDN caches the response for 24h and serves the old copy while refreshing.
export const maxDuration = 180;

interface FhRec {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export function toRating(r: FhRec): Rating | null {
  const n = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (!n) return null;
  const score = (2 * r.strongBuy + r.buy - r.sell - 2 * r.strongSell) / n;
  const label: Rating["label"] =
    score >= 1.2 ? "Strong Buy" : score >= 0.5 ? "Buy" : score > -0.5 ? "Hold" : score > -1.2 ? "Sell" : "Strong Sell";
  return { label, score: +score.toFixed(2), analysts: n };
}

// GET /api/ratings -> { NVDA: { label, score, analysts }, ... } for every US sector stock.
export const GET = handle(async () => {
  const symbols = [...new Set(CATEGORIES.flatMap((c) => c.tickers))];
  const entries = await pool(symbols, 1, async (symbol) => {
    try {
      // ~1 call/sec keeps this batch under Finnhub's free 60 calls/minute.
      const recs = await finnhub<FhRec[]>("/stock/recommendation", { symbol }, 1050);
      const latest = [...recs].sort((a, b) => b.period.localeCompare(a.period))[0];
      return [symbol, latest ? toRating(latest) : null] as const;
    } catch {
      return [symbol, null] as const;
    }
  });
  const ratings = Object.fromEntries(entries.filter(([, r]) => r));
  const complete = Object.keys(ratings).length >= symbols.length * 0.8;
  return Response.json(ratings, {
    headers: {
      "cache-control": complete
        ? "public, s-maxage=86400, stale-while-revalidate=172800"
        : "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
});

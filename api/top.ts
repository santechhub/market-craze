import { CATEGORIES, NAMES } from "../src/lib/categories.js";
import type { CategoryTop, Quote } from "../src/lib/types.js";
import { cached, finnhub, handle, json, pool } from "./_lib/util.js";

interface FinnhubQuote {
  c: number; // current
  d: number | null; // change
  dp: number | null; // % change
}

let lastGood: { at: number; data: CategoryTop[] } | null = null;

// GET /api/top -> top five movers today per category.
export const GET = handle(async () => {
  if (lastGood && Date.now() - lastGood.at < 4 * 60_000) return json(lastGood.data, 300);

  const symbols = [...new Set(CATEGORIES.flatMap((c) => c.tickers))];
  let firstError = "";
  const quotes = await pool(symbols, 4, async (symbol): Promise<Quote | null> => {
    try {
      // Per-symbol cache, shared with /api/quotes, so a partial failure only re-fetches the missing ones.
      const q = await cached(`quote:${symbol}`, 2 * 60_000, () => finnhub<FinnhubQuote>("/quote", { symbol }));
      if (!q.c) return null;
      return { symbol, name: NAMES[symbol] ?? symbol, price: q.c, change: q.d ?? 0, changePct: q.dp ?? 0 };
    } catch (e) {
      firstError ||= e instanceof Error ? e.message : String(e);
      return null;
    }
  });
  const bySymbol = new Map(quotes.filter((q): q is Quote => q !== null).map((q) => [q.symbol, q]));
  if (bySymbol.size === 0) throw new Error(`No quotes returned: ${firstError}`);

  const data = CATEGORIES.map<CategoryTop>((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    top: c.tickers
      .map((s) => bySymbol.get(s))
      .filter((q): q is Quote => !!q)
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 5),
  }));

  // Only cache a complete answer for long; retry soon if some quotes were missing.
  const complete = bySymbol.size === symbols.length;
  if (complete) lastGood = { at: Date.now(), data };
  else console.warn(`top: ${symbols.length - bySymbol.size} quotes missing (${firstError})`);
  return json(data, complete ? 300 : 20);
});

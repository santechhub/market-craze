import { CATEGORIES, NAMES } from "../src/lib/categories.js";
import type { CategoryTop, Quote } from "../src/lib/types.js";
import { cached, finnhub, handle, json, pool } from "./_lib/util.js";

interface FinnhubQuote {
  c: number; // current
  d: number | null; // change
  dp: number | null; // % change
}

// GET /api/top -> top five movers today per category.
export const GET = handle(async () => {
  const data = await cached("top", 4 * 60_000, async () => {
    const symbols = [...new Set(CATEGORIES.flatMap((c) => c.tickers))];
    let firstError = "";
    const quotes = await pool(symbols, 6, async (symbol): Promise<Quote | null> => {
      try {
        const q = await finnhub<FinnhubQuote>("/quote", { symbol });
        if (!q.c) return null;
        return { symbol, name: NAMES[symbol] ?? symbol, price: q.c, change: q.d ?? 0, changePct: q.dp ?? 0 };
      } catch (e) {
        firstError ||= e instanceof Error ? e.message : String(e);
        return null;
      }
    });
    const bySymbol = new Map(quotes.filter((q): q is Quote => q !== null).map((q) => [q.symbol, q]));
    if (bySymbol.size === 0) throw new Error(`No quotes returned: ${firstError}`);

    return CATEGORIES.map<CategoryTop>((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      top: c.tickers
        .map((s) => bySymbol.get(s))
        .filter((q): q is Quote => !!q)
        .sort((a, b) => b.changePct - a.changePct)
        .slice(0, 5),
    }));
  });
  return json(data, 300);
});

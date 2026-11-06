import { NAMES } from "../src/lib/categories.js";
import type { Quote } from "../src/lib/types.js";
import { cached, finnhub, handle, HttpError, json, pool } from "./_lib/util.js";

interface FhQuote {
  c: number;
  d: number | null;
  dp: number | null;
}
interface FhProfile {
  name?: string;
}

// GET /api/quotes?symbols=NVDA,AAPL -> quotes for the watchlist (max 30).
export const GET = handle(async (req) => {
  const raw = new URL(req.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.toUpperCase().split(",").filter((s) => /^[A-Z.-]{1,10}$/.test(s)))].slice(0, 30);
  if (!symbols.length) throw new HttpError(400, "no symbols");

  const quotes = await pool(symbols, 6, async (symbol): Promise<Quote | null> => {
    try {
      const q = await cached(`quote:${symbol}`, 2 * 60_000, () => finnhub<FhQuote>("/quote", { symbol }));
      if (!q.c) return null;
      const name =
        NAMES[symbol] ??
        (await cached(`name:${symbol}`, 7 * 86400_000, () =>
          finnhub<FhProfile>("/stock/profile2", { symbol }).then((p) => p.name || symbol),
        ));
      return { symbol, name, price: q.c, change: q.d ?? 0, changePct: q.dp ?? 0 };
    } catch {
      return null;
    }
  });
  return json(
    quotes.filter((q): q is Quote => q !== null),
    120,
  );
});

import { CATEGORIES, CATEGORIES_IN, NAMES } from "../src/lib/categories.js";
import type { CategoryTop, Quote, Rating } from "../src/lib/types.js";
import { quotesIn } from "./_lib/india.js";
import { cached, finnhub, handle, json, pool, regionParam } from "./_lib/util.js";

interface FinnhubQuote {
  c: number; // current
  d: number | null; // change
  dp: number | null; // % change
}

let lastGood: { at: number; data: CategoryTop[] } | null = null;

function rank(cats: typeof CATEGORIES_IN, bySymbol: Map<string, Quote>): CategoryTop[] {
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    top: c.tickers
      .map((s) => bySymbol.get(s))
      .filter((q): q is Quote => !!q)
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 5),
  }));
}

async function topIndia() {
  const symbols = [...new Set(CATEGORIES_IN.flatMap((c) => c.tickers))];
  const quotes = await quotesIn(symbols); // one Upstox call for every sector
  if (!quotes.length) throw new Error("No NSE quotes returned");
  return rank(CATEGORIES_IN, new Map(quotes.map((q) => [q.symbol, q])));
}

export const maxDuration = 180;

/** 3 best- and 2 worst-rated stocks per sector, by analyst consensus. */
function pick(ratings: Record<string, Rating>) {
  return CATEGORIES.map((c) => {
    const rated = c.tickers
      .filter((s) => ratings[s])
      .sort((a, b) => ratings[b].score - ratings[a].score || ratings[b].analysts - ratings[a].analysts);
    const buy = rated.slice(0, 3);
    const sell = rated.slice(3).slice(-2).reverse(); // weakest first
    return { c, buy, sell };
  });
}

// GET /api/top
//   US: per sector, top 3 and bottom 2 by Wall Street analyst consensus, with live prices.
//   India (?region=in): top 5 movers today.
export const GET = handle(async (req) => {
  if (regionParam(req) === "in") return json(await topIndia(), 120);
  if (lastGood && Date.now() - lastGood.at < 4 * 60_000) return json(lastGood.data, 300);

  // Ratings come from our own /api/ratings, which the CDN caches for a day.
  const res = await fetch(new URL("/api/ratings", req.url));
  if (!res.ok) throw new Error(`ratings returned ${res.status}`);
  const ratings = (await res.json()) as Record<string, Rating>;
  const picks = pick(ratings);
  if (!picks.some((p) => p.buy.length)) throw new Error("No analyst ratings available");

  const symbols = [...new Set(picks.flatMap((p) => [...p.buy, ...p.sell]))];
  let firstError = "";
  const quotes = await pool(symbols, 4, async (symbol): Promise<Quote | null> => {
    try {
      const q = await cached(`quote:${symbol}`, 4 * 60_000, () => finnhub<FinnhubQuote>("/quote", { symbol }));
      if (!q.c) return null;
      return {
        symbol,
        name: NAMES[symbol] ?? symbol,
        price: q.c,
        change: q.d ?? 0,
        changePct: q.dp ?? 0,
        rating: ratings[symbol],
      };
    } catch (e) {
      firstError ||= e instanceof Error ? e.message : String(e);
      return null;
    }
  });
  const bySymbol = new Map(quotes.filter((q): q is Quote => q !== null).map((q) => [q.symbol, q]));
  if (bySymbol.size === 0) throw new Error(`No quotes returned: ${firstError}`);

  const get = (list: string[]) => list.map((s) => bySymbol.get(s)).filter((q): q is Quote => !!q);
  const data: CategoryTop[] = picks.map(({ c, buy, sell }) => {
    const b = get(buy);
    const s2 = get(sell);
    return { id: c.id, name: c.name, emoji: c.emoji, top: [...b, ...s2], picks: { buy: b, sell: s2 } };
  });

  // Only cache a complete answer for long; retry soon if some quotes were missing.
  const complete = bySymbol.size === symbols.length;
  if (complete) lastGood = { at: Date.now(), data };
  else console.warn(`top: ${symbols.length - bySymbol.size} quotes missing (${firstError})`);
  return json(data, complete ? 300 : 20);
});

import { NAMES } from "../src/lib/categories";
import type { CompanyDetail, NewsItem, PricePoint } from "../src/lib/types";
import { cached, finnhub, fmp, handle, isoDaysAgo, json, symbolParam } from "./_lib/util";

interface FhProfile {
  name?: string;
  logo?: string;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  weburl?: string;
  marketCapitalization?: number; // in millions
}
interface FhQuote {
  c: number;
  dp: number | null;
}
interface FhMetric {
  metric?: { peTTM?: number; peBasicExclExtraTTM?: number; peExclExtraTTM?: number };
}
interface FhNews {
  headline: string;
  source: string;
  url: string;
  datetime: number;
}
interface FmpProfile {
  companyName?: string;
  description?: string;
  website?: string;
  ipoDate?: string;
  industry?: string;
}
interface FmpBar {
  date: string;
  close?: number;
  price?: number;
}
interface FmpBalance {
  date?: string;
  cashAndShortTermInvestments?: number;
  cashAndCashEquivalents?: number;
}

const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

export async function loadCompany(symbol: string): Promise<CompanyDetail> {
  // Slow-changing fields: cache 12h.
  const base = await cached(`base:${symbol}`, 12 * 3600_000, async () => {
    const [profile, metric, fmpProfile, balance, bars] = await Promise.all([
      safe(finnhub<FhProfile>("/stock/profile2", { symbol }), {} as FhProfile),
      safe(finnhub<FhMetric>("/stock/metric", { symbol, metric: "all" }), {} as FhMetric),
      safe(fmp<FmpProfile[]>("/profile", { symbol }), [] as FmpProfile[]),
      safe(fmp<FmpBalance[]>("/balance-sheet-statement", { symbol, limit: "1" }), [] as FmpBalance[]),
      safe(fmp<FmpBar[]>("/historical-price-eod/full", { symbol, from: isoDaysAgo(366) }), [] as FmpBar[]),
    ]);
    const p2 = fmpProfile[0] ?? {};
    const bs = balance[0] ?? {};
    const m = metric.metric ?? {};
    const history: PricePoint[] = bars
      .map((b) => ({ date: b.date, close: b.close ?? b.price ?? 0 }))
      .filter((b) => b.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      name: profile.name || p2.companyName || NAMES[symbol] || symbol,
      logo: profile.logo || undefined,
      exchange: profile.exchange,
      industry: profile.finnhubIndustry || p2.industry,
      ipo: profile.ipo || p2.ipoDate,
      website: profile.weburl || p2.website,
      description: p2.description || "No company description available.",
      marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      peRatio: m.peTTM ?? m.peBasicExclExtraTTM ?? m.peExclExtraTTM ?? null,
      cash: bs.cashAndShortTermInvestments ?? bs.cashAndCashEquivalents ?? null,
      cashAsOf: bs.date ? `as of ${bs.date}` : undefined,
      history,
    };
  });

  // Fast-changing fields: cache 2-5 min.
  const [quote, news] = await Promise.all([
    cached(`quote:${symbol}`, 2 * 60_000, () => finnhub<FhQuote>("/quote", { symbol })),
    cached(`news:${symbol}`, 15 * 60_000, () =>
      safe(finnhub<FhNews[]>("/company-news", { symbol, from: isoDaysAgo(14), to: isoDaysAgo(0) }), []),
    ),
  ]);

  const items: NewsItem[] = news
    .filter((n) => n.headline)
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, 15)
    .map(({ headline, source, url, datetime }) => ({ headline, source, url, datetime }));

  return { symbol, ...base, price: quote.c, changePct: quote.dp ?? 0, news: items };
}

// GET /api/company?symbol=NVDA
export const GET = handle(async (req) => json(await loadCompany(symbolParam(req)), 120));

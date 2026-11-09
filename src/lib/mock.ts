// Deterministic sample data so the app works before API keys exist.
import { categoriesFor, namesFor } from "./categories";
import type { CategoryTop, CompanyDetail, Outlook, PricePoint, Quote, Region } from "./types";

function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };
}

export function mockQuote(symbol: string, region: Region = "us"): Quote {
  const r = seeded(symbol + new Date().toDateString());
  const price = (20 + r() * 480) * (region === "in" ? 10 : 1);
  const changePct = (r() - 0.45) * 8;
  return { symbol, name: namesFor(region)[symbol] ?? symbol, price, change: (price * changePct) / 100, changePct };
}

export function mockTop(region: Region = "us"): CategoryTop[] {
  return categoriesFor(region).map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    top: c.tickers.map((s) => mockQuote(s, region)).sort((a, b) => b.changePct - a.changePct).slice(0, 5),
  }));
}

function mockHistory(symbol: string, end: number): PricePoint[] {
  const r = seeded(symbol);
  const pts: PricePoint[] = [];
  let p = 100;
  const today = new Date();
  for (let i = 365; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    p = p * (1 + (r() - 0.48) * 0.035);
    pts.push({ date: d.toISOString().slice(0, 10), close: p });
  }
  const scale = end / pts[pts.length - 1].close;
  return pts.map((x) => ({ ...x, close: +(x.close * scale).toFixed(2) }));
}

export function mockCompany(symbol: string, region: Region = "us"): CompanyDetail {
  const q = mockQuote(symbol, region);
  const r = seeded(symbol + "x");
  return {
    symbol,
    name: namesFor(region)[symbol] ?? symbol,
    exchange: region === "in" ? "NSE" : "NASDAQ",
    industry: "Sample industry",
    ipo: "1999-01-01",
    description:
      "This is placeholder text. Once the data keys are configured, this section shows the company's real profile and history.",
    price: q.price,
    changePct: q.changePct,
    marketCap: q.price * (1e8 + r() * 5e9),
    peRatio: +(10 + r() * 50).toFixed(1),
    cash: 1e9 + r() * 6e10,
    cashAsOf: "latest filing",
    history: mockHistory(symbol, q.price),
    news: [
      { headline: `${symbol} sample headline: quarterly results beat estimates`, source: "Sample", url: "#", datetime: Date.now() / 1000 },
      { headline: `${symbol} sample headline: analysts update price targets`, source: "Sample", url: "#", datetime: Date.now() / 1000 - 86400 },
    ],
  };
}

export function mockOutlook(c: CompanyDetail): Outlook {
  return {
    stance: c.changePct >= 1 ? "bullish" : c.changePct <= -1 ? "bearish" : "neutral",
    signal: c.changePct >= 1 ? "buy" : c.changePct <= -1 ? "sell" : "hold",
    signalReason: "Sample signal based on today's move only.",
    confidence: "low",
    range6m: { low: +(c.price * 0.9).toFixed(2), high: +(c.price * 1.15).toFixed(2) },
    range12m: { low: +(c.price * 0.85).toFixed(2), high: +(c.price * 1.3).toFixed(2) },
    summary:
      "Sample outlook. With an Anthropic API key configured, this is written from the company's and category's recent news.",
    drivers: ["Sample driver: demand trend in the category", "Sample driver: margin expansion"],
    risks: ["Sample risk: valuation", "Sample risk: macro and interest rates"],
    generatedAt: new Date().toISOString(),
  };
}

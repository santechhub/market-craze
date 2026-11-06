export interface CategoryDef {
  id: string;
  name: string;
  emoji: string;
  tickers: string[];
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export interface CategoryTop {
  id: string;
  name: string;
  emoji: string;
  top: Quote[];
}

export interface PricePoint {
  date: string;
  close: number;
}

export interface NewsItem {
  headline: string;
  source: string;
  url: string;
  datetime: number;
}

export interface CompanyDetail {
  symbol: string;
  name: string;
  logo?: string;
  exchange?: string;
  industry?: string;
  ipo?: string;
  website?: string;
  description: string;
  price: number;
  changePct: number;
  marketCap?: number | null;
  peRatio?: number | null;
  cash?: number | null;
  cashAsOf?: string;
  history: PricePoint[];
  news: NewsItem[];
}

export type Stance = "bullish" | "neutral" | "bearish";

/** Guidance label shown on watchlists. An estimate, never advice. */
export type Signal = "buy" | "hold" | "sell";

export interface Outlook {
  stance: Stance;
  signal: Signal;
  signalReason: string;
  confidence: "low" | "medium" | "high";
  range6m: { low: number; high: number };
  range12m: { low: number; high: number };
  summary: string;
  drivers: string[];
  risks: string[];
  generatedAt: string;
}

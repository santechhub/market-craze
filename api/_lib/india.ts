// India (NSE) data: Upstox for prices and history (free with an Upstox account),
// Wikipedia for company background, Google News RSS for headlines.
import { gunzipSync } from "node:zlib";
import { NAMES_IN } from "../../src/lib/categories.js";
import type { CompanyDetail, NewsItem, PricePoint, Quote } from "../../src/lib/types.js";
import { cached, env, HttpError, isoDaysAgo } from "./util.js";

const UPSTOX = "https://api.upstox.com/v2";
const INSTRUMENTS = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";

interface Instrument {
  segment?: string;
  instrument_type?: string;
  trading_symbol?: string;
  instrument_key?: string;
  name?: string;
}

/** NSE equity symbol -> { key, name }, built from Upstox's public instrument list (cached 24h). */
export function instruments() {
  return cached("upstox:instruments", 24 * 3600_000, async () => {
    const res = await fetch(INSTRUMENTS);
    if (!res.ok) throw new HttpError(502, `Upstox instruments returned ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    let text: string;
    try {
      text = gunzipSync(buf).toString("utf8");
    } catch {
      text = buf.toString("utf8"); // already decompressed by the transport
    }
    const map = new Map<string, { key: string; name: string }>();
    for (const i of JSON.parse(text) as Instrument[]) {
      if (i.segment === "NSE_EQ" && i.instrument_type === "EQ" && i.trading_symbol && i.instrument_key) {
        map.set(i.trading_symbol.toUpperCase(), { key: i.instrument_key, name: i.name ?? i.trading_symbol });
      }
    }
    if (!map.size) throw new HttpError(502, "Upstox instrument list was empty");
    return map;
  });
}

async function upstox<T>(path: string): Promise<T> {
  const res = await fetch(`${UPSTOX}${path}`, {
    headers: { accept: "application/json", authorization: `Bearer ${env("UPSTOX_ACCESS_TOKEN")}` },
  });
  if (res.status === 401) throw new HttpError(503, "Upstox token is invalid or expired");
  if (!res.ok) throw new HttpError(502, `Upstox returned ${res.status}`);
  const body = (await res.json()) as { status?: string; data?: T };
  if (body.data === undefined) throw new HttpError(502, "Upstox returned no data");
  return body.data;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export const nameIn = (symbol: string, fallback?: string) => NAMES_IN[symbol] ?? (fallback ? titleCase(fallback) : symbol);

interface UpQuote {
  symbol?: string;
  instrument_token?: string;
  last_price?: number;
  net_change?: number;
}

/** Live quotes for many NSE symbols in one call (Upstox allows up to 500 keys). */
export async function quotesIn(symbols: string[]): Promise<Quote[]> {
  const inst = await instruments();
  const known = symbols.map((s) => ({ s, i: inst.get(s) })).filter((x) => x.i);
  if (!known.length) return [];
  const keys = known.map((x) => x.i!.key).join(",");
  const data = await cached(`upq:${keys}`, 60_000, () =>
    upstox<Record<string, UpQuote>>(`/market-quote/quotes?instrument_key=${encodeURIComponent(keys)}`),
  );
  const byKey = new Map(Object.values(data).map((q) => [q.instrument_token, q]));
  const out: Quote[] = [];
  for (const { s, i } of known) {
    const q = byKey.get(i!.key) ?? data[`NSE_EQ:${s}`];
    if (!q?.last_price) continue;
    const change = q.net_change ?? 0;
    const prev = q.last_price - change;
    out.push({
      symbol: s,
      name: nameIn(s, i!.name),
      price: q.last_price,
      change,
      changePct: prev ? (change / prev) * 100 : 0,
    });
  }
  return out;
}

async function historyIn(key: string): Promise<PricePoint[]> {
  const data = await upstox<{ candles?: [string, number, number, number, number, number][] }>(
    `/historical-candle/${encodeURIComponent(key)}/day/${isoDaysAgo(0)}/${isoDaysAgo(366)}`,
  );
  return (data.candles ?? [])
    .map((c) => ({ date: String(c[0]).slice(0, 10), close: c[4] }))
    .filter((p) => p.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function wikipedia(name: string) {
  const title = encodeURIComponent(name.replace(/\s*\(.*\)\s*/, "").replace(/ /g, "_"));
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
    headers: { "user-agent": "market-craze/1.0" },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { extract?: string; type?: string; content_urls?: { desktop?: { page?: string } } };
  if (!j.extract || j.type === "disambiguation") return null;
  return { text: j.extract, url: j.content_urls?.desktop?.page };
}

/** Headlines from Google News RSS (India edition). */
export async function newsIn(query: string, limit = 15): Promise<NewsItem[]> {
  return cached(`gnews:${query}`, 15 * 60_000, async () => {
    const url = `https://news.google.com/rss/search?${new URLSearchParams({ q: `${query} when:14d`, hl: "en-IN", gl: "IN", ceid: "IN:en" })}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const xml = await res.text();
    const tag = (block: string, t: string) =>
      block
        .match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim() ?? "";
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit).map(([, b]) => {
      const source = tag(b, "source");
      const title = tag(b, "title");
      return {
        headline: source && title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title,
        source: source || "Google News",
        url: tag(b, "link"),
        datetime: Math.floor(new Date(tag(b, "pubDate")).getTime() / 1000) || 0,
      };
    });
  });
}

export async function loadCompanyIn(symbol: string): Promise<CompanyDetail> {
  const inst = (await instruments()).get(symbol);
  if (!inst) throw new HttpError(404, `${symbol} is not an NSE stock`);
  const name = nameIn(symbol, inst.name);

  const base = await cached(`in:base:${symbol}`, 12 * 3600_000, async () => {
    const [history, wiki] = await Promise.all([historyIn(inst.key), wikipedia(name).catch(() => null)]);
    return { history, wiki };
  });
  const [[quote], news] = await Promise.all([quotesIn([symbol]), newsIn(`${name} share`)]);

  const last = base.history[base.history.length - 1]?.close ?? 0;
  return {
    symbol,
    name,
    exchange: "NSE",
    description: base.wiki?.text ?? "No company description available.",
    website: base.wiki?.url,
    price: quote?.price ?? last,
    changePct: quote?.changePct ?? 0,
    marketCap: null,
    peRatio: null,
    cash: null,
    cashAsOf: "not on free plan",
    history: base.history,
    news,
  };
}

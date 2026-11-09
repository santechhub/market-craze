import Anthropic from "@anthropic-ai/sdk";
import type { Outlook } from "../src/lib/types.js";
import { loadCompany } from "./company.js";
import { loadCompanyIn, newsIn } from "./_lib/india.js";
import { cached, env, finnhub, handle, HttpError, json, regionParam, symbolParam } from "./_lib/util.js";

interface FhNews {
  headline: string;
  summary?: string;
  datetime: number;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["stance", "signal", "signalReason", "confidence", "range6m", "range12m", "summary", "drivers", "risks"],
  properties: {
    stance: { type: "string", enum: ["bullish", "neutral", "bearish"] },
    signal: { type: "string", enum: ["buy", "hold", "sell"] },
    signalReason: { type: "string", description: "One sentence explaining the signal." },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    range6m: {
      type: "object",
      additionalProperties: false,
      required: ["low", "high"],
      properties: { low: { type: "number" }, high: { type: "number" } },
    },
    range12m: {
      type: "object",
      additionalProperties: false,
      required: ["low", "high"],
      properties: { low: { type: "number" }, high: { type: "number" } },
    },
    summary: { type: "string", description: "3-4 sentences, plain language." },
    drivers: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
  },
};

const SYSTEM = `You are an equity research assistant inside a consumer stock app.
Given a company's recent price data, fundamentals, and the latest company and market news, estimate a 6-month and 12-month price range and an overall stance.
Ground every driver and risk in the supplied news or numbers; do not invent events. If the news is thin, say so and use "low" confidence with wider ranges.
"signal" is a simple label for a watchlist: "buy" if the outlook is clearly favourable, "sell" if clearly unfavourable (the user may want to consider giving it up), otherwise "hold".
Users see this as an informational estimate, not financial advice. Keep drivers and risks to 2-4 short items each.`;

async function generate(symbol: string, region: "us" | "in", category?: string): Promise<Outlook> {
  const apiKey = env("ANTHROPIC_API_KEY");
  const india = region === "in";
  const c = india ? await loadCompanyIn(symbol) : await loadCompany(symbol);
  const market: { headline: string }[] = india
    ? await newsIn("Sensex Nifty market", 10).catch(() => [])
    : await finnhub<FhNews[]>("/news", { category: "general" }).catch(() => [] as FhNews[]);
  const cur = india ? "₹" : "$";

  const first = c.history[0]?.close;
  const yearChange = first ? ((c.price / first - 1) * 100).toFixed(1) : "n/a";
  const closes = c.history.map((p) => p.close);

  const prompt = [
    `Company: ${c.name} (${symbol}, ${india ? "NSE India, prices in INR" : "US-listed, prices in USD"})${category ? `, sector: ${category}` : ""}${c.industry ? `, industry: ${c.industry}` : ""}`,
    `Price: ${cur}${c.price.toFixed(2)} (today ${c.changePct.toFixed(2)}%), 1-year change: ${yearChange}%`,
    closes.length ? `1-year low/high: ${cur}${Math.min(...closes).toFixed(2)} / ${cur}${Math.max(...closes).toFixed(2)}` : "",
    `P/E (TTM): ${c.peRatio ?? "n/a"}; cash and short-term investments: ${c.cash ?? "n/a"}; market cap: ${c.marketCap ?? "n/a"}`,
    "",
    "Recent company news (newest first):",
    ...c.news.slice(0, 15).map((n) => `- ${new Date(n.datetime * 1000).toISOString().slice(0, 10)}: ${n.headline}`),
    "",
    "Recent market and macro headlines:",
    ...market.slice(0, 10).map((n) => `- ${n.headline}`),
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  const client = new Anthropic({ apiKey });
  // Haiku keeps each outlook well under a cent; switch to "claude-sonnet-5-5" for deeper write-ups.
  const res = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 16000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  if (res.stop_reason === "refusal") throw new HttpError(502, "Outlook unavailable for this company");
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new HttpError(502, "Empty outlook");
  const parsed = JSON.parse(text.text) as Omit<Outlook, "generatedAt">;
  return { ...parsed, generatedAt: new Date().toISOString() };
}

// GET /api/outlook?symbol=NVDA&category=AI  (cached 12h; news doesn't need minute-level refresh)
export const GET = handle(async (req) => {
  const symbol = symbolParam(req);
  const category = new URL(req.url).searchParams.get("category")?.slice(0, 60) || undefined;
  const region = regionParam(req);
  const o = await cached(`outlook:${region}:${symbol}`, 12 * 3600_000, () => generate(symbol, region, category));
  return json(o, 12 * 3600);
});

import type { CategoryDef } from "./types.js";

// Candidate pool per category. Five per sector, ranked by today's % change
// Keep the total under ~55 tickers: Finnhub's free
// tier allows 60 calls/minute and the sector list makes one call per ticker.
export const CATEGORIES: CategoryDef[] = [
  { id: "ai", name: "AI", emoji: "🤖", tickers: ["NVDA", "MSFT", "GOOGL", "META", "AMD"] },
  { id: "datacenter", name: "Data Storage & Data Centers", emoji: "🗄️", tickers: ["EQIX", "DLR", "STX", "WDC", "NTAP"] },
  { id: "energy", name: "Energy", emoji: "⚡", tickers: ["XOM", "CVX", "NEE", "COP", "VST"] },
  { id: "cyber", name: "Cyber Security", emoji: "🛡️", tickers: ["CRWD", "PANW", "FTNT", "ZS", "NET"] },
  { id: "defense", name: "Defense", emoji: "🎖️", tickers: ["LMT", "RTX", "NOC", "GD", "LHX"] },
  { id: "realestate", name: "Real Estate", emoji: "🏢", tickers: ["PLD", "AMT", "O", "SPG", "WELL"] },
  { id: "ecommerce", name: "E-commerce", emoji: "🛒", tickers: ["AMZN", "SHOP", "MELI", "EBAY", "ETSY"] },
  { id: "gaming", name: "Gaming", emoji: "🎮", tickers: ["RBLX", "EA", "TTWO", "NTES", "SONY"] },
  { id: "it", name: "IT Services", emoji: "💻", tickers: ["ACN", "IBM", "ORCL", "CRM", "NOW"] },
];

// Display names, so the top-5 lists need only one quote call per ticker.
export const NAMES: Record<string, string> = {
  NVDA: "NVIDIA", MSFT: "Microsoft", GOOGL: "Alphabet", META: "Meta Platforms", AMD: "Advanced Micro Devices",
  PLTR: "Palantir", AVGO: "Broadcom", EQIX: "Equinix", DLR: "Digital Realty", STX: "Seagate", WDC: "Western Digital",
  NTAP: "NetApp", PSTG: "Pure Storage", SMCI: "Super Micro Computer", XOM: "Exxon Mobil", CVX: "Chevron",
  NEE: "NextEra Energy", COP: "ConocoPhillips", VST: "Vistra", CEG: "Constellation Energy", SLB: "SLB",
  CRWD: "CrowdStrike", PANW: "Palo Alto Networks", FTNT: "Fortinet", ZS: "Zscaler", NET: "Cloudflare", OKTA: "Okta",
  S: "SentinelOne", LMT: "Lockheed Martin", RTX: "RTX", NOC: "Northrop Grumman", GD: "General Dynamics",
  LHX: "L3Harris", HII: "Huntington Ingalls", KTOS: "Kratos Defense", PLD: "Prologis", AMT: "American Tower",
  O: "Realty Income", SPG: "Simon Property", WELL: "Welltower", PSA: "Public Storage", CBRE: "CBRE Group",
  AMZN: "Amazon", SHOP: "Shopify", MELI: "MercadoLibre", EBAY: "eBay", ETSY: "Etsy", PDD: "PDD Holdings",
  W: "Wayfair", ACN: "Accenture", IBM: "IBM", ORCL: "Oracle", CRM: "Salesforce", NOW: "ServiceNow",
  CTSH: "Cognizant", INFY: "Infosys", RBLX: "Roblox", EA: "Electronic Arts", TTWO: "Take-Two Interactive",
  NTES: "NetEase", SONY: "Sony Group", U: "Unity Software",
};

export const categoryOf = (symbol: string) =>
  CATEGORIES.find((c) => c.tickers.includes(symbol));

import type { CategoryDef } from "./types";

// Candidate pool per category. The app ranks these by today's % change
// and shows the top five. Edit freely.
export const CATEGORIES: CategoryDef[] = [
  { id: "ai", name: "AI", emoji: "🤖", tickers: ["NVDA", "MSFT", "GOOGL", "META", "AMD", "PLTR", "AVGO"] },
  { id: "datacenter", name: "Data Storage & Data Centers", emoji: "🗄️", tickers: ["EQIX", "DLR", "STX", "WDC", "NTAP", "PSTG", "SMCI"] },
  { id: "energy", name: "Energy", emoji: "⚡", tickers: ["XOM", "CVX", "NEE", "COP", "VST", "CEG", "SLB"] },
  { id: "cyber", name: "Cyber Security", emoji: "🛡️", tickers: ["CRWD", "PANW", "FTNT", "ZS", "NET", "OKTA", "S"] },
  { id: "defense", name: "Defense", emoji: "🎖️", tickers: ["LMT", "RTX", "NOC", "GD", "LHX", "HII", "KTOS"] },
  { id: "realestate", name: "Real Estate", emoji: "🏢", tickers: ["PLD", "AMT", "O", "SPG", "WELL", "PSA", "CBRE"] },
  { id: "ecommerce", name: "E-commerce", emoji: "🛒", tickers: ["AMZN", "SHOP", "MELI", "EBAY", "ETSY", "PDD", "W"] },
  { id: "it", name: "IT Services", emoji: "💻", tickers: ["ACN", "IBM", "ORCL", "CRM", "NOW", "CTSH", "INFY"] },
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
  CTSH: "Cognizant", INFY: "Infosys",
};

export const categoryOf = (symbol: string) =>
  CATEGORIES.find((c) => c.tickers.includes(symbol));

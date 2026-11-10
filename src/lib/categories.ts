import type { CategoryDef, Region } from "./types.js";

// US: eight per sector, ranked by analyst consensus (top 3 / bottom 2 shown).
// Ratings are fetched once a day (see api/ratings.ts); quotes only for the 5 shown,
// so request counts stay inside Finnhub's free 60 calls/minute.
export const CATEGORIES: CategoryDef[] = [
  { id: "ai", name: "AI", emoji: "🤖", tickers: ["NVDA", "MSFT", "GOOGL", "META", "AMD", "PLTR", "AVGO", "SNOW"] },
  { id: "datacenter", name: "Data Storage & Data Centers", emoji: "🗄️", tickers: ["EQIX", "DLR", "STX", "WDC", "NTAP", "PSTG", "SMCI", "IRM"] },
  { id: "energy", name: "Energy", emoji: "⚡", tickers: ["XOM", "CVX", "NEE", "COP", "VST", "CEG", "SLB", "EOG"] },
  { id: "cyber", name: "Cyber Security", emoji: "🛡️", tickers: ["CRWD", "PANW", "FTNT", "ZS", "NET", "OKTA", "S", "QLYS"] },
  { id: "defense", name: "Defense", emoji: "🎖️", tickers: ["LMT", "RTX", "NOC", "GD", "LHX", "HII", "KTOS", "LDOS"] },
  { id: "realestate", name: "Real Estate", emoji: "🏢", tickers: ["PLD", "AMT", "O", "SPG", "WELL", "PSA", "CBRE", "EQR"] },
  { id: "ecommerce", name: "E-commerce", emoji: "🛒", tickers: ["AMZN", "SHOP", "MELI", "EBAY", "ETSY", "PDD", "W", "BABA"] },
  { id: "gaming", name: "Gaming", emoji: "🎮", tickers: ["RBLX", "TTWO", "NTES", "SONY", "U", "PLTK", "SE", "GME"] },
  { id: "it", name: "IT Services", emoji: "💻", tickers: ["ACN", "IBM", "ORCL", "CRM", "NOW", "CTSH", "INFY", "EPAM"] },
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
  NTES: "NetEase", SONY: "Sony Group", U: "Unity Software", SNOW: "Snowflake", IRM: "Iron Mountain",
  EOG: "EOG Resources", QLYS: "Qualys", LDOS: "Leidos", EQR: "Equity Residential", BABA: "Alibaba",
  PLTK: "Playtika", SE: "Sea Limited", GME: "GameStop", EPAM: "EPAM Systems",
};

// India (NSE symbols). Data via Upstox, so no Finnhub call limit applies here.
export const CATEGORIES_IN: CategoryDef[] = [
  { id: "ai", name: "AI", emoji: "🤖", tickers: ["TATAELXSI", "PERSISTENT", "KPITTECH", "COFORGE", "LTIM"] },
  { id: "datacenter", name: "Data Storage & Data Centers", emoji: "🗄️", tickers: ["NETWEB", "ANANTRAJ", "TATACOMM", "RAILTEL", "E2E"] },
  { id: "energy", name: "Energy", emoji: "⚡", tickers: ["RELIANCE", "NTPC", "POWERGRID", "ONGC", "ADANIGREEN"] },
  { id: "cyber", name: "Cyber Security", emoji: "🛡️", tickers: ["QUICKHEAL", "SUBEX", "TANLA", "ROUTE", "CMSINFO"] },
  { id: "defense", name: "Defense", emoji: "🎖️", tickers: ["HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP"] },
  { id: "realestate", name: "Real Estate", emoji: "🏢", tickers: ["DLF", "GODREJPROP", "OBEROIRLTY", "PRESTIGE", "LODHA"] },
  { id: "ecommerce", name: "E-commerce", emoji: "🛒", tickers: ["ETERNAL", "NYKAA", "PAYTM", "SWIGGY", "INDIAMART"] },
  { id: "gaming", name: "Gaming", emoji: "🎮", tickers: ["NAZARA", "DELTACORP", "ONMOBILE"] },
  { id: "it", name: "IT Services", emoji: "💻", tickers: ["TCS", "INFY", "HCLTECH", "WIPRO", "TECHM"] },
];

export const NAMES_IN: Record<string, string> = {
  TATAELXSI: "Tata Elxsi", PERSISTENT: "Persistent Systems", KPITTECH: "KPIT Technologies", COFORGE: "Coforge",
  LTIM: "LTIMindtree", NETWEB: "Netweb Technologies", ANANTRAJ: "Anant Raj", TATACOMM: "Tata Communications",
  RAILTEL: "RailTel Corporation", E2E: "E2E Networks", RELIANCE: "Reliance Industries", NTPC: "NTPC",
  POWERGRID: "Power Grid Corporation", ONGC: "ONGC", ADANIGREEN: "Adani Green Energy", QUICKHEAL: "Quick Heal Technologies",
  SUBEX: "Subex", TANLA: "Tanla Platforms", ROUTE: "Route Mobile", CMSINFO: "CMS Info Systems",
  HAL: "Hindustan Aeronautics", BEL: "Bharat Electronics", BDL: "Bharat Dynamics", MAZDOCK: "Mazagon Dock Shipbuilders",
  COCHINSHIP: "Cochin Shipyard", DLF: "DLF", GODREJPROP: "Godrej Properties", OBEROIRLTY: "Oberoi Realty",
  PRESTIGE: "Prestige Estates", LODHA: "Lodha Developers", ETERNAL: "Eternal (Zomato)", NYKAA: "Nykaa",
  PAYTM: "Paytm", SWIGGY: "Swiggy", INDIAMART: "IndiaMART", NAZARA: "Nazara Technologies", DELTACORP: "Delta Corp",
  ONMOBILE: "OnMobile Global", TCS: "Tata Consultancy Services", INFY: "Infosys", HCLTECH: "HCLTech", WIPRO: "Wipro",
  TECHM: "Tech Mahindra",
};

export const categoriesFor = (region: Region) => (region === "in" ? CATEGORIES_IN : CATEGORIES);
export const namesFor = (region: Region) => (region === "in" ? NAMES_IN : NAMES);

export const categoryOf = (symbol: string, region: Region = "us") =>
  categoriesFor(region).find((c) => c.tickers.includes(symbol));

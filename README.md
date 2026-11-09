# Market Craze

A mobile-first stock app (installable PWA) for iPhone and Android. No App Store needed: open the link in Safari and add it to your home screen.

**What it does**

- **Sectors:** top 5 movers today in AI, Data Storage & Data Centers, Energy, Cyber Security, Defense, Real Estate, E-commerce and IT Services, with live prices.
- **Company page:** 1-year price chart (1M / 3M / 6M / 1Y), P/E ratio, cash reserves, market cap, company profile and history, latest news.
- **6–12 month outlook:** an AI estimate written from the company's recent news and market headlines, with price ranges, drivers, risks, and a Buy candidate / Hold / Consider selling signal.
- **Watchlist:** star any company or add any US ticker. Stocks are sorted by signal so you can see what to consider buying and what to consider giving up. Saved on the device.

> Outlooks and signals are AI-generated estimates for information only. They are not financial advice.

## US and India

Use the **🇺🇸 US / 🇮🇳 India** switch at the top. India mode shows NSE stocks in the same sectors, prices in ₹, and keeps its own watchlist. India data: Upstox (prices, 1-year chart), Wikipedia (company background), Google News (headlines and outlook input). P/E, cash reserves and market cap aren't available for India on the free plan.

Set `UPSTOX_ACCESS_TOKEN` in Vercel to turn India on (see `.env.example`).

On Android, open the link in **Chrome** and tap **⬇ Install** (or ⋮ → Add to Home screen).

## How it works

| Piece | Tech |
| --- | --- |
| App | React + TypeScript + Vite, `vite-plugin-pwa` (offline cache, home-screen install) |
| Chart | Recharts |
| API | Vercel Functions in `api/` that hide the keys and cache responses |
| Prices, P/E, news | [Finnhub](https://finnhub.io) (free tier) |
| 1-year history, description, cash | [Financial Modeling Prep](https://site.financialmodelingprep.com) (free tier) |
| Outlook | Claude Haiku via the Anthropic API (well under 1¢ per outlook), cached 12 h per stock |

Without keys (or when running `npm run dev`), the app shows clearly-labelled **sample data** so you can try the UI.

Edit `src/lib/categories.ts` to change which stocks are considered in each sector.

## Deploy (about 5 minutes)

1. Get free keys from Finnhub and FMP, and an Anthropic API key (see `.env.example`).
2. Go to [vercel.com/new](https://vercel.com/new), import this GitHub repo. Framework preset: **Vite**.
3. Under **Environment Variables**, add `FINNHUB_API_KEY`, `FMP_API_KEY`, `ANTHROPIC_API_KEY`. Deploy.
4. Vercel gives you a link like `https://market-craze.vercel.app`.

## Install on iPhone

1. Open the link in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Launch it from the home screen icon. It opens full-screen like a normal app.

Share the same link with anyone; they install it the same way.

## Develop

```bash
npm install
npm run dev           # UI with sample data
npx vercel dev        # UI + API with your keys in .env
npm run build
```

## Free-tier limits

Finnhub allows 60 calls/minute. The sector list uses ~56 quote calls and is cached for 5 minutes at the CDN, so it stays well inside the limit. FMP's free tier allows 250 calls/day; company fundamentals are cached for 12 hours.

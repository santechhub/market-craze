// GET /api/status -> which API keys this deployment can see (never the keys themselves).
export function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  return Response.json(
    {
      ok: true,
      keys: {
        FINNHUB_API_KEY: has("FINNHUB_API_KEY"),
        FMP_API_KEY: has("FMP_API_KEY"),
        ANTHROPIC_API_KEY: has("ANTHROPIC_API_KEY"),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

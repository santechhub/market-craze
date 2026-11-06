// Shared helpers for the serverless API (Vercel Functions, Web Request/Response style).

const memo = new Map<string, { at: number; value: unknown }>();

/** In-memory cache per warm function instance. The CDN cache (Cache-Control) does the heavy lifting. */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  memo.set(key, { at: Date.now(), value });
  return value;
}

export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new HttpError(503, `${name} is not configured`);
  return v;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class UpstreamError extends HttpError {
  constructor(
    public upstreamStatus: number,
    host: string,
  ) {
    super(502, `Upstream ${host} returned ${upstreamStatus}`);
  }
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new UpstreamError(res.status, new URL(url).host);
  return res.json() as Promise<T>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Finnhub free tier allows 60 calls/min and 30 calls/sec. Space calls out and retry on 429.
let nextSlot = 0;
async function finnhubSlot() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 80; // ~12 calls/sec
  if (wait) await sleep(wait);
}

export const FINNHUB = "https://finnhub.io/api/v1";
export const FMP = "https://financialmodelingprep.com/stable";

export async function finnhub<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${FINNHUB}${path}?${new URLSearchParams({ ...params, token: env("FINNHUB_API_KEY") })}`;
  for (let attempt = 0; ; attempt++) {
    await finnhubSlot();
    try {
      return await getJson<T>(url);
    } catch (e) {
      if (e instanceof UpstreamError && e.upstreamStatus === 429 && attempt < 3) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
}

export const fmp = <T>(path: string, params: Record<string, string>) =>
  getJson<T>(`${FMP}${path}?${new URLSearchParams({ ...params, apikey: env("FMP_API_KEY") })}`);

export function json(body: unknown, cacheSeconds: number) {
  return Response.json(body, {
    headers: {
      "cache-control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`,
    },
  });
}

export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      console.error(e);
      return Response.json({ error: e instanceof Error ? e.message : "error" }, { status });
    }
  };
}

export function symbolParam(req: Request) {
  const s = new URL(req.url).searchParams.get("symbol")?.toUpperCase() ?? "";
  if (!/^[A-Z.-]{1,10}$/.test(s)) throw new HttpError(400, "invalid symbol");
  return s;
}

export const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

/** Run async jobs with limited concurrency (Finnhub free tier: 60 calls/min). */
export async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

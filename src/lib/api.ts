import { mockCompany, mockOutlook, mockQuote, mockTop } from "./mock";
import { getRegion } from "./region";
import type { CategoryTop, CompanyDetail, Outlook, Quote } from "./types";

export interface Result<T> {
  data: T;
  sample: boolean;
}

async function getJson<T>(url: string): Promise<T> {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(getRegion() === "in" ? `${url}${sep}region=in` : url);
  if (!res.ok || !res.headers.get("content-type")?.includes("json")) {
    throw new Error(`${url} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Live API first; if the backend isn't deployed or keys are missing, fall back to sample data.
async function withFallback<T>(live: () => Promise<T>, sample: () => T): Promise<Result<T>> {
  try {
    return { data: await live(), sample: false };
  } catch {
    return { data: sample(), sample: true };
  }
}

export const fetchTop = () => withFallback(() => getJson<CategoryTop[]>("/api/top"), () => mockTop(getRegion()));

export const fetchCompany = (symbol: string) =>
  withFallback(
    () => getJson<CompanyDetail>(`/api/company?symbol=${encodeURIComponent(symbol)}`),
    () => mockCompany(symbol, getRegion()),
  );

export const fetchOutlook = (symbol: string, category?: string) =>
  withFallback(
    () =>
      getJson<Outlook>(
        `/api/outlook?symbol=${encodeURIComponent(symbol)}${category ? `&category=${encodeURIComponent(category)}` : ""}`,
      ),
    () => mockOutlook(mockCompany(symbol, getRegion())),
  );

export const fetchQuotes = (symbols: string[]) =>
  withFallback(
    () => getJson<Quote[]>(`/api/quotes?symbols=${symbols.map(encodeURIComponent).join(",")}`),
    () => symbols.map((s) => mockQuote(s, getRegion())),
  );

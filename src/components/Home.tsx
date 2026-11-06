import { useEffect, useState } from "react";
import { fetchTop } from "../lib/api";
import { pct, usd } from "../lib/format";
import type { CategoryTop } from "../lib/types";
import { useWatchlist } from "../lib/watchlist";
import SampleBanner from "./SampleBanner";
import Watchlist from "./Watchlist";

type Tab = "sectors" | "watchlist";

export default function Home({ tab }: { tab: Tab }) {
  const [cats, setCats] = useState<CategoryTop[] | null>(null);
  const [sample, setSample] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const list = useWatchlist();

  const load = () =>
    fetchTop().then((r) => {
      setCats(r.data);
      setSample(r.sample);
      setUpdated(new Date());
    });

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="page with-tabs">
      <header className="top-bar">
        <div>
          <h1>{tab === "sectors" ? "Market Craze" : "Watchlist"}</h1>
          <p className="muted small">
            {tab === "sectors"
              ? `Top 5 movers today per sector${updated ? ` · ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`
              : `${list.length} ${list.length === 1 ? "stock" : "stocks"} · sorted by signal`}
          </p>
        </div>
        {tab === "sectors" && (
          <button className="icon-btn" onClick={load} aria-label="Refresh">
            ↻
          </button>
        )}
      </header>

      {tab === "watchlist" ? (
        <Watchlist />
      ) : (
        <>
          {sample && <SampleBanner />}
          {!cats && <p className="muted center">Loading markets…</p>}
          {cats?.map((c) => (
            <section key={c.id} className="card">
              <h2>
                <span aria-hidden>{c.emoji}</span> {c.name}
              </h2>
              <ol className="rows">
                {c.top.map((q, i) => (
                  <li key={q.symbol}>
                    <a className="row" href={`#/c/${q.symbol}?cat=${c.id}`}>
                      <span className="rank">{i + 1}</span>
                      <span className="sym">
                        <strong>
                          {q.symbol}
                          {list.includes(q.symbol) && <span className="star-mini"> ★</span>}
                        </strong>
                        <span className="muted small ellipsis">{q.name}</span>
                      </span>
                      <span className="px">
                        <strong>{usd(q.price)}</strong>
                        <span className={`chip ${q.changePct >= 0 ? "up" : "down"}`}>{pct(q.changePct)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <footer className="muted small center foot">
            Data: Finnhub &amp; Financial Modeling Prep. Not financial advice.
          </footer>
        </>
      )}

      <nav className="tabbar">
        <a href="#/" className={tab === "sectors" ? "on" : ""}>
          <span aria-hidden>📊</span>
          Sectors
        </a>
        <a href="#/watchlist" className={tab === "watchlist" ? "on" : ""}>
          <span aria-hidden>★</span>
          Watchlist
        </a>
      </nav>
    </main>
  );
}

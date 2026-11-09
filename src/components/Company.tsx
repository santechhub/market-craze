import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchCompany, fetchOutlook } from "../lib/api";
import { categoriesFor, categoryOf } from "../lib/categories";
import { useRegion } from "../lib/region";
import { big, pct, usd } from "../lib/format";
import type { CompanyDetail, Outlook } from "../lib/types";
import { useWatchlist, watchlist } from "../lib/watchlist";
import SampleBanner from "./SampleBanner";
import SignalChip from "./SignalChip";

const RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 91 },
  { label: "6M", days: 182 },
  { label: "1Y", days: 366 },
];

export default function Company({ symbol, categoryId }: { symbol: string; categoryId?: string }) {
  const [c, setC] = useState<CompanyDetail | null>(null);
  const [o, setO] = useState<Outlook | null>(null);
  const [sample, setSample] = useState(false);
  const [range, setRange] = useState(366);
  const [showFull, setShowFull] = useState(false);

  const list = useWatchlist();
  const watched = list.includes(symbol);
  const region = useRegion();
  const category = categoriesFor(region).find((x) => x.id === categoryId) ?? categoryOf(symbol, region);

  useEffect(() => {
    let alive = true;
    setC(null);
    setO(null);
    fetchCompany(symbol).then((r) => {
      if (!alive) return;
      setC(r.data);
      setSample(r.sample);
      fetchOutlook(symbol, category?.name).then((ro) => alive && setO(ro.data));
    });
    return () => {
      alive = false;
    };
  }, [symbol, category?.name, region]);

  const series = useMemo(() => {
    if (!c) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    const iso = cutoff.toISOString().slice(0, 10);
    return c.history.filter((p) => p.date >= iso);
  }, [c, range]);

  const rangeChange = series.length > 1 ? (series[series.length - 1].close / series[0].close - 1) * 100 : 0;
  const up = rangeChange >= 0;

  return (
    <main className="page">
      <header className="top-bar">
        <a
          className="icon-btn"
          href="#/"
          aria-label="Back"
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
        >
          ‹
        </a>
        <div className="grow">
          <h1 className="ellipsis">{c?.name ?? symbol}</h1>
          <p className="muted small">
            {symbol}
            {c?.exchange && ` · ${c.exchange}`}
            {category && ` · ${category.name}`}
          </p>
        </div>
        {c?.logo && <img className="logo" src={c.logo} alt="" />}
        <button
          className={`icon-btn star ${watched ? "on" : ""}`}
          onClick={() => watchlist.toggle(symbol)}
          aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={watched}
        >
          {watched ? "★" : "☆"}
        </button>
      </header>

      {sample && <SampleBanner />}

      {!c ? (
        <p className="muted center">Loading {symbol}…</p>
      ) : (
        <>
          <section className="card">
            <div className="price-line">
              <span className="big-price">{usd(c.price)}</span>
              <span className={`chip ${c.changePct >= 0 ? "up" : "down"}`}>{pct(c.changePct)} today</span>
            </div>
            <p className={`small ${up ? "up-text" : "down-text"}`}>
              {pct(rangeChange)} over {RANGES.find((r) => r.days === range)?.label}
            </p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={up ? "var(--up)" : "var(--down)"} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={up ? "var(--up)" : "var(--down)"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip
                    formatter={(v) => [usd(Number(v)), "Close"]}
                    labelFormatter={(l) => new Date(String(l)).toLocaleDateString()}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={up ? "var(--up)" : "var(--down)"}
                    strokeWidth={2}
                    fill="url(#fill)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="seg" role="tablist">
              {RANGES.map((r) => (
                <button key={r.label} className={r.days === range ? "on" : ""} onClick={() => setRange(r.days)}>
                  {r.label}
                </button>
              ))}
            </div>
          </section>

          <section className="stats">
            <Stat
              label="P/E ratio (TTM)"
              value={c.peRatio != null ? c.peRatio.toFixed(1) : "—"}
              hint={c.peRatio == null && region === "in" ? "not on free plan" : undefined}
            />
            <Stat label="Cash reserves" value={big(c.cash)} hint={c.cashAsOf} />
            <Stat
              label="Market cap"
              value={big(c.marketCap)}
              hint={c.marketCap == null && region === "in" ? "not on free plan" : undefined}
            />
            <Stat label="1Y range" value={rangeText(c)} />
          </section>

          <section className="card">
            <h2>6–12 month outlook</h2>
            {!o ? (
              <p className="muted">Reading the latest news…</p>
            ) : (
              <OutlookView o={o} price={c.price} />
            )}
          </section>

          <section className="card">
            <h2>About {c.name}</h2>
            <p className="muted small">
              {[c.industry, c.ipo && `Public since ${c.ipo.slice(0, 4)}`].filter(Boolean).join(" · ")}
            </p>
            <p className={showFull ? "" : "clamp"}>{c.description}</p>
            {c.description.length > 280 && (
              <button className="link" onClick={() => setShowFull(!showFull)}>
                {showFull ? "Show less" : "Read more"}
              </button>
            )}
            {c.website && (
              <p className="small">
                <a href={c.website} target="_blank" rel="noreferrer">
                  {c.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
          </section>

          {c.news.length > 0 && (
            <section className="card">
              <h2>Latest news</h2>
              <ul className="news">
                {c.news.slice(0, 8).map((n) => (
                  <li key={n.url + n.headline}>
                    <a href={n.url} target="_blank" rel="noreferrer">
                      {n.headline}
                    </a>
                    <span className="muted small">
                      {n.source} · {new Date(n.datetime * 1000).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function rangeText(c: CompanyDetail) {
  if (!c.history.length) return "—";
  const closes = c.history.map((p) => p.close);
  return `${usd(Math.min(...closes))} – ${usd(Math.max(...closes))}`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {hint && <span className="muted tiny">{hint}</span>}
    </div>
  );
}

function OutlookView({ o, price }: { o: Outlook; price: number }) {
  const mid = (r: { low: number; high: number }) => ((r.low + r.high) / 2 / price - 1) * 100;
  return (
    <div className="outlook">
      <div className="price-line">
        <span className={`pill ${o.stance}`}>{o.stance}</span>
        <SignalChip signal={o.signal} />
        <span className="muted small">{o.confidence} confidence</span>
      </div>
      <p className="small muted">{o.signalReason}</p>
      <div className="ranges">
        <div>
          <span className="muted small">6 months</span>
          <strong>
            {usd(o.range6m.low)} – {usd(o.range6m.high)}
          </strong>
          <span className="muted tiny">midpoint {pct(mid(o.range6m))}</span>
        </div>
        <div>
          <span className="muted small">12 months</span>
          <strong>
            {usd(o.range12m.low)} – {usd(o.range12m.high)}
          </strong>
          <span className="muted tiny">midpoint {pct(mid(o.range12m))}</span>
        </div>
      </div>
      <p>{o.summary}</p>
      <div className="two-col">
        <div>
          <h3>Drivers</h3>
          <ul>
            {o.drivers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Risks</h3>
          <ul>
            {o.risks.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="disclaimer">
        AI-generated estimate from recent news, for information only. Not financial advice. Prices can move outside
        these ranges.
      </p>
    </div>
  );
}

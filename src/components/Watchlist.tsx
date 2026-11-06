import { useEffect, useState, type FormEvent } from "react";
import { fetchOutlook, fetchQuotes } from "../lib/api";
import { pct, usd } from "../lib/format";
import type { Quote, Signal } from "../lib/types";
import { useWatchlist, watchlist } from "../lib/watchlist";
import SampleBanner from "./SampleBanner";
import SignalChip from "./SignalChip";

const ORDER: Record<Signal, number> = { buy: 0, hold: 1, sell: 2 };

export default function Watchlist() {
  const list = useWatchlist();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [signals, setSignals] = useState<Record<string, { signal: Signal; reason: string }>>({});
  const [sample, setSample] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const key = list.join(",");
  useEffect(() => {
    if (!list.length) return;
    fetchQuotes(list).then((r) => {
      setSample(r.sample);
      setQuotes(Object.fromEntries(r.data.map((q) => [q.symbol, q])));
    });
    // Outlooks are cached server-side for 12h, so this is cheap after the first view.
    list.forEach((s) => {
      if (signals[s]) return;
      fetchOutlook(s).then((r) =>
        setSignals((prev) => ({ ...prev, [s]: { signal: r.data.signal, reason: r.data.signalReason } })),
      );
    });
  }, [key]);

  const add = (e: FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (!/^[A-Z.-]{1,10}$/.test(s)) return setError("Enter a US ticker, e.g. AAPL");
    setError("");
    watchlist.add(s);
    setInput("");
  };

  const sorted = [...list].sort(
    (a, b) => (ORDER[signals[a]?.signal ?? "hold"] ?? 1) - (ORDER[signals[b]?.signal ?? "hold"] ?? 1),
  );
  const counts = list.reduce(
    (acc, s) => {
      const sig = signals[s]?.signal;
      if (sig) acc[sig] += 1;
      return acc;
    },
    { buy: 0, hold: 0, sell: 0 } as Record<Signal, number>,
  );

  return (
    <>
      {sample && <SampleBanner />}

      <form className="add-form" onSubmit={add}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add ticker (e.g. AAPL)"
          autoCapitalize="characters"
          autoCorrect="off"
          enterKeyHint="done"
          aria-label="Ticker symbol"
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="small down-text">{error}</p>}

      {!list.length ? (
        <section className="card center">
          <p>Your watchlist is empty.</p>
          <p className="muted small">Add a ticker above, or tap ☆ on any company page.</p>
        </section>
      ) : (
        <>
          <section className="summary">
            <div>
              <strong className="up-text">{counts.buy}</strong>
              <span className="muted tiny">Buy candidates</span>
            </div>
            <div>
              <strong>{counts.hold}</strong>
              <span className="muted tiny">Hold</span>
            </div>
            <div>
              <strong className="down-text">{counts.sell}</strong>
              <span className="muted tiny">Consider selling</span>
            </div>
          </section>

          <section className="card">
            <ol className="rows">
              {sorted.map((s) => {
                const q = quotes[s];
                const sig = signals[s];
                return (
                  <li key={s} className="watch-row">
                    <a className="row" href={`#/c/${s}`}>
                      <span className="sym">
                        <strong>{s}</strong>
                        <span className="muted small ellipsis">{q?.name ?? ""}</span>
                      </span>
                      <span className="px">
                        <strong>{q ? usd(q.price) : "—"}</strong>
                        {q && <span className={`chip ${q.changePct >= 0 ? "up" : "down"}`}>{pct(q.changePct)}</span>}
                      </span>
                    </a>
                    <div className="watch-meta">
                      <SignalChip signal={sig?.signal} />
                      <span className="muted tiny grow">{sig?.reason}</span>
                      <button className="link small" onClick={() => watchlist.remove(s)} aria-label={`Remove ${s}`}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
          <p className="disclaimer">
            Signals are AI-generated estimates from recent news and fundamentals, for information only. Not financial
            advice. Do your own research before buying or selling.
          </p>
        </>
      )}
    </>
  );
}

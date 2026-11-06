import type { Signal } from "../lib/types";

const LABEL: Record<Signal, string> = { buy: "Buy candidate", hold: "Hold", sell: "Consider selling" };

export default function SignalChip({ signal }: { signal?: Signal }) {
  if (!signal) return <span className="signal pending">…</span>;
  return <span className={`signal ${signal}`}>{LABEL[signal]}</span>;
}

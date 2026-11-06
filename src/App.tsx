import { lazy, Suspense, useEffect, useState } from "react";
import Home from "./components/Home";

// The company page pulls in the chart library, so load it on demand.
const Company = lazy(() => import("./components/Company"));

// Tiny hash router: "#/" is home, "#/c/NVDA?cat=ai" is a company page.
function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash || "#/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useRoute();
  const m = hash.match(/^#\/c\/([A-Za-z.-]+)(?:\?cat=([\w-]+))?/);
  if (m)
    return (
      <Suspense fallback={<p className="muted center page">Loading…</p>}>
        <Company symbol={m[1].toUpperCase()} categoryId={m[2]} />
      </Suspense>
    );
  return <Home tab={hash.startsWith("#/watchlist") ? "watchlist" : "sectors"} />;
}

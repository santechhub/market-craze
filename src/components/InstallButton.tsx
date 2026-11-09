import { useEffect, useState } from "react";

// Chrome/Android fires `beforeinstallprompt`; we keep it and show an Install button.
// iPhone has no such event, so we show a one-line Safari hint instead.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function InstallButton() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  if (standalone()) return null;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!evt && !ios) return null;

  return (
    <>
      <button
        className="install-btn"
        onClick={async () => {
          if (evt) {
            await evt.prompt();
            setEvt(null);
          } else setHint(!hint);
        }}
      >
        ⬇ Install
      </button>
      {hint && <p className="install-hint small">In Safari, tap Share, then “Add to Home Screen”.</p>}
    </>
  );
}

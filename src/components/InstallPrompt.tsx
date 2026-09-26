"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nearby-install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const onPrompt = (promptEvent: Event) => {
      promptEvent.preventDefault();
      setEvent(promptEvent as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const standalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (ios && safari && !standalone) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setEvent(null);
    setIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  }

  if (!event && !iosHint) return null;

  return (
    <div className="install-prompt glass-bar" role="region" aria-label="Install Nearby">
      <p>
        {event ? (
          "Install Nearby for a full-screen map."
        ) : (
          <>
            Add Nearby to your Home Screen from the <Share size={14} aria-hidden /> Share menu.
          </>
        )}
      </p>
      <div className="install-actions">
        {event ? (
          <button type="button" className="btn-primary" onClick={install}>
            Install app
          </button>
        ) : null}
        <button type="button" className="icon-btn" onClick={dismiss} aria-label="Dismiss install hint">
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Registers only an app-shell service worker. Authenticated API responses and
 * visitor credentials are deliberately never cached or queued offline.
 */
export function ServiceWorkerRegistration() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const updateConnection = () => setOffline(!navigator.onLine);
    updateConnection();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  return (
    <>
      {offline ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-warning bg-warning-soft px-4 py-3 text-center text-sm text-warning-soft-foreground">
          You are offline. Visitor passes cannot be checked or admitted until the connection
          returns.
        </div>
      ) : null}
      {installPrompt ? (
        <button
          className="fixed bottom-4 right-4 z-40 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
          onClick={() => {
            void installPrompt
              .prompt()
              .then(() => installPrompt.userChoice)
              .finally(() => setInstallPrompt(null));
          }}
          type="button"
        >
          Install Peace Valley
        </button>
      ) : null}
    </>
  );
}

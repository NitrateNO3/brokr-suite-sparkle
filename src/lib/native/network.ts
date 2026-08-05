import { useEffect, useState } from "react";
import { isNativeApp } from "./index";

/** Tracks connectivity via the Capacitor Network plugin on Android, `navigator.onLine` on web. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isNativeApp()) {
      void (async () => {
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        setOnline(status.connected);
        const listener = await Network.addListener("networkStatusChange", (next) =>
          setOnline(next.connected),
        );
        cleanup = () => void listener.remove();
      })();
    } else {
      setOnline(navigator.onLine);
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
      cleanup = () => {
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      };
    }

    return () => cleanup?.();
  }, []);

  return online;
}

export async function isConnected(): Promise<boolean> {
  if (typeof window === "undefined") return true;
  if (isNativeApp()) {
    const { Network } = await import("@capacitor/network");
    return (await Network.getStatus()).connected;
  }
  return navigator.onLine;
}

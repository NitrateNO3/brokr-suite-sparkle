import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CloudUpload, Loader2, WifiOff } from "lucide-react";

import { isNativeApp } from "@/lib/native";
import { useOnlineStatus } from "@/lib/native/network";
import { registerPushNotifications, routeForNotification } from "@/lib/native/notifications";
import { useOfflineDrafts } from "@/lib/offline-drafts";

/**
 * Native shell glue: status bar, hardware back button, push registration and
 * the offline/sync banner. Renders nothing on the web build except the banner
 * when the browser goes offline.
 */
export function NativeBootstrap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const { count, syncing, sync } = useOfflineDrafts();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  // Status bar + splash + hardware back button.
  useEffect(() => {
    if (!isNativeApp()) return;
    let disposed = false;
    const cleanups: Array<() => void> = [];

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* optional */
      }
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        /* optional */
      }
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else void App.exitApp();
        });
        if (disposed) void listener.remove();
        else cleanups.push(() => void listener.remove());
      } catch {
        /* optional */
      }
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  // Push notifications — disabled until Firebase (google-services.json) is set
  // up and VITE_ENABLE_PUSH=true. Touching the plugin without Firebase crashes
  // the Android app with "Default FirebaseApp is not initialized".
  useEffect(() => {
    if (!isNativeApp() || !isPushEnabled()) return;
    let unsubscribe: (() => void) | undefined;
    void registerPushNotifications({
      onNotification: (payload) => {
        if (payload.title) toast(payload.title, { description: payload.body });
        void queryClient.invalidateQueries();
      },
      onOpen: (payload) => {
        void navigate({ to: routeForNotification(payload) });
      },
    }).then((dispose) => {
      unsubscribe = dispose;
    });
    return () => unsubscribe?.();
  }, [navigate, queryClient]);

  // Flush queued drafts whenever connectivity returns.
  useEffect(() => {
    if (!online || !count) return;
    void sync().then((result) => {
      if (result.synced) {
        toast.success(`${result.synced} offline draft(s) synced`);
        void queryClient.invalidateQueries({ queryKey: ["properties"] });
      }
    });
  }, [online, count, sync, queryClient]);

  if (!ready) return null;
  if (online && !count) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] print:hidden">
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium shadow-lg">
        {!online ? (
          <>
            <WifiOff className="h-3.5 w-3.5 text-destructive" />
            <span>Offline — drafts are saved on this device</span>
          </>
        ) : syncing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Syncing {count} draft(s)…</span>
          </>
        ) : (
          <>
            <CloudUpload className="h-3.5 w-3.5 text-primary" />
            <button type="button" onClick={() => void sync()} className="underline-offset-2 hover:underline">
              Sync {count} pending draft(s)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

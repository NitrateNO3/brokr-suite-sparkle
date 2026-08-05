/**
 * Native runtime helpers.
 *
 * Everything here is safe to import from shared code: Capacitor modules are
 * loaded with dynamic `import()` so SSR and the plain web build never touch
 * them, and every helper degrades to its web behaviour when the app is not
 * running inside the Android shell.
 */

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function nativePlatform(): "android" | "ios" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.() ?? "web";
  return platform === "android" || platform === "ios" ? platform : "web";
}

/** Light tap feedback on native; no-op on web. */
export async function tapFeedback() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics are best-effort */
  }
}

/** Native share sheet with a clipboard fallback. Returns true when shared. */
export async function shareNative(options: { title?: string; text?: string; url: string }) {
  if (isNativeApp()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        ...(options.title ? { title: options.title } : {}),
        ...(options.text ? { text: options.text } : {}),
        url: options.url,
        dialogTitle: "Share property",
      });
      return true;
    } catch {
      return false;
    }
  }
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        ...(options.title ? { title: options.title } : {}),
        ...(options.text ? { text: options.text } : {}),
        url: options.url,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Opens a URL outside the app shell (system browser / associated app). */
export async function openExternal(url: string) {
  if (isNativeApp()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch {
      /* fall through to window.open */
    }
  }
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Opens a URL through the OS so Android can hand it to a matching app
 * (WhatsApp, Google Maps, dialer, mail client) before falling back to a browser.
 */
export async function openWithSystemApp(url: string) {
  if (isNativeApp()) {
    try {
      const { AppLauncher } = (await import("@capacitor/app")) as unknown as {
        AppLauncher?: { openUrl: (o: { url: string }) => Promise<unknown> };
      };
      if (AppLauncher) {
        await AppLauncher.openUrl({ url });
        return;
      }
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") window.location.href = url;
}

export function whatsappUrl(text: string, phone?: string | null) {
  const encoded = encodeURIComponent(text);
  return phone
    ? `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/** Google Maps deep link — opens the Maps app when installed, browser otherwise. */
export function mapsUrl(input: {
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  mapsUrl?: string | null;
}) {
  if (input.mapsUrl) return input.mapsUrl;
  if (input.latitude != null && input.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.query ?? "")}`;
}

export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const mailtoUrl = (email: string, subject?: string, body?: string) =>
  `mailto:${email}${
    subject || body
      ? `?${[
          subject ? `subject=${encodeURIComponent(subject)}` : "",
          body ? `body=${encodeURIComponent(body)}` : "",
        ]
          .filter(Boolean)
          .join("&")}`
      : ""
  }`;

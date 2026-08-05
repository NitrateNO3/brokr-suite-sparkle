import { isNativeApp } from "./index";

/**
 * Firebase Cloud Messaging scaffolding.
 *
 * The plugin is wired and permission-aware, but no notifications are sent yet.
 * Drop the Firebase `google-services.json` into `android/app/` and start
 * emitting messages with these `type` values from your backend.
 */
export type BrokrNotificationType =
  | "new_lead"
  | "property_inquiry"
  | "property_approved"
  | "new_property";

export type BrokrNotification = {
  type: BrokrNotificationType;
  title: string;
  body: string;
  /** In-app path to open when the notification is tapped. */
  route?: string;
  entityId?: string;
};

/** Where each notification type should take the user. */
export function routeForNotification(payload: Partial<BrokrNotification>): string {
  if (payload.route) return payload.route;
  switch (payload.type) {
    case "new_lead":
    case "property_inquiry":
      return "/leads";
    case "property_approved":
    case "new_property":
      return payload.entityId ? `/properties/${payload.entityId}/edit` : "/properties";
    default:
      return "/dashboard";
  }
}

type RegisterOptions = {
  onToken?: (token: string) => void;
  onNotification?: (payload: Partial<BrokrNotification>) => void;
  onOpen?: (payload: Partial<BrokrNotification>) => void;
};

/**
 * Push notifications stay completely dormant until Firebase is configured.
 *
 * Without `google-services.json` the native plugin throws
 * `Default FirebaseApp is not initialized` the moment it is touched, which
 * crashes the Android app at launch. So we only load the plugin when the build
 * explicitly opts in via `VITE_ENABLE_PUSH=true` (set it after adding
 * `google-services.json` to `android/app/`).
 */
export function isPushEnabled(): boolean {
  return import.meta.env["VITE_ENABLE_PUSH"] === "true";
}

/**
 * Registers for push notifications. No-op on web and no-op whenever Firebase
 * has not been configured — the plugin module is never even imported then.
 */
export async function registerPushNotifications(options: RegisterOptions = {}) {
  if (!isNativeApp() || !isPushEnabled()) return () => {};
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let status = await PushNotifications.checkPermissions();
    if (status.receive === "prompt" || status.receive === "prompt-with-rationale") {
      status = await PushNotifications.requestPermissions();
    }
    if (status.receive !== "granted") return () => {};

    await PushNotifications.register();

    const listeners = await Promise.all([
      PushNotifications.addListener("registration", (token) => options.onToken?.(token.value)),
      PushNotifications.addListener("registrationError", (error) =>
        console.warn("[push] registration failed", error),
      ),
      PushNotifications.addListener("pushNotificationReceived", (notification) =>
        options.onNotification?.({
          title: notification.title ?? "",
          body: notification.body ?? "",
          ...(notification.data as Partial<BrokrNotification>),
        }),
      ),
      PushNotifications.addListener("pushNotificationActionPerformed", (action) =>
        options.onOpen?.(action.notification.data as Partial<BrokrNotification>),
      ),
    ]);

    return () => listeners.forEach((listener) => void listener.remove());
  } catch (error) {
    console.warn("[push] unavailable", error);
    return () => {};
  }
}

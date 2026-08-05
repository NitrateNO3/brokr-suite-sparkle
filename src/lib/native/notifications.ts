/**
 * Push notification routing helpers — INERT BUILD.
 *
 * Firebase is not configured for this project, so the Capacitor
 * `@capacitor/push-notifications` plugin is intentionally NOT installed and NOT
 * imported anywhere. Touching it without `google-services.json` throws
 * `java.lang.IllegalStateException: Default FirebaseApp is not initialized`
 * inside `PushNotificationsPlugin.register()` and crashes Android at launch.
 *
 * This module therefore contains ZERO plugin imports and no runtime calls to
 * `register()`, `requestPermissions()` or `addListener()`. Only the pure
 * payload/route mapping used by the rest of the app survives, so re-enabling
 * push later is a matter of:
 *   1. adding `android/app/google-services.json`
 *   2. `npm i @capacitor/push-notifications && npx cap sync`
 *   3. re-adding a registration function here, guarded by `isPushEnabled()`
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

/**
 * Always `false` in this build: Firebase is not configured and the plugin is
 * not installed. Kept so callers can stay written defensively.
 */
export function isPushEnabled(): boolean {
  return false;
}

/**
 * No-op. Deliberately never touches the native plugin.
 */
export async function registerPushNotifications(): Promise<() => void> {
  return () => {};
}

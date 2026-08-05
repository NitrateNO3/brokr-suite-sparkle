/** Friendly, user-facing messages for the failure modes the Android app hits. */
export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.toLowerCase();

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("err_internet")
  ) {
    return "You're offline. Your changes are saved on this device and will sync automatically.";
  }
  if (message.includes("jwt") || message.includes("session") || message.includes("401")) {
    return "Your session expired. Please sign in again.";
  }
  if (message.includes("permission") || message.includes("denied") || message.includes("403")) {
    return "Permission denied. Check the app permissions or ask an admin for access.";
  }
  if (message.includes("payload too large") || message.includes("413") || message.includes("quota")) {
    return "That file is too large to upload. Try a smaller image.";
  }
  if (message.includes("space") || message.includes("storage full")) {
    return "The device is out of storage. Free up some space and try again.";
  }
  if (message.includes("upload")) {
    return "Upload failed. Check your connection and retry.";
  }
  return raw || fallback;
}

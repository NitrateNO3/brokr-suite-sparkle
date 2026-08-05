import { isNativeApp } from "./index";

export type PickedImage = { file: File; previewUrl: string };

/** Human-readable messages for the permission / capture failures Android surfaces. */
function describeCameraError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("cancel")) return "";
  if (lower.includes("permission") || lower.includes("denied"))
    return "Camera or photo access was denied. Enable it in Android Settings → Apps → BrokrSuite → Permissions.";
  if (lower.includes("space") || lower.includes("storage"))
    return "Not enough storage on the device to capture the photo.";
  return "Could not open the camera. Please try again.";
}

async function dataUrlToFile(dataUrl: string, name: string, type: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || type });
}

/**
 * Captures a photo with the device camera. Permissions are requested lazily,
 * only at the moment the user taps the capture action.
 */
export async function capturePhoto(): Promise<File[]> {
  if (!isNativeApp()) return [];
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  try {
    const permission = await Camera.checkPermissions();
    if (permission.camera !== "granted") {
      const requested = await Camera.requestPermissions({ permissions: ["camera"] });
      if (requested.camera !== "granted") {
        throw new Error("permission denied");
      }
    }
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      correctOrientation: true,
      saveToGallery: false,
    });
    if (!photo.dataUrl) return [];
    const ext = photo.format || "jpeg";
    return [await dataUrlToFile(photo.dataUrl, `capture-${Date.now()}.${ext}`, `image/${ext}`)];
  } catch (error) {
    const message = describeCameraError(error);
    if (message) throw new Error(message);
    return [];
  }
}

/** Picks multiple images from the device gallery. */
export async function pickFromGallery(limit = 20): Promise<File[]> {
  if (!isNativeApp()) return [];
  const { Camera } = await import("@capacitor/camera");
  try {
    const permission = await Camera.checkPermissions();
    if (permission.photos !== "granted" && permission.photos !== "limited") {
      const requested = await Camera.requestPermissions({ permissions: ["photos"] });
      if (requested.photos !== "granted" && requested.photos !== "limited") {
        throw new Error("permission denied");
      }
    }
    const result = await Camera.pickImages({ quality: 90, limit, correctOrientation: true });
    const files: File[] = [];
    for (const photo of result.photos) {
      if (!photo.webPath) continue;
      const res = await fetch(photo.webPath);
      const blob = await res.blob();
      const ext = photo.format || "jpeg";
      files.push(
        new File([blob], `gallery-${Date.now()}-${files.length}.${ext}`, {
          type: blob.type || `image/${ext}`,
        }),
      );
    }
    return files;
  } catch (error) {
    const message = describeCameraError(error);
    if (message) throw new Error(message);
    return [];
  }
}

import { isNativeApp } from "./index";

/**
 * Downloads a brochure, PDF, floor plan or property document.
 *
 * On Android the file is written to the app's Documents directory and then
 * opened with the system viewer; on web it falls back to an anchor download.
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  if (!isNativeApp()) {
    if (typeof document === "undefined") return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  }

  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  try {
    const result = await Filesystem.downloadFile({
      url,
      path: fileName,
      directory: Directory.Documents,
      recursive: true,
    });
    if (result.path) {
      const { FileOpener } = (await import("@capacitor/filesystem")) as unknown as {
        FileOpener?: { open: (o: { filePath: string }) => Promise<unknown> };
      };
      await FileOpener?.open({ filePath: result.path });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("space") || message.includes("storage")) {
      throw new Error("Not enough storage left on the device to save this file.");
    }
    if (message.includes("permission")) {
      throw new Error("Storage access was denied. Allow it in Android Settings → Apps → BrokrSuite.");
    }
    throw new Error("Download failed. Check your connection and try again.");
  }
}

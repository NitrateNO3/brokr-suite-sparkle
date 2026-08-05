import { useState } from "react";
import { Camera, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { isNativeApp, tapFeedback } from "@/lib/native";
import { capturePhoto, pickFromGallery } from "@/lib/native/camera";
import { friendlyError } from "@/lib/errors";

/** Camera + gallery actions. Rendered only inside the Android app. */
export function NativeMediaSourceButtons({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [busy, setBusy] = useState<"camera" | "gallery" | null>(null);
  if (!isNativeApp()) return null;

  const run = async (source: "camera" | "gallery") => {
    setBusy(source);
    try {
      await tapFeedback();
      const files = source === "camera" ? await capturePhoto() : await pickFromGallery();
      if (files.length) onFiles(files);
    } catch (error) {
      toast.error(friendlyError(error, "Could not add photos"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void run("camera")}>
        {busy === "camera" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        Take photo
      </Button>
      <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void run("gallery")}>
        {busy === "gallery" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Images className="h-4 w-4" />
        )}
        Choose photos
      </Button>
    </div>
  );
}

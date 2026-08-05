import { supabase } from "@/integrations/supabase/client";

const BUCKET = "property-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const THUMB_WIDTH = 480;

type EncodedImage = { blob: Blob; ext: "webp" | "jpg"; contentType: string };

function supportsWebp(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

async function encode(file: File, maxWidth: number, quality: number): Promise<EncodedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, ext: "jpg", contentType: file.type || "image/jpeg" };
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const webp = supportsWebp();
  const type = webp ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) return { blob: file, ext: "jpg", contentType: file.type || "image/jpeg" };
  return { blob, ext: webp ? "webp" : "jpg", contentType: type };
}

/** Downscale + re-encode an image in the browser before upload (WebP when supported). */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  return (await encode(file, maxWidth, quality)).blob;
}

async function sign(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Upload a file to the media bucket and return a long-lived shareable URL.
 * Images are compressed to WebP and get a companion thumbnail.
 */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let body: Blob = file;
  let contentType = file.type || "application/octet-stream";
  let ext = file.name.split(".").pop() ?? "bin";

  if (isImage) {
    const encoded = await encode(file, 1920, 0.82);
    body = encoded.blob;
    contentType = encoded.contentType;
    ext = encoded.ext;
  }

  const path = `${folder}/${stamp}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  if (isImage) {
    // Thumbnails are best-effort — a failure here must not fail the upload.
    try {
      const thumb = await encode(file, THUMB_WIDTH, 0.7);
      await supabase.storage.from(BUCKET).upload(`${folder}/thumbs/${stamp}.${thumb.ext}`, thumb.blob, {
        contentType: thumb.contentType,
        upsert: true,
      });
    } catch {
      /* ignore */
    }
  }

  return sign(path);
}

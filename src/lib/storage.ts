import { supabase } from "@/integrations/supabase/client";

const BUCKET = "property-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Downscale + re-encode an image in the browser before upload. */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  return blob ?? file;
}

/** Upload a file to the media bucket and return a long-lived shareable URL. */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  const body = file.type.startsWith("image/") ? await compressImage(file) : file;
  const ext = file.type.startsWith("image/") ? "jpg" : (file.name.split(".").pop() ?? "bin");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: file.type.startsWith("image/") ? "image/jpeg" : file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError) throw signError;
  return data.signedUrl;
}

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { uploadToStorage } from "@/lib/storage";
import { usePropertyImagesQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Bulk image upload with drag & drop, reordering, delete and featured selection. */
export function MediaManager({
  propertyId,
  coverImage,
  onCoverChange,
}: {
  propertyId: string;
  coverImage: string | null;
  onCoverChange: (url: string) => void;
}) {
  const { data: images, isLoading } = usePropertyImagesQuery(propertyId);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["property-images", propertyId] });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const start = images?.length ?? 0;
      let index = 0;
      for (const file of Array.from(files)) {
        const url = await uploadToStorage(file, propertyId);
        await supabase.from("property_images").insert({
          property_id: propertyId,
          url,
          sort_order: start + index,
        });
        if (start === 0 && index === 0) onCoverChange(url);
        index += 1;
      }
      toast.success(`${files.length} file(s) uploaded`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const move = async (id: string, direction: -1 | 1) => {
    if (!images) return;
    const idx = images.findIndex((i) => i.id === id);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= images.length) return;
    const a = images[idx]!;
    const b = images[swapWith]!;
    await supabase.from("property_images").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("property_images").update({ sort_order: a.sort_order }).eq("id", b.id);
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("property_images").delete().eq("id", id);
    toast.success("Image removed");
    refresh();
  };

  const setFeatured = async (id: string, url: string) => {
    await supabase
      .from("property_images")
      .update({ is_featured: false })
      .eq("property_id", propertyId);
    await supabase.from("property_images").update({ is_featured: true }).eq("id", id);
    onCoverChange(url);
    toast.success("Featured image updated — save the listing to apply");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        {uploading ? (
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
        ) : (
          <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">Drag & drop images, videos or PDFs</p>
        <p className="text-xs text-muted-foreground">
          Images are compressed automatically before upload
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-4/3 rounded-xl" />
          ))}
        </div>
      ) : images?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-xl border border-border"
            >
              <img
                src={image.url}
                alt={image.alt ?? "Property"}
                loading="lazy"
                className="aspect-4/3 w-full object-cover"
              />
              {(image.is_featured || image.url === coverImage) && (
                <span className="absolute left-2 top-2 rounded-full bg-brass px-2 py-0.5 text-[10px] font-semibold text-brass-foreground">
                  Featured
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-foreground/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => move(image.id, -1)}
                  aria-label="Move left"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => setFeatured(image.id, image.url)}
                  aria-label="Set featured"
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => move(image.id, 1)}
                  aria-label="Move right"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => remove(image.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

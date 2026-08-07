import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  GripVertical,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
  Video as VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { uploadToStorage } from "@/lib/storage";
import { usePropertyImagesQuery } from "@/lib/queries";
import { NativeMediaSourceButtons } from "@/components/property/NativeMediaSourceButtons";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

type MediaKind = "photo" | "floor_plan" | "360";

type UploadState = { name: string; progress: number };

function DropZone({
  onFiles,
  accept,
  title,
  hint,
  busy,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  title: string;
  hint: string;
  busy: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
    >
      {busy ? (
        <Loader2 className="mb-2 h-7 w-7 animate-spin text-primary" />
      ) : (
        <UploadCloud className="mb-2 h-7 w-7 text-muted-foreground" />
      )}
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function UploadList({ uploads }: { uploads: UploadState[] }) {
  if (!uploads.length) return null;
  return (
    <div className="space-y-2">
      {uploads.map((upload) => (
        <div key={upload.name} className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate">{upload.name}</span>
            <span className="text-muted-foreground">{upload.progress}%</span>
          </div>
          <Progress value={upload.progress} className="mt-2 h-1.5" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full media workspace for a saved listing: photos, floor plans, 360° shots,
 * videos and documents with drag & drop upload, reordering and cover selection.
 */
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
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const videos = useQuery({
    queryKey: ["property-videos", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_videos")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const documents = useQuery({
    queryKey: ["property-documents", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const refreshImages = () => qc.invalidateQueries({ queryKey: ["property-images", propertyId] });

  const byKind = useMemo(() => {
    const list = images ?? [];
    return {
      photo: list.filter((i) => (i.media_kind ?? "photo") === "photo"),
      floor_plan: list.filter((i) => i.media_kind === "floor_plan"),
      "360": list.filter((i) => i.media_kind === "360"),
    } as Record<MediaKind, NonNullable<typeof images>>;
  }, [images]);

  const track = async (file: File, run: () => Promise<void>) => {
    setUploads((prev) => [...prev, { name: file.name, progress: 8 }]);
    const bump = (progress: number) =>
      setUploads((prev) => prev.map((u) => (u.name === file.name ? { ...u, progress } : u)));
    const timer = window.setInterval(
      () =>
        setUploads((prev) =>
          prev.map((u) => (u.name === file.name ? { ...u, progress: Math.min(u.progress + 7, 90) } : u)),
        ),
      220,
    );
    try {
      await run();
      bump(100);
    } finally {
      window.clearInterval(timer);
      window.setTimeout(
        () => setUploads((prev) => prev.filter((u) => u.name !== file.name)),
        600,
      );
    }
  };

  const uploadImages = async (files: File[], kind: MediaKind) => {
    const list = files.filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      toast.error("Please choose image files");
      return;
    }
    try {
      const start = images?.length ?? 0;
      let index = 0;
      for (const file of list) {
        await track(file, async () => {
          const url = await uploadToStorage(file, propertyId);
          await supabase.from("property_images").insert({
            property_id: propertyId,
            url,
            sort_order: start + index,
            media_kind: kind,
          });
          if (kind === "photo" && start === 0 && index === 0) onCoverChange(url);
        });
        index += 1;
      }
      toast.success(`${list.length} file(s) uploaded`);
      refreshImages();
    } catch (error) {
      toast.error(friendlyError(error, "Upload failed"));
    }
  };

  const uploadVideos = async (files: File[]) => {
    const list = files.filter((f) => f.type.startsWith("video/"));
    if (!list.length) {
      toast.error("Please choose video files");
      return;
    }
    try {
      for (const file of list) {
        await track(file, async () => {
          const url = await uploadToStorage(file, propertyId);
          await supabase
            .from("property_videos")
            .insert({ property_id: propertyId, url, title: file.name });
        });
      }
      toast.success("Video uploaded");
      void videos.refetch();
    } catch (error) {
      toast.error(friendlyError(error, "Upload failed"));
    }
  };

  const uploadDocuments = async (files: File[]) => {
    if (!files.length) return;
    try {
      for (const file of files) {
        await track(file, async () => {
          const url = await uploadToStorage(file, propertyId);
          await supabase.from("property_documents").insert({
            property_id: propertyId,
            url,
            name: file.name,
            doc_type: /floor/i.test(file.name) ? "floor_plan" : "brochure",
          });
        });
      }
      toast.success("Document uploaded");
      void documents.refetch();
    } catch (error) {
      toast.error(friendlyError(error, "Upload failed"));
    }
  };

  const reorder = async (sourceId: string, targetId: string, kind: MediaKind) => {
    const list = byKind[kind];
    const from = list.findIndex((i) => i.id === sourceId);
    const to = list.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    await Promise.all(
      next.map((image, index) =>
        supabase.from("property_images").update({ sort_order: index }).eq("id", image.id),
      ),
    );
    refreshImages();
  };

  const remove = async (id: string) => {
    await supabase.from("property_images").delete().eq("id", id);
    toast.success("Image removed");
    refreshImages();
  };

  const setFeatured = async (id: string, url: string) => {
    await supabase
      .from("property_images")
      .update({ is_featured: false })
      .eq("property_id", propertyId);
    await supabase.from("property_images").update({ is_featured: true }).eq("id", id);
    onCoverChange(url);
    toast.success("Cover image updated — save the listing to apply");
    refreshImages();
  };

  const ImageGrid = ({ kind }: { kind: MediaKind }) => {
    const list = byKind[kind];
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-4/3 rounded-xl" />
          ))}
        </div>
      );
    }
    if (!list.length) return null;
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((image) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => setDragId(image.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) void reorder(dragId, image.id, kind);
              setDragId(null);
            }}
            className="group relative overflow-hidden rounded-xl border border-border"
          >
            <img
              src={image.url}
              alt={image.alt ?? "Property media"}
              loading="lazy"
              className="aspect-4/3 w-full object-cover"
            />
            <span className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100">
              <GripVertical className="h-3.5 w-3.5" />
            </span>
            {(image.is_featured || image.url === coverImage) && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-foreground/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {kind === "photo" && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => setFeatured(image.id, image.url)}
                  aria-label="Set as cover"
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
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
    );
  };

  const busy = uploads.length > 0;

  return (
    <div className="space-y-4">
      <NativeMediaSourceButtons onFiles={(picked) => void uploadImages(picked, "photo")} />
      <UploadList uploads={uploads} />

      <Tabs defaultValue="photos">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="photos">Photos ({byKind.photo.length})</TabsTrigger>
          <TabsTrigger value="floor">Floor plans ({byKind.floor_plan.length})</TabsTrigger>
          <TabsTrigger value="360">360° ({byKind["360"].length})</TabsTrigger>
          <TabsTrigger value="videos">Videos ({videos.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="docs">Documents ({documents.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4 space-y-4">
          <DropZone
            busy={busy}
            accept="image/*"
            title="Drag & drop property photos"
            hint="Compressed to WebP automatically · drag tiles to reorder · star to set the cover"
            onFiles={(files) => void uploadImages(files, "photo")}
          />
          <ImageGrid kind="photo" />
        </TabsContent>

        <TabsContent value="floor" className="mt-4 space-y-4">
          <DropZone
            busy={busy}
            accept="image/*"
            title="Upload floor plan images"
            hint="Shown in a dedicated floor plan section on the public page"
            onFiles={(files) => void uploadImages(files, "floor_plan")}
          />
          <ImageGrid kind="floor_plan" />
        </TabsContent>

        <TabsContent value="360" className="mt-4 space-y-4">
          <DropZone
            busy={busy}
            accept="image/*"
            title="Upload 360° panoramas"
            hint="Equirectangular images shown alongside the gallery"
            onFiles={(files) => void uploadImages(files, "360")}
          />
          <ImageGrid kind="360" />
        </TabsContent>

        <TabsContent value="videos" className="mt-4 space-y-4">
          <DropZone
            busy={busy}
            accept="video/*"
            title="Upload walkthrough videos"
            hint="MP4 or WebM · a YouTube link can be added below instead"
            onFiles={(files) => void uploadVideos(files)}
          />
          <div className="space-y-2">
            {(videos.data ?? []).map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <VideoIcon className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 truncate">{video.title ?? "Video"}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete video"
                  onClick={async () => {
                    await supabase.from("property_videos").delete().eq("id", video.id);
                    void videos.refetch();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4 space-y-4">
          <DropZone
            busy={busy}
            accept="application/pdf,image/*"
            title="Upload brochures & documents"
            hint="PDFs stay private unless you enable documents in the Sharing step"
            onFiles={(files) => void uploadDocuments(files)}
          />
          <div className="space-y-2">
            {(documents.data ?? []).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <FileText className="h-4 w-4 text-primary" />
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {doc.name}
                </a>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete document"
                  onClick={async () => {
                    await supabase.from("property_documents").delete().eq("id", doc.id);
                    void documents.refetch();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

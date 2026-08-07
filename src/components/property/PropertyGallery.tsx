import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id?: string;
  url: string;
  alt?: string | null;
  media_kind?: string | null;
};

function Placeholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      <Building2 className="h-10 w-10 opacity-40" />
      <p className="text-xs font-medium">Photos coming soon</p>
    </div>
  );
}

/**
 * Premium listing gallery: hero image, thumbnail strip, keyboard navigation and
 * a fullscreen lightbox. Images below the fold are lazy-loaded.
 */
export function PropertyGallery({
  images,
  cover,
  title,
}: {
  images: GalleryImage[];
  cover?: string | null;
  title: string;
}) {
  const ordered = useMemo(() => {
    const seen = new Set<string>();
    const list: GalleryImage[] = [];
    const push = (image: GalleryImage) => {
      if (!image.url || seen.has(image.url)) return;
      seen.add(image.url);
      list.push(image);
    };
    const photos = images.filter((i) => (i.media_kind ?? "photo") !== "floor_plan");
    const coverImage = photos.find((i) => i.url === cover);
    if (coverImage) push(coverImage);
    else if (cover) push({ url: cover });
    photos.forEach(push);
    return list;
  }, [images, cover]);

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const total = ordered.length;
  const step = useCallback(
    (delta: number) => setActive((current) => (total ? (current + delta + total) % total : 0)),
    [total],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  if (!total) return <Placeholder className="h-72 w-full md:h-[26rem]" />;

  const current = ordered[Math.min(active, total - 1)]!;

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted">
        <img
          src={current.url}
          alt={current.alt ?? `${title} — photo ${active + 1} of ${total}`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="h-72 w-full cursor-zoom-in object-cover transition-transform duration-500 md:h-[28rem]"
          onClick={() => setOpen(true)}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-foreground/70 px-3 py-1 text-xs font-medium text-background">
          <Images className="h-3.5 w-3.5" />
          {active + 1} / {total}
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-3 right-3"
          onClick={() => setOpen(true)}
        >
          <Expand className="h-4 w-4" /> Fullscreen
        </Button>
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ordered.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
                index === active
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={image.url}
                alt={image.alt ?? `${title} thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-foreground/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery`}
        >
          <div className="flex items-center justify-between text-background">
            <p className="text-sm">
              {active + 1} / {total}
            </p>
            <button
              type="button"
              aria-label="Close gallery"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full bg-background/15 hover:bg-background/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            {total > 1 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => step(-1)}
                className="absolute left-0 grid h-11 w-11 place-items-center rounded-full bg-background/15 text-background hover:bg-background/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <img
              src={current.url}
              alt={current.alt ?? `${title} — photo ${active + 1}`}
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
            {total > 1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => step(1)}
                className="absolute right-0 grid h-11 w-11 place-items-center rounded-full bg-background/15 text-background hover:bg-background/25"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Images } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAllImagesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({
    meta: [
      { title: "Media library — BrokrSuite" },
      {
        name: "description",
        content: "Every photo uploaded across your listings, in one searchable gallery.",
      },
      { property: "og:title", content: "Media library — BrokrSuite" },
      { property: "og:description", content: "All listing photography in one place." },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  const { data, isLoading } = useAllImagesQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media library"
        description="All imagery attached to your listings. Upload new photos from a property's media tab."
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 rounded-xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Images}
          title="No media yet"
          description="Add a property and upload photos to build your library."
          action={
            <Button asChild>
              <Link to="/properties/new">Add property</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {(data ?? []).map((image) => (
            <figure key={image.id} className="surface group overflow-hidden">
              <img
                src={image.url}
                alt={image.alt_text ?? image.properties?.title ?? "Property photo"}
                loading="lazy"
                className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="truncate p-2 text-xs text-muted-foreground">
                {image.properties?.title ?? "Unlinked"}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

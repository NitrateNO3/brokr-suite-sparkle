import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Copy,
  ExternalLink,
  Pencil,
  Search,
  Share2,
  Star,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePropertiesQuery,
  useDeleteProperty,
  useDuplicateProperty,
  useUpdateProperty,
} from "@/lib/queries";
import { formatPrice, formatNumber, locationLine, timeAgo } from "@/lib/format";
import { CITIES, PROPERTY_TYPES, STATUSES, labelFor } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/properties/")({
  head: () => ({
    meta: [
      { title: "Properties — BrokrSuite" },
      {
        name: "description",
        content: "Search, filter, publish, duplicate and manage every listing in your inventory.",
      },
      { property: "og:title", content: "Properties — BrokrSuite" },
      { property: "og:description", content: "Your full real estate inventory in one table." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const { data, isLoading } = usePropertiesQuery();
  const remove = useDeleteProperty();
  const duplicate = useDuplicateProperty();
  const update = useUpdateProperty();

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [share, setShare] = useState<{ slug: string; title: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (city !== "all" && p.city !== city) return false;
      if (type !== "all" && p.property_type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!term) return true;
      return [p.title, p.property_code, p.sector, p.locality, p.city]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [data, search, city, type, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description={`${formatNumber(data?.length ?? 0)} listings in your inventory.`}
        actions={
          <Button asChild>
            <Link to="/properties/new">Add property</Link>
          </Button>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, code or locality…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description="Try clearing filters, or add your first listing to get started."
          action={
            <Button asChild>
              <Link to="/properties/new">Add property</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((property) => (
            <div
              key={property.id}
              className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <img
                src={property.cover_image ?? ""}
                alt={property.title}
                loading="lazy"
                className="h-32 w-full rounded-lg object-cover sm:h-20 sm:w-28"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{property.title}</p>
                  {property.is_featured && (
                    <Star className="h-3.5 w-3.5 fill-brass text-brass" aria-label="Featured" />
                  )}
                  <StatusBadge status={property.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {property.property_code} · {labelFor(PROPERTY_TYPES, property.property_type)} ·{" "}
                  {locationLine(property.city, property.sector)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {timeAgo(property.updated_at)} · {formatNumber(property.views)} views
                </p>
              </div>

              <p className="display-title text-lg sm:w-32 sm:text-right">
                {formatPrice(Number(property.price))}
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={property.is_published ? "Unpublish" : "Publish"}
                  onClick={() =>
                    update.mutate(
                      { id: property.id, values: { is_published: !property.is_published } },
                      {
                        onSuccess: () =>
                          toast.success(property.is_published ? "Unpublished" : "Published"),
                      },
                    )
                  }
                >
                  {property.is_published ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Share"
                  onClick={() => setShare({ slug: property.slug, title: property.title })}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild aria-label="Open public page">
                  <Link to="/property/$slug" params={{ slug: property.slug }} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Duplicate"
                  onClick={() =>
                    duplicate.mutate(property.id, {
                      onSuccess: () => toast.success("Duplicated as a draft"),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild aria-label="Edit">
                  <Link to="/properties/$id/edit" params={{ id: property.id }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => setPendingDelete(property.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {share && (
        <ShareDialog
          open={Boolean(share)}
          onOpenChange={(open) => !open && setShare(null)}
          slug={share.slug}
          title={share.title}
        />
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the listing and its public page permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDelete) return;
                remove.mutate(pendingDelete, {
                  onSuccess: () => toast.success("Property deleted"),
                  onError: (error) => toast.error(error.message),
                });
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

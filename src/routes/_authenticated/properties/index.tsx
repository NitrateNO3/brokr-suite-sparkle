import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  FileText,
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Search,
  Share2,
  Star,
  Trash2,
  Eye,
  EyeOff,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  type Property,
} from "@/lib/queries";
import { formatPrice, formatNumber, locationLine, timeAgo } from "@/lib/format";
import { CITIES, PROPERTY_TYPES, STATUSES, labelFor } from "@/lib/constants";
import { downloadCsv } from "@/lib/export";
import { PropertyCard } from "@/components/property/PropertyCard";
import { usePropertyImageCountsQuery } from "@/lib/queries";
import { useTeamQuery } from "@/lib/roles";

const PAGE_SIZE = 12;

const SORTS = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "views", label: "Most viewed" },
  { value: "title", label: "Title A–Z" },
] as const;

type SortKey = (typeof SORTS)[number]["value"];

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
  const { data: imageCounts } = usePropertyImageCountsQuery();
  const { data: team } = useTeamQuery();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [city, setCity] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [share, setShare] = useState<{
    slug: string;
    title: string;
    coverImage?: string | null;
    subtitle?: string | null;
    price?: string | null;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, city, type, status, sort]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    const rows = (data ?? []).filter((p) => {
      if (city !== "all" && p.city !== city) return false;
      if (type !== "all" && p.property_type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!term) return true;
      return [p.title, p.property_code, p.sector, p.address, p.city]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });

    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "price_desc":
          return Number(b.price) - Number(a.price);
        case "price_asc":
          return Number(a.price) - Number(b.price);
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [data, debounced, city, type, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageRows.map((p) => p.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleRow = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const bulkUpdate = async (values: Parameters<typeof update.mutateAsync>[0]["values"]) => {
    await Promise.all(selected.map((id) => update.mutateAsync({ id, values })));
    toast.success(`Updated ${selected.length} ${selected.length === 1 ? "listing" : "listings"}`);
    setSelected([]);
  };

  const exportCsv = (rows: Property[]) => {
    if (!rows.length) {
      toast.error("Nothing to export.");
      return;
    }
    downloadCsv(
      `brokrsuite-properties-${new Date().toISOString().slice(0, 10)}`,
      rows.map((p) => ({
        code: p.property_code,
        title: p.title,
        type: labelFor(PROPERTY_TYPES, p.property_type),
        purpose: p.purpose,
        status: p.status,
        published: p.is_published ? "yes" : "no",
        featured: p.is_featured ? "yes" : "no",
        price: p.price,
        city: p.city ?? "",
        sector: p.sector ?? "",
        bedrooms: p.bedrooms ?? "",
        bathrooms: p.bathrooms ?? "",
        views: p.views ?? 0,
        public_url: `${window.location.origin}/property/${p.slug}`,
        created_at: p.created_at,
      })),
    );
    toast.success(`Exported ${rows.length} rows`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description={`${formatNumber(data?.length ?? 0)} listings in your inventory.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportCsv(filtered)}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button asChild>
              <Link to="/properties/new">Add property</Link>
            </Button>
          </div>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search by title, code or locality…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search properties"
          />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="sm:w-36" aria-label="Filter by city">
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
          <SelectTrigger className="sm:w-40" aria-label="Filter by type">
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
          <SelectTrigger className="sm:w-36" aria-label="Filter by status">
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
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="sm:w-44" aria-label="Sort listings">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <Button
            type="button"
            size="icon"
            variant={view === "grid" ? "secondary" : "ghost"}
            className="h-8 w-8"
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={view === "list" ? "secondary" : "ghost"}
            className="h-8 w-8"
            aria-label="List view"
            onClick={() => setView("list")}
          >
            <Rows3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="surface flex flex-wrap items-center gap-2 p-3">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_published: true })}>
              Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_published: false })}>
              Unpublish
            </Button>
            <Select onValueChange={(value) => bulkUpdate({ status: value as Property["status"] })}>
              <SelectTrigger className="h-8 w-36" aria-label="Bulk status update">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportCsv(filtered.filter((p) => selected.includes(p.id)))}
            >
              Export
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDelete(true)}>
              Delete
            </Button>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-3 px-1">
            <Checkbox
              checked={allOnPageSelected}
              onCheckedChange={(checked) =>
                setSelected((prev) =>
                  checked
                    ? Array.from(new Set([...prev, ...pageIds]))
                    : prev.filter((id) => !pageIds.includes(id)),
                )
              }
              aria-label="Select all on this page"
            />
            <span className="text-muted-foreground text-xs">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {formatNumber(filtered.length)}
            </span>
          </div>

          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageRows.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  selected={selected.includes(property.id)}
                  onToggleSelect={() => toggleRow(property.id)}
                  imageCount={imageCounts?.[property.id] ?? 0}
                  agentName={
                    (team ?? []).find((m) => m.id === property.assigned_to)?.full_name ?? null
                  }
                  onShare={() =>
                    setShare({
                      slug: property.slug,
                      title: property.title,
                      coverImage: property.cover_image,
                      subtitle: locationLine(property.city, property.sector),
                      price: formatPrice(Number(property.price)),
                    })
                  }
                  onDelete={() => setPendingDelete(property.id)}
                  onDuplicate={() =>
                    duplicate.mutate(property, {
                      onSuccess: () => toast.success("Duplicated as a draft"),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                  onTogglePublished={() =>
                    update.mutate(
                      { id: property.id, values: { is_published: !property.is_published } },
                      {
                        onSuccess: () =>
                          toast.success(property.is_published ? "Unpublished" : "Published"),
                      },
                    )
                  }
                  onToggleFeatured={() =>
                    update.mutate(
                      { id: property.id, values: { is_featured: !property.is_featured } },
                      {
                        onSuccess: () =>
                          toast.success(property.is_featured ? "Unfeatured" : "Featured"),
                      },
                    )
                  }
                />
              ))}
            </div>
          ) : null}

          {view === "list" &&
            pageRows.map((property) => (
            <div
              key={property.id}
              className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <Checkbox
                checked={selected.includes(property.id)}
                onCheckedChange={() => toggleRow(property.id)}
                aria-label={`Select ${property.title}`}
              />
              <img
                src={property.cover_image ?? ""}
                alt={`${property.title} cover photo`}
                loading="lazy"
                className="h-32 w-full rounded-lg object-cover sm:h-20 sm:w-28"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{property.title}</p>
                  {property.is_featured && (
                    <Star className="fill-brass text-brass h-3.5 w-3.5" aria-label="Featured" />
                  )}
                  <StatusBadge status={property.status} />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {property.property_code} · {labelFor(PROPERTY_TYPES, property.property_type)} ·{" "}
                  {locationLine(property.city, property.sector)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Updated {timeAgo(property.updated_at)} · {formatNumber(property.views)} views
                </p>
              </div>

              <p className="display-title text-lg sm:w-32 sm:text-right">
                {formatPrice(Number(property.price))}
              </p>

              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label={`Actions for ${property.title}`}
              >
                <IconAction
                  label={property.is_featured ? "Remove from Favorites" : "Add to Favorites"}
                  active={property.is_featured}
                  onClick={() =>
                    update.mutate(
                      { id: property.id, values: { is_featured: !property.is_featured } },
                      {
                        onSuccess: () =>
                          toast.success(property.is_featured ? "Unfeatured" : "Featured"),
                      },
                    )
                  }
                >
                  <Star
                    className={`h-4 w-4 ${property.is_featured ? "fill-brass text-brass" : ""}`}
                  />
                </IconAction>
                <IconAction
                  label={property.is_published ? "Hide Property" : "View Property"}
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
                </IconAction>
                <IconAction
                  label="Share Property"
                  onClick={() => setShare({ slug: property.slug, title: property.title })}
                >
                  <Share2 className="h-4 w-4" />
                </IconAction>
                <IconAction label="Open Public Listing" asChild>
                  <Link to="/property/$slug" params={{ slug: property.slug }} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </IconAction>
                <IconAction label="Generate Brochure / PDF" asChild>
                  <Link to="/properties/$id/brochure" params={{ id: property.id }}>
                    <FileText className="h-4 w-4" />
                  </Link>
                </IconAction>
                <IconAction label="Copy Property Link" onClick={() => copyLink(property.slug)}>
                  <Copy className="h-4 w-4" />
                </IconAction>
                <IconAction
                  label="Duplicate Property"
                  onClick={() =>
                    duplicate.mutate(property, {
                      onSuccess: () => toast.success("Duplicated as a draft"),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                >
                  <CopyPlus className="h-4 w-4" />
                </IconAction>
                <IconAction label="Edit Property" asChild>
                  <Link to="/properties/$id/edit" params={{ id: property.id }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </IconAction>
                <IconAction
                  label="Delete Property"
                  onClick={() => setPendingDelete(property.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                </IconAction>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {share && (
        <ShareDialog
          open={Boolean(share)}
          onOpenChange={(open) => !open && setShare(null)}
          slug={share.slug}
          title={share.title}
          coverImage={share.coverImage ?? null}
          subtitle={share.subtitle ?? null}
          price={share.price ?? null}
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

      <AlertDialog open={bulkDelete} onOpenChange={setBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} listings?</AlertDialogTitle>
            <AlertDialogDescription>
              Their public pages and media links are removed permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setBulkDelete(false);
                try {
                  await Promise.all(selected.map((id) => remove.mutateAsync(id)));
                  toast.success(`Deleted ${selected.length} listings`);
                  setSelected([]);
                } catch (error) {
                  toast.error((error as Error).message);
                }
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

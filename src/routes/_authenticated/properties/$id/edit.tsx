import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property/PropertyForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertyQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/properties/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit property — BrokrSuite" },
      {
        name: "description",
        content: "Update listing details, pricing, media and publishing status.",
      },
      { property: "og:title", content: "Edit property — BrokrSuite" },
      { property: "og:description", content: "Refine and republish an existing listing." },
    ],
  }),
  component: EditPropertyPage,
});

function EditPropertyPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = usePropertyQuery(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.title ?? "Edit property"}
        description={data ? `${data.property_code} · updates go live instantly.` : ""}
      />
      {isLoading ? <Skeleton className="h-96 rounded-xl" /> : <PropertyForm property={data ?? null} />}
    </div>

  );
}

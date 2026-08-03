import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property/PropertyForm";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "Add property — BrokrSuite" },
      {
        name: "description",
        content: "Create a new listing with pricing, location, amenities, media and SEO details.",
      },
      { property: "og:title", content: "Add property — BrokrSuite" },
      { property: "og:description", content: "Publish a new property listing in minutes." },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add property"
        description="Fill in the details — the public listing page is generated automatically."
      />
      <PropertyForm />
    </div>
  );
}

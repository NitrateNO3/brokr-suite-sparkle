import { createFileRoute } from "@tanstack/react-router";
import { PostPropertyForm } from "@/components/property/PostPropertyForm";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "Post a property — BrokrSuite" },
      {
        name: "description",
        content:
          "Post a property in under a minute — owner details, sale or rent, property type and locality.",
      },
      { property: "og:title", content: "Post a property — BrokrSuite" },
      { property: "og:description", content: "Publish a new property listing in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  return (
    <div className="surface p-6 md:p-8">
      <QuickPostForm />
    </div>
  );
}


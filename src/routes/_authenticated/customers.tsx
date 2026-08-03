import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadsQuery } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — BrokrSuite" },
      {
        name: "description",
        content: "A deduplicated contact book built from every enquiry your listings receive.",
      },
      { property: "og:title", content: "Customers — BrokrSuite" },
      { property: "og:description", content: "Your agency contact book, built automatically." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data, isLoading } = useLeadsQuery();
  const [search, setSearch] = useState("");

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string | null; phone: string | null; enquiries: number; last: string }
    >();
    (data ?? []).forEach((lead) => {
      const key = lead.phone ?? lead.email ?? lead.name;
      const existing = map.get(key);
      if (existing) {
        existing.enquiries += 1;
        if (lead.created_at > existing.last) existing.last = lead.created_at;
      } else {
        map.set(key, {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          enquiries: 1,
          last: lead.created_at,
        });
      }
    });
    const term = search.trim().toLowerCase();
    return Array.from(map.values())
      .filter((c) =>
        term
          ? [c.name, c.email, c.phone].filter(Boolean).some((f) => String(f).toLowerCase().includes(term))
          : true,
      )
      .sort((a, b) => b.last.localeCompare(a.last));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Unique contacts assembled from all enquiries across your listings."
      />

      <div className="surface p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No customers yet"
          description="Contacts appear here as soon as your first enquiry arrives."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <div key={`${customer.name}-${customer.phone ?? customer.email}`} className="surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{customer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {customer.phone ?? customer.email ?? "No contact details"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{customer.enquiries} enquiry(s)</span>
                <span>Last: {formatDate(customer.last)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

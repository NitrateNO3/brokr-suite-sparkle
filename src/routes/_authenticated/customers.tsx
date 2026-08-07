import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Share2, Star, UserRound, Pencil, Trash2, Phone, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { IconAction } from "@/components/shared/IconAction";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerFormDialog } from "@/components/customer/CustomerFormDialog";
import { CustomerDetailSheet } from "@/components/customer/CustomerDetailSheet";
import { SharePropertiesDialog } from "@/components/share/SharePropertiesDialog";
import {
  CUSTOMER_STATUSES,
  labelOf,
  useCustomersQuery,
  useDeleteCustomer,
  useUpdateCustomer,
  type Customer,
} from "@/lib/customers";
import { formatPrice, timeAgo } from "@/lib/format";
import { formatFollowUp } from "@/lib/followup";
import { mailtoUrl, openWithSystemApp, telUrl, whatsappUrl } from "@/lib/native";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — BrokrSuite" },
      {
        name: "description",
        content:
          "A complete customer CRM: requirements, shared properties, site visits, notes and follow-ups in one place.",
      },
      { property: "og:title", content: "Customers — BrokrSuite" },
      { property: "og:description", content: "Your agency contact book and customer CRM." },
    ],
  }),
  component: CustomersPage,
});

const ALL = "all";

function CustomersPage() {
  const { data, isLoading } = useCustomersQuery();
  const update = useUpdateCustomer();
  const remove = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [active, setActive] = useState<Customer | null>(null);
  const [shareFor, setShareFor] = useState<Customer | null>(null);

  const customers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .filter((c) => (status === ALL ? true : c.status === status))
      .filter((c) =>
        term
          ? [c.full_name, c.phone, c.email, c.preferred_location, c.preferred_city, ...(c.tags ?? [])]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(term))
          : true,
      )
      .sort((a, b) => Number(b.is_vip) - Number(a.is_vip));
  }, [data, search, status]);

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormOpen(true);
  };

  const del = async (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.full_name}? This cannot be undone.`)) return;
    await remove.mutateAsync(customer.id);
    toast.success("Customer deleted");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Every buyer and tenant you work with, with shared properties, visits and follow-ups attached."
        actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add customer
        </Button>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, email, location or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {CUSTOMER_STATUSES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No customers yet"
          description="Add your first customer, or convert an enquiry from the Leads board."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="surface group p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() => setActive(customer)}
              >
                <Avatar className="h-11 w-11">
                  <AvatarImage src={customer.photo_url ?? undefined} alt={customer.full_name} />
                  <AvatarFallback>{customer.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{customer.full_name}</span>
                    {customer.is_vip && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {customer.phone ?? customer.email ?? "No contact details"}
                  </span>
                </span>
                <Badge variant="secondary" className="shrink-0">
                  {labelOf(CUSTOMER_STATUSES, customer.status)}
                </Badge>
              </button>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="truncate">
                  {customer.preferred_location || customer.preferred_city || "No preference set"}
                  {customer.bhk_preference ? ` · ${customer.bhk_preference} BHK` : ""}
                </p>
                <p>
                  {customer.budget_min || customer.budget_max
                    ? `${formatPrice(Number(customer.budget_min ?? 0))} – ${formatPrice(Number(customer.budget_max ?? 0))}`
                    : "Budget not set"}
                </p>
                <p>
                  Last contact: {timeAgo(customer.last_contacted_at)} ·{" "}
                  {formatFollowUp(customer.next_follow_up_at)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                <IconAction
                  label="Call"
                  onClick={() =>
                    customer.phone
                      ? void openWithSystemApp(telUrl(customer.phone))
                      : toast.error("No phone number")
                  }
                >
                  <Phone className="h-4 w-4" />
                </IconAction>
                <IconAction
                  label="WhatsApp"
                  onClick={() =>
                    void openWithSystemApp(
                      whatsappUrl(`Hi ${customer.full_name},`, customer.whatsapp ?? customer.phone),
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                </IconAction>
                <IconAction
                  label="Email"
                  onClick={() =>
                    customer.email
                      ? void openWithSystemApp(mailtoUrl(customer.email))
                      : toast.error("No email address")
                  }
                >
                  <Mail className="h-4 w-4" />
                </IconAction>
                <IconAction label="Share properties" onClick={() => setShareFor(customer)}>
                  <Share2 className="h-4 w-4" />
                </IconAction>
                <IconAction
                  label={customer.is_vip ? "Remove VIP" : "Mark VIP"}
                  active={customer.is_vip}
                  onClick={() =>
                    void update.mutateAsync({
                      id: customer.id,
                      values: {
                        is_vip: !customer.is_vip,
                        priority: !customer.is_vip ? "vip" : "medium",
                      },
                    })
                  }
                >
                  <Star className={customer.is_vip ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                </IconAction>
                <IconAction label="Edit customer" onClick={() => openEdit(customer)}>
                  <Pencil className="h-4 w-4" />
                </IconAction>
                <IconAction
                  label="Delete customer"
                  className="hover:text-destructive"
                  onClick={() => void del(customer)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconAction>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
      <CustomerDetailSheet
        customer={active}
        onOpenChange={(open) => !open && setActive(null)}
        onEdit={(customer) => {
          setActive(null);
          openEdit(customer);
        }}
      />
      <SharePropertiesDialog
        open={Boolean(shareFor)}
        onOpenChange={(open) => !open && setShareFor(null)}
        {...(shareFor ? { presetCustomerId: shareFor.id } : {})}
      />
    </div>
  );
}

import { useState } from "react";
import {
  Activity,
  CalendarClock,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  Share2,
  Star,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { SharePropertiesDialog } from "@/components/share/SharePropertiesDialog";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import {
  CUSTOMER_STATUSES,
  labelOf,
  logCustomerActivity,
  useAddCustomerDocument,
  useAddCustomerNote,
  useCustomerActivityQuery,
  useCustomerDocumentsQuery,
  useCustomerNotesQuery,
  useCustomerSharesQuery,
  useSiteVisitsQuery,
  useUpdateCustomer,
  type Customer,
} from "@/lib/customers";
import { usePropertiesQuery } from "@/lib/queries";
import { formatDate, formatPrice, timeAgo } from "@/lib/format";
import { formatFollowUp } from "@/lib/followup";
import { mailtoUrl, openWithSystemApp, telUrl, whatsappUrl } from "@/lib/native";
import { uploadToStorage } from "@/lib/storage";

export function CustomerDetailSheet({
  customer,
  onOpenChange,
  onEdit,
}: {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
}) {
  const id = customer?.id;
  const notes = useCustomerNotesQuery(id);
  const docs = useCustomerDocumentsQuery(id);
  const activity = useCustomerActivityQuery(id);
  const shares = useCustomerSharesQuery(id);
  const visits = useSiteVisitsQuery(id);
  const { data: properties } = usePropertiesQuery();
  const addNote = useAddCustomerNote();
  const addDoc = useAddCustomerDocument();
  const update = useUpdateCustomer();

  const [noteBody, setNoteBody] = useState("");
  const [uploading, setUploading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  if (!customer) return null;

  const propertyTitle = (propertyId: string) =>
    (properties ?? []).find((p) => p.id === propertyId)?.title ?? "Property";

  const contact = async (kind: "call" | "whatsapp" | "email") => {
    const label = kind === "call" ? "Called" : kind === "whatsapp" ? "WhatsApp sent" : "Email sent";
    if (kind === "call" && customer.phone) await openWithSystemApp(telUrl(customer.phone));
    if (kind === "whatsapp")
      await openWithSystemApp(
        whatsappUrl(`Hi ${customer.full_name},`, customer.whatsapp ?? customer.phone),
      );
    if (kind === "email" && customer.email) await openWithSystemApp(mailtoUrl(customer.email));
    await logCustomerActivity({ customerId: customer.id, kind, title: label });
    await update.mutateAsync({
      id: customer.id,
      values: { last_contacted_at: new Date().toISOString() },
    });
  };

  const saveNote = async () => {
    if (!noteBody.trim()) return;
    await addNote.mutateAsync({ customerId: customer.id, body: noteBody.trim() });
    setNoteBody("");
    toast.success("Note added");
  };

  const uploadDoc = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file, `customers/${customer.id}`);
      await addDoc.mutateAsync({ customerId: customer.id, url, name: file.name });
      toast.success("Document uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleVip = async () => {
    await update.mutateAsync({
      id: customer.id,
      values: { is_vip: !customer.is_vip, priority: !customer.is_vip ? "vip" : "medium" },
    });
    toast.success(customer.is_vip ? "VIP removed" : "Marked as VIP");
  };

  return (
    <>
      <Sheet open={Boolean(customer)} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={customer.photo_url ?? undefined} alt={customer.full_name} />
                <AvatarFallback>{customer.full_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="display-title truncate">{customer.full_name}</SheetTitle>
                <SheetDescription className="truncate">
                  {customer.phone ?? customer.email ?? "No contact details"}
                </SheetDescription>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{labelOf(CUSTOMER_STATUSES, customer.status)}</Badge>
              {customer.is_vip && <Badge>VIP</Badge>}
              {customer.intent && <Badge variant="outline">{customer.intent}</Badge>}
              {(customer.tags ?? []).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-5">
            <Action icon={Phone} label="Call" onClick={() => void contact("call")} />
            <Action icon={MessageCircle} label="WhatsApp" onClick={() => void contact("whatsapp")} />
            <Action icon={Mail} label="Email" onClick={() => void contact("email")} />
            <Action icon={Share2} label="Share" onClick={() => setShareOpen(true)} />
            <Action icon={CalendarClock} label="Visit" onClick={() => setVisitOpen(true)} />
          </div>

          <div className="flex flex-wrap gap-2 px-4">
            <Button size="sm" variant="outline" onClick={() => onEdit(customer)}>
              Edit customer
            </Button>
            <Button size="sm" variant="outline" onClick={() => void toggleVip()}>
              <Star className="h-4 w-4" /> {customer.is_vip ? "Remove VIP" : "Mark VIP"}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 px-4">
            <Stat label="Shares" value={shares.data?.length ?? 0} />
            <Stat label="Visits" value={visits.data?.length ?? 0} />
            <Stat label="Notes" value={notes.data?.length ?? 0} />
          </div>

          <Tabs defaultValue="overview" className="px-4 pb-8">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 pt-4">
              <Row label="Occupation" value={customer.occupation} />
              <Row label="Company" value={customer.company} />
              <Row
                label="Budget"
                value={
                  customer.budget_min || customer.budget_max
                    ? `${formatPrice(Number(customer.budget_min ?? 0))} – ${formatPrice(Number(customer.budget_max ?? 0))}`
                    : null
                }
              />
              <Row label="Preferred location" value={customer.preferred_location} />
              <Row label="Preferred city" value={customer.preferred_city} />
              <Row label="Property type" value={customer.property_type} />
              <Row
                label="BHK preference"
                value={customer.bhk_preference ? `${customer.bhk_preference} BHK` : null}
              />
              <Row label="Lead source" value={customer.source} />
              <Row label="Last contact" value={timeAgo(customer.last_contacted_at)} />
              <Row label="Next follow-up" value={formatFollowUp(customer.next_follow_up_at)} />
              <Row label="Created" value={formatDate(customer.created_at)} />
              {customer.notes && (
                <p className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                  {customer.notes}
                </p>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="pt-4">
              {activity.isLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (activity.data ?? []).length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No activity yet"
                  description="Calls, shares, notes and visits appear here automatically."
                />
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {(activity.data ?? []).map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("en-IN")}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-3 pt-4">
              <Textarea
                rows={3}
                value={noteBody}
                placeholder="Add an internal note…"
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <Button size="sm" onClick={() => void saveNote()} disabled={addNote.isPending}>
                <NotebookPen className="h-4 w-4" /> Add note
              </Button>
              <div className="space-y-2">
                {(notes.data ?? []).map((note) => (
                  <div key={note.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm">{note.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(note.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shared" className="space-y-3 pt-4">
              {(shares.data ?? []).length === 0 ? (
                <EmptyState
                  icon={Share2}
                  title="Nothing shared yet"
                  description="Send a curated set of listings and track opens and favourites."
                />
              ) : (
                (shares.data ?? []).map((share) => (
                  <div key={share.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {share.title ?? "Shared properties"}
                      </p>
                      <Badge variant={share.opened_at ? "default" : "secondary"}>
                        {share.opened_at ? `Opened · ${share.view_count} views` : "Not opened"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {share.property_share_items.length} properties · via {share.channel} ·{" "}
                      {formatDate(share.created_at)}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {share.property_share_items.map((item) => (
                        <li key={item.property_id} className="text-xs text-muted-foreground">
                          • {propertyTitle(item.property_id)}
                          {item.is_favourite && (
                            <span className="ml-1 text-primary">★ favourite</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="visits" className="space-y-3 pt-4">
              {(visits.data ?? []).length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No visits scheduled"
                  description="Book a site visit and it syncs to the team calendar."
                />
              ) : (
                (visits.data ?? []).map((visit) => (
                  <div key={visit.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {visit.properties?.title ?? "Site visit"}
                      </p>
                      <Badge variant="secondary">{visit.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(visit.scheduled_at).toLocaleString("en-IN")}
                      {visit.meeting_point ? ` · ${visit.meeting_point}` : ""}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="docs" className="space-y-3 pt-4">
              <Label htmlFor="customer-doc" className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload document
                </span>
              </Label>
              <input
                id="customer-doc"
                type="file"
                className="hidden"
                onChange={(e) => void uploadDoc(e.target.files?.[0])}
              />
              <div className="space-y-2">
                {(docs.data ?? []).map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm hover:bg-accent"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{doc.name}</span>
                  </a>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <SharePropertiesDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        presetCustomerId={customer.id}
      />
      <ScheduleVisitDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        customerId={customer.id}
      />
    </>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-xs transition-all hover:bg-accent hover:shadow-sm"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center">
      <p className="display-title text-lg">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value || "—"}</span>
    </div>
  );
}

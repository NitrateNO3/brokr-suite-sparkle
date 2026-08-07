import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSiteVisit, useCustomersQuery } from "@/lib/customers";
import { usePropertiesQuery } from "@/lib/queries";
import { useTeamQuery } from "@/lib/roles";
import { fromLocalInput, toLocalInput } from "@/lib/followup";

const NONE = "none";

export function ScheduleVisitDialog({
  open,
  onOpenChange,
  customerId,
  propertyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  propertyId?: string;
}) {
  const { data: customers } = useCustomersQuery();
  const { data: properties } = usePropertiesQuery();
  const { data: team } = useTeamQuery();
  const create = useCreateSiteVisit();

  const [customer, setCustomer] = useState(NONE);
  const [property, setProperty] = useState(NONE);
  const [agent, setAgent] = useState(NONE);
  const [when, setWhen] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setCustomer(customerId ?? NONE);
    setProperty(propertyId ?? NONE);
    setAgent(NONE);
    setWhen(toLocalInput(new Date(Date.now() + 86400000).toISOString()));
    setMeetingPoint("");
    setNotes("");
  }, [open, customerId, propertyId]);

  const submit = async () => {
    const scheduledAt = fromLocalInput(when);
    if (!scheduledAt) {
      toast.error("Pick a date and time.");
      return;
    }
    try {
      await create.mutateAsync({
        scheduled_at: scheduledAt,
        customer_id: customer === NONE ? null : customer,
        property_id: property === NONE ? null : property,
        agent_id: agent === NONE ? null : agent,
        meeting_point: meetingPoint.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success("Site visit scheduled");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule visit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display-title">Schedule site visit</DialogTitle>
          <DialogDescription>
            The visit appears on the customer timeline and the team visit calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No customer linked</SelectItem>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Property</Label>
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No property linked</SelectItem>
                {(properties ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Agent</Label>
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Assign agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {(team ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name ?? member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date &amp; time</Label>
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Meeting point</Label>
              <Input
                value={meetingPoint}
                placeholder="Site gate / office"
                onChange={(e) => setMeetingPoint(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule visit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

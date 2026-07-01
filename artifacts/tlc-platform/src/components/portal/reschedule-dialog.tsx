import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRescheduleBooking } from "@workspace/api-client-react";

export function RescheduleDialog({
  bookingId,
  currentSlot,
}: {
  bookingId: string;
  currentSlot: string;
}) {
  const qc = useQueryClient();
  const rescheduleBooking = useRescheduleBooking();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // datetime-local needs "YYYY-MM-DDTHH:mm"
  const initial = new Date(currentSlot).toISOString().slice(0, 16);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const slot = new Date(String(fd.get("slot"))).toISOString();
    startTransition(async () => {
      const res = await rescheduleBooking.mutateAsync({ id: bookingId, data: { slot } });
      if (!res.ok) return setError(res.error ?? "Could not reschedule");
      setOpen(false);
      toast.success("Coaching rescheduled");
      await qc.invalidateQueries();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[12px] font-semibold text-mq">Reschedule</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule coaching</DialogTitle>
          <DialogDescription>Pick a new date and time for this 1:1 session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slot">New date &amp; time</Label>
            <Input id="slot" name="slot" type="datetime-local" defaultValue={initial} required />
          </div>
          {error && <p className="text-[13px] font-medium text-danger">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

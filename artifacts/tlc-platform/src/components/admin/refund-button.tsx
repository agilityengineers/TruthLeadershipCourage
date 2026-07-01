import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRefundPayment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RefundButton({ paymentId, maxAmount }: { paymentId: string; maxAmount: number }) {
  const qc = useQueryClient();
  const refundPayment = useRefundPayment();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = refundPayment.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[12px] font-semibold text-danger">Refund</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue refund</DialogTitle>
          <DialogDescription>
            Refunds are processed via Stripe when configured and recorded here. No card details are
            handled in the UI.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            const dollars = Number(fd.get("amount"));
            const res = await refundPayment.mutateAsync({
              id: paymentId,
              data: {
                amount: dollars ? Math.round(dollars * 100) : undefined,
                reason: String(fd.get("reason") || ""),
              },
            });
            if (!res.ok) return setError(res.error ?? null);
            setOpen(false);
            toast.success("Refund issued");
            qc.invalidateQueries();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount (USD) — leave blank for full refund</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder={(maxAmount / 100).toFixed(2)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" placeholder="e.g. withdrew before kickoff" />
          </div>
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Processing…" : "Issue refund"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

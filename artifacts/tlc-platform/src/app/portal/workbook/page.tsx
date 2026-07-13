import { Link } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { requireRole } from "@/lib/session";
import { useGetParticipantContext, useRequestPrintedWorkbook } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Stepper, type Step } from "@/components/brand/stepper";
import { LabelCaps } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function WorkbookPage() {
  requireRole("PARTICIPANT", "ADMIN");
  const { data: enr } = useGetParticipantContext();
  const qc = useQueryClient();
  const { mutate: requestPrint, isPending } = useRequestPrintedWorkbook();
  if (!enr) return <Card className="p-8 text-muted">No active enrollment.</Card>;

  const s = enr.shipment?.status ?? "NOT_REQUESTED";
  const notRequested = s === "NOT_REQUESTED";
  const steps: Step[] = [
    { label: "Requested", state: notRequested ? "todo" : "done" },
    { label: "Printing", state: s === "PRINTING" ? "current" : ["SHIPPED", "DELIVERED"].includes(s) ? "done" : "todo" },
    { label: "Shipped", state: s === "SHIPPED" ? "current" : s === "DELIVERED" ? "done" : "todo" },
    { label: "Delivered", state: s === "DELIVERED" ? "done" : "todo" },
  ];

  function onRequest() {
    requestPrint(undefined as never, {
      onSuccess: (res) => {
        (res.ok ? toast.success : toast.info)(res.message ?? "Requested.");
        qc.invalidateQueries();
      },
      onError: () => toast.error("Couldn't request a printed copy — try again."),
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#eef4fc] text-eq">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-[18px] text-ink">Your TLC workbook</h3>
            <p className="text-[13px] text-muted-2">Digital always · printed copy on request</p>
          </div>
        </div>
        <LabelCaps className="mb-3">Printed copy</LabelCaps>
        {notRequested ? (
          <div className="rounded-[11px] border border-hair-2 bg-soft-1 p-4">
            <p className="text-[13px] leading-relaxed text-muted">
              Prefer paper? We'll print and mail a copy to the address from your enrollment.
              Printing takes about two weeks, so requesting early means it's there for day one —
              your digital workbook covers you either way.
            </p>
            <Button size="sm" className="mt-3" onClick={onRequest} disabled={isPending}>
              {isPending ? "Requesting…" : "Request a printed copy"}
            </Button>
          </div>
        ) : (
          <>
            <Stepper steps={steps} />
            <div className="mt-5 rounded-[11px] border border-hair-2 bg-soft-1 p-4 text-[13px] leading-relaxed text-muted">
              {enr.shipment?.tracking ? (
                <>
                  Carrier: <span className="font-semibold text-ink">{enr.shipment.carrier}</span> · Tracking{" "}
                  <span className="font-semibold text-ink">{enr.shipment.tracking}</span>
                </>
              ) : (
                "We'll email tracking the moment it leaves the printer."
              )}
            </div>
          </>
        )}
        <div className="mt-5">
          <Button asChild variant="outline">
            <Link href="/portal/materials">Open digital workbook</Link>
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <LabelCaps className="mb-3">Digital version</LabelCaps>
        <p className="text-[13px] leading-relaxed text-muted">
          The full digital workbook lives in your{" "}
          <Link href="/portal/materials" className="font-semibold text-eq underline-offset-2 hover:underline">
            materials
          </Link>{" "}
          — available from day one, and yours to download until the portal closes.
        </p>
      </Card>
    </div>
  );
}

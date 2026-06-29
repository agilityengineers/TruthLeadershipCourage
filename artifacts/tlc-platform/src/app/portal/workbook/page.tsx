import { Link } from "wouter";
import { requireRole } from "@/lib/session";
import { getParticipantContext } from "@/server/portal-data";
import { Card } from "@/components/ui/card";
import { Stepper, type Step } from "@/components/brand/stepper";
import { LabelCaps } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function WorkbookPage() {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const enr = getParticipantContext(principal.id);
  if (!enr) return <Card className="p-8 text-muted">No active enrollment.</Card>;

  const s = enr.shipment?.status ?? "PENDING";
  const steps: Step[] = [
    { label: "Ordered", state: "done" },
    { label: "Printing", state: s === "PRINTING" ? "current" : s === "PENDING" ? "todo" : "done" },
    {
      label: "Shipped",
      state: s === "SHIPPED" ? "current" : s === "DELIVERED" ? "done" : "todo",
    },
    { label: "Delivered", state: s === "DELIVERED" ? "done" : "todo" },
  ];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#eef4fc] text-eq">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-[18px] text-ink">Your TLC workbook</h3>
            <p className="text-[13px] text-muted-2">Physical shipment + digital version</p>
          </div>
        </div>
        <LabelCaps className="mb-3">Shipment status</LabelCaps>
        <Stepper steps={steps} />
        <div className="mt-5 rounded-[11px] border border-hair-2 bg-soft-1 p-4 text-[13px] leading-relaxed text-muted">
          {enr.shipment?.tracking ? (
            <>
              Carrier: <span className="font-semibold text-ink">{enr.shipment.carrier}</span> · Tracking{" "}
              <span className="font-semibold text-ink">{enr.shipment.tracking}</span>
            </>
          ) : (
            "Your physical workbook ships the week before kickoff. We'll email tracking the moment it leaves the printer."
          )}
        </div>
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
          — available even before your physical copy arrives, and permanently after the program ends.
        </p>
      </Card>
    </div>
  );
}

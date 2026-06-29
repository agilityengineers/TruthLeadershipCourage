"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { createCompany, cloneCohort, purchaseSeats } from "@/server/admin-actions";

export function AddCompanyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add company</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add company</DialogTitle>
          <DialogDescription>Create a new corporate client (tenant).</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createCompany({
                name: String(fd.get("name")),
                billingEmail: String(fd.get("billingEmail") || ""),
              });
              if (!res.ok) return;
              setOpen(false);
              router.refresh();
            });
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Company name" name="name" required />
          <Field label="Billing email" name="billingEmail" type="email" />
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CloneCohortDialog({
  cohorts,
}: {
  cohorts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New cohort (clone)</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Launch the next cohort</DialogTitle>
          <DialogDescription>
            Clone an existing cohort's schedule, price, and sessions into a new dated instance.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              await cloneCohort({
                sourceId: String(fd.get("sourceId")),
                name: String(fd.get("name")),
                startDate: String(fd.get("startDate")),
              });
              setOpen(false);
              router.refresh();
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sourceId">Clone from</Label>
            <select
              id="sourceId"
              name="sourceId"
              className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm"
              required
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="New cohort name" name="name" placeholder="e.g. Spring 2027" required />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Cloning…" : "Create cohort"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PurchaseSeatsDialog({
  companyId,
  cohorts,
}: {
  companyId: string;
  cohorts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[12px] font-semibold text-eq">Buy seats</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase seats</DialogTitle>
          <DialogDescription>
            Buy a block of seats this company can assign to its people.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              await purchaseSeats({
                companyId,
                cohortId: String(fd.get("cohortId")),
                quantity: Number(fd.get("quantity")),
              });
              setOpen(false);
              router.refresh();
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cohortId">Cohort</Label>
            <select
              id="cohortId"
              name="cohortId"
              className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm"
              required
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="Number of seats" name="quantity" type="number" required />
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Purchasing…" : "Purchase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} defaultValue={type === "number" ? 1 : undefined} />
    </div>
  );
}

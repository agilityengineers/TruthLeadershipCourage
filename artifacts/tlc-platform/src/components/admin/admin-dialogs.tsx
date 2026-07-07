import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCompany,
  useCloneCohort,
  usePurchaseSeats,
  useCreateCohort,
  useUpdateCohort,
  useDeleteCohort,
  useGetCohortFormOptions,
  type AdminCohortRow,
  type CreateCohortRequest,
} from "@workspace/api-client-react";
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

const SELECT_CLASS =
  "h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm text-ink focus:border-eq focus:outline-none";
const COHORT_STATUSES = ["DRAFT", "ENROLLING", "RUNNING", "COMPLETED", "ARCHIVED"] as const;
const COHORT_FORMATS = [
  { value: "online", label: "Online (live video)" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
] as const;

/** ISO datetime → yyyy-mm-dd for <input type="date">. */
function toDateInput(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function AddCompanyDialog({
  cohorts: _cohorts,
}: {
  cohorts: { id: string; name: string }[];
}) {
  const qc = useQueryClient();
  const createCompany = useCreateCompany();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = createCompany.isPending;

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
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            const res = await createCompany.mutateAsync({
              data: {
                name: String(fd.get("name")),
                billingEmail: String(fd.get("billingEmail") || ""),
              },
            });
            if (!res.ok) return;
            setOpen(false);
            toast.success("Company created");
            qc.invalidateQueries();
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

/** Convert the form's fields into the shape both create and edit endpoints accept. */
function collectCohort(fd: FormData) {
  const str = (k: string) => {
    const v = String(fd.get(k) ?? "").trim();
    return v === "" ? undefined : v;
  };
  const num = (k: string) => {
    const v = str(k);
    return v === undefined ? undefined : Number(v);
  };
  const dollars = num("price");
  return {
    programId: str("programId"),
    name: String(fd.get("name") ?? "").trim(),
    tagline: str("tagline"),
    description: str("description"),
    heroImageUrl: str("heroImageUrl"),
    startDate: String(fd.get("startDate") ?? ""),
    endDate: String(fd.get("endDate") ?? ""),
    sessionDay: str("sessionDay"),
    sessionTime: str("sessionTime"),
    timezone: str("timezone"),
    format: (str("format") ?? "online") as CreateCohortRequest["format"],
    location: str("location"),
    price: dollars === undefined ? undefined : Math.round(dollars * 100),
    currency: str("currency") ?? "usd",
    capacity: num("capacity"),
    enrollByDate: str("enrollByDate"),
    trainerId: str("trainerId"),
    companyId: str("companyId"),
    isPrivate: fd.get("isPrivate") === "on",
    status: (str("status") ?? "DRAFT") as CreateCohortRequest["status"],
  };
}

type CohortFormOptions = {
  programs: { id: string; name: string }[];
  trainers: { id: string; name: string | null }[];
  companies: { id: string; name: string }[];
};

/** All the fields that describe a cohort and drive its public landing page. */
function CohortFields({
  options,
  defaults,
}: {
  options?: CohortFormOptions;
  defaults?: AdminCohortRow;
}) {
  const programs = options?.programs ?? [];
  const trainers = options?.trainers ?? [];
  const companies = options?.companies ?? [];

  return (
    <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
      {programs.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="programId">Program</Label>
          <select id="programId" name="programId" className={SELECT_CLASS} defaultValue={defaults?.programId ?? ""}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Field label="Cohort name" name="name" required placeholder="e.g. Spring 2027" defaultValue={defaults?.name} />
      <Field
        label="Tagline"
        name="tagline"
        placeholder="e.g. Lead with truth. Grow with courage."
        defaultValue={defaults?.tagline ?? undefined}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What this cohort is about — shown on the public landing page."
          className="rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 py-2.5 text-sm text-ink focus:border-eq focus:outline-none"
          defaultValue={defaults?.description ?? undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" name="startDate" type="date" required defaultValue={toDateInput(defaults?.startDate)} />
        <Field label="End date" name="endDate" type="date" required defaultValue={toDateInput(defaults?.endDate)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Session day" name="sessionDay" placeholder="e.g. Tuesday" defaultValue={defaults?.sessionDay ?? undefined} />
        <Field
          label="Session time"
          name="sessionTime"
          placeholder="e.g. 1:00–3:00 PM"
          defaultValue={defaults?.sessionTime ?? undefined}
        />
      </div>
      <Field
        label="Timezone"
        name="timezone"
        placeholder="e.g. America/Los_Angeles"
        defaultValue={defaults?.timezone ?? undefined}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="format">Format</Label>
          <select id="format" name="format" className={SELECT_CLASS} defaultValue={defaults?.format ?? "online"}>
            {COHORT_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Location / join info"
          name="location"
          placeholder="e.g. Live on Zoom"
          defaultValue={defaults?.location ?? undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Price (USD)"
          name="price"
          type="number"
          placeholder="0"
          defaultValue={defaults ? String((defaults.price ?? 0) / 100) : "0"}
        />
        <Field
          label="Capacity (0 = unlimited)"
          name="capacity"
          type="number"
          defaultValue={defaults ? String(defaults.capacity ?? 0) : "0"}
        />
      </div>

      <Field
        label="Enrollment closes (optional)"
        name="enrollByDate"
        type="date"
        defaultValue={toDateInput(defaults?.enrollByDate)}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trainerId">Trainer</Label>
        <select id="trainerId" name="trainerId" className={SELECT_CLASS} defaultValue={defaults?.trainerId ?? ""}>
          <option value="">— Unassigned —</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name ?? t.id}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className={SELECT_CLASS}
          defaultValue={defaults?.status ?? "ENROLLING"}
        >
          {COHORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-[11.5px] text-muted-2">
          <strong>ENROLLING</strong> or <strong>RUNNING</strong> publishes the public landing page and opens sign-ups.
        </span>
      </div>

      <label className="flex items-center gap-2.5 text-[13px] text-ink">
        <input type="checkbox" name="isPrivate" defaultChecked={defaults?.isPrivate ?? false} className="h-4 w-4" />
        Private cohort (unlisted — for a specific company)
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyId">Company (private cohorts)</Label>
        <select id="companyId" name="companyId" className={SELECT_CLASS} defaultValue={defaults?.companyId ?? ""}>
          <option value="">— None —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Hero image URL (optional)"
        name="heroImageUrl"
        placeholder="https://…"
        defaultValue={defaults?.heroImageUrl ?? undefined}
      />
    </div>
  );
}

export function CreateCohortDialog() {
  const qc = useQueryClient();
  const createCohort = useCreateCohort();
  const { data: options } = useGetCohortFormOptions();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = createCohort.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New cohort</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a cohort</DialogTitle>
          <DialogDescription>
            Everything a cohort needs to go live and drive its own landing page.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const v = collectCohort(new FormData(e.currentTarget));
            if (!v.name || !v.startDate || !v.endDate) {
              setError("Name, start date, and end date are required.");
              return;
            }
            try {
              const res = await createCohort.mutateAsync({ data: v });
              if (!res.ok) return;
              setOpen(false);
              toast.success("Cohort created");
              qc.invalidateQueries();
            } catch {
              setError("Could not create the cohort. Please check the fields and try again.");
            }
          }}
          className="flex flex-col gap-4"
        >
          <CohortFields options={options} />
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create cohort"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditCohortDialog({ cohort }: { cohort: AdminCohortRow }) {
  const qc = useQueryClient();
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();
  const { data: options } = useGetCohortFormOptions();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const pending = updateCohort.isPending;
  const deleting = deleteCohort.isPending;

  async function onDelete() {
    setError(null);
    try {
      await deleteCohort.mutateAsync({ id: cohort.id });
      setOpen(false);
      toast.success("Cohort deleted");
      qc.invalidateQueries();
    } catch (err) {
      const message =
        (err as { data?: { error?: string } })?.data?.error ??
        (err as { message?: string })?.message ??
        "Could not delete this cohort.";
      setError(message);
      setConfirmingDelete(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmingDelete(false);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="text-[12px] font-semibold text-eq hover:underline">Edit</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit cohort</DialogTitle>
          <DialogDescription>Update details and landing-page content for {cohort.name}.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const v = collectCohort(new FormData(e.currentTarget));
            if (!v.name || !v.startDate || !v.endDate) {
              setError("Name, start date, and end date are required.");
              return;
            }
            // Send empty optionals as null/"" so the admin can also *clear* a field.
            const data = {
              ...v,
              tagline: v.tagline ?? "",
              description: v.description ?? "",
              heroImageUrl: v.heroImageUrl ?? "",
              location: v.location ?? "",
              sessionDay: v.sessionDay ?? "",
              sessionTime: v.sessionTime ?? "",
              timezone: v.timezone ?? "",
              trainerId: v.trainerId ?? null,
              companyId: v.companyId ?? null,
              enrollByDate: v.enrollByDate ?? null,
            };
            try {
              const res = await updateCohort.mutateAsync({ id: cohort.id, data });
              if (!res.ok) return;
              setOpen(false);
              toast.success("Cohort updated");
              qc.invalidateQueries();
            } catch {
              setError("Could not save your changes. Please try again.");
            }
          }}
          className="flex flex-col gap-4"
        >
          <CohortFields options={options} defaults={cohort} />
          {error && <p className="text-[13px] text-danger">{error}</p>}
          {confirmingDelete ? (
            <div className="flex flex-col gap-2.5 rounded-[10px] border border-danger/30 bg-danger/5 p-3.5">
              <p className="text-[13px] text-ink">
                Permanently delete <strong>{cohort.name}</strong>? This can't be undone.
              </p>
              <div className="flex justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                  Keep it
                </Button>
                <Button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="bg-danger text-white hover:bg-danger/90"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setConfirmingDelete(true);
                }}
                className="text-[12.5px] font-semibold text-danger hover:underline"
              >
                Delete cohort
              </button>
              <div className="flex gap-2.5">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
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
  const qc = useQueryClient();
  const cloneCohort = useCloneCohort();
  const [open, setOpen] = useState(false);
  const pending = cloneCohort.isPending;

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
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await cloneCohort.mutateAsync({
              data: {
                sourceId: String(fd.get("sourceId")),
                name: String(fd.get("name")),
                startDate: String(fd.get("startDate")),
              },
            });
            setOpen(false);
            toast.success("Cohort created");
            qc.invalidateQueries();
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
  const qc = useQueryClient();
  const purchaseSeats = usePurchaseSeats();
  const [open, setOpen] = useState(false);
  const pending = purchaseSeats.isPending;

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
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await purchaseSeats.mutateAsync({
              data: {
                companyId,
                cohortId: String(fd.get("cohortId")),
                quantity: Number(fd.get("quantity")),
              },
            });
            setOpen(false);
            toast.success("Seats purchased");
            qc.invalidateQueries();
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? (type === "number" ? "1" : undefined)}
      />
    </div>
  );
}

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
import { DatePickerField } from "@/components/ui/date-picker";
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

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** 30-minute steps from 6:00 AM to 9:30 PM — plenty for live-session scheduling. */
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = 6 * 60; m <= 21 * 60 + 30; m += 30) {
    const h24 = Math.floor(m / 60);
    const mins = String(m % 60).padStart(2, "0");
    const meridiem = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    out.push(`${h12}:${mins} ${meridiem}`);
  }
  return out;
})();

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific — Los Angeles" },
  { value: "America/Denver", label: "Mountain — Denver" },
  { value: "America/Phoenix", label: "Arizona — Phoenix" },
  { value: "America/Chicago", label: "Central — Chicago" },
  { value: "America/New_York", label: "Eastern — New York" },
  { value: "America/Anchorage", label: "Alaska — Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii — Honolulu" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "UK — London" },
  { value: "Europe/Paris", label: "Central Europe — Paris" },
  { value: "Asia/Dubai", label: "Gulf — Dubai" },
  { value: "Asia/Kolkata", label: "India — Kolkata" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo" },
  { value: "Australia/Sydney", label: "Australia — Sydney" },
] as const;

/** ISO datetime → yyyy-mm-dd for date pickers. */
function toDateInput(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/**
 * The server always answers errors as `{ error: string }` (see the API's
 * errorMiddleware), and the fetch client surfaces that as `err.data`. Show the
 * real reason — "End date must be after the start date." beats a shrug.
 */
function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { error?: string } | null; message?: string };
  return e?.data?.error ?? e?.message ?? fallback;
}

/** "1:00 PM" + "3:00 PM" → "1:00–3:00 PM"; "11:00 AM" + "1:00 PM" → "11:00 AM–1:00 PM". */
function composeSessionTime(start?: string, end?: string): string | undefined {
  if (!start && !end) return undefined;
  if (!start || !end) return start || end;
  const meridiem = (t: string) => t.slice(-2);
  const bare = (t: string) => t.slice(0, -3);
  return meridiem(start) === meridiem(end) ? `${bare(start)}–${end}` : `${start}–${end}`;
}

/** Best-effort inverse of composeSessionTime for prefilling the edit form. */
function parseSessionTime(stored: string | null | undefined): { start: string; end: string } {
  if (!stored) return { start: "", end: "" };
  const parts = stored.split(/[–—-]/).map((p) => p.trim());
  if (parts.length !== 2) return { start: "", end: "" };
  let [start, end] = parts as [string, string];
  const endMeridiem = /(AM|PM)$/i.exec(end)?.[1]?.toUpperCase();
  if (!/(AM|PM)$/i.test(start) && endMeridiem) start = `${start} ${endMeridiem}`;
  start = start.toUpperCase().replace(/\s+/g, " ");
  end = end.toUpperCase().replace(/\s+/g, " ");
  if (!TIME_OPTIONS.includes(start) || !TIME_OPTIONS.includes(end)) return { start: "", end: "" };
  return { start, end };
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
            try {
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
            } catch (err) {
              setError(apiErrorMessage(err, "Could not create the company."));
            }
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
  const session1StartDate = str("session1StartDate");
  const session1EndDate = str("session1EndDate");
  const intersessionStartDate = str("intersessionStartDate");
  const intersessionEndDate = str("intersessionEndDate");
  const session2StartDate = str("session2StartDate");
  const session2EndDate = str("session2EndDate");
  return {
    programId: str("programId"),
    name: String(fd.get("name") ?? "").trim(),
    tagline: str("tagline"),
    description: str("description"),
    heroImageUrl: str("heroImageUrl"),
    // The cohort runs from the first day of Session 1 to the last day of Session 2.
    startDate: session1StartDate ?? "",
    endDate: session2EndDate ?? "",
    session1StartDate,
    session1EndDate,
    intersessionStartDate,
    intersessionEndDate,
    session2StartDate,
    session2EndDate,
    sessionDay: str("sessionDay"),
    sessionTime: composeSessionTime(str("sessionStartTime"), str("sessionEndTime")),
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

/**
 * Client-side sanity checks with actionable messages, mirrored by the server.
 * yyyy-mm-dd strings compare correctly as plain strings.
 */
function cohortFormProblem(v: ReturnType<typeof collectCohort>): string | null {
  if (!v.name) return "Cohort name is required.";
  if (!v.session1StartDate) return "Session 1 needs a start date — it's the day the cohort begins.";
  if (!v.session2EndDate) return "Session 2 needs an end date — it's the day the cohort finishes.";
  const sequence: Array<[string, string | undefined]> = [
    ["Session 1 start", v.session1StartDate],
    ["Session 1 end", v.session1EndDate],
    ["Inter-session start", v.intersessionStartDate],
    ["Inter-session end", v.intersessionEndDate],
    ["Session 2 start", v.session2StartDate],
    ["Session 2 end", v.session2EndDate],
  ];
  const provided = sequence.filter((entry): entry is [string, string] => Boolean(entry[1]));
  for (let i = 1; i < provided.length; i++) {
    if (provided[i][1] < provided[i - 1][1]) {
      return `${provided[i][0]} date can't be before the ${provided[i - 1][0].toLowerCase()} date.`;
    }
  }
  if (v.endDate <= v.startDate) return "Session 2 must end after Session 1 starts.";
  return null;
}

type CohortFormOptions = {
  programs: { id: string; name: string }[];
  trainers: { id: string; name: string | null }[];
  companies: { id: string; name: string }[];
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 border-t border-[#eef0f6] pt-3.5 text-[11px] font-semibold uppercase tracking-[.08em] text-muted-3">
      {children}
    </p>
  );
}

function SessionRange({
  label,
  hint,
  startName,
  endName,
  startDefault,
  endDefault,
}: {
  label: string;
  hint?: string;
  startName: string;
  endName: string;
  startDefault?: string;
  endDefault?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={startName}>
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted-3">{hint}</span>}
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <DatePickerField id={startName} name={startName} placeholder="Start date" defaultValue={startDefault} />
        <DatePickerField id={endName} name={endName} placeholder="End date" defaultValue={endDefault} />
      </div>
    </div>
  );
}

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
  const storedTime = parseSessionTime(defaults?.sessionTime);
  const timezoneOptions =
    defaults?.timezone && !TIMEZONES.some((tz) => tz.value === defaults.timezone)
      ? [{ value: defaults.timezone, label: defaults.timezone }, ...TIMEZONES]
      : TIMEZONES;

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

      <SectionHeading>Session dates</SectionHeading>
      <p className="-mt-2 text-[12px] leading-relaxed text-muted-2">
        Every cohort runs in three phases. The cohort's public start and end dates come from Session 1's start and
        Session 2's end.
      </p>
      <SessionRange
        label="Session 1"
        startName="session1StartDate"
        endName="session1EndDate"
        startDefault={toDateInput(defaults?.session1StartDate ?? defaults?.startDate)}
        endDefault={toDateInput(defaults?.session1EndDate)}
      />
      <SessionRange
        label="Inter-session"
        hint="guided practice between sessions"
        startName="intersessionStartDate"
        endName="intersessionEndDate"
        startDefault={toDateInput(defaults?.intersessionStartDate)}
        endDefault={toDateInput(defaults?.intersessionEndDate)}
      />
      <SessionRange
        label="Session 2"
        startName="session2StartDate"
        endName="session2EndDate"
        startDefault={toDateInput(defaults?.session2StartDate)}
        endDefault={toDateInput(defaults?.session2EndDate ?? defaults?.endDate)}
      />

      <SectionHeading>Weekly live session</SectionHeading>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sessionDay">Day of week</Label>
          <select id="sessionDay" name="sessionDay" className={SELECT_CLASS} defaultValue={defaults?.sessionDay ?? ""}>
            <option value="">— Not set —</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <select id="timezone" name="timezone" className={SELECT_CLASS} defaultValue={defaults?.timezone ?? ""}>
            <option value="">— Not set —</option>
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sessionStartTime">Starts at</Label>
          <select
            id="sessionStartTime"
            name="sessionStartTime"
            className={SELECT_CLASS}
            defaultValue={storedTime.start}
          >
            <option value="">— Not set —</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sessionEndTime">Ends at</Label>
          <select id="sessionEndTime" name="sessionEndTime" className={SELECT_CLASS} defaultValue={storedTime.end}>
            <option value="">— Not set —</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SectionHeading>Format & enrollment</SectionHeading>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enrollByDate">Enrollment closes (optional)</Label>
        <DatePickerField
          id="enrollByDate"
          name="enrollByDate"
          placeholder="No deadline"
          defaultValue={toDateInput(defaults?.enrollByDate)}
        />
      </div>

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
            const problem = cohortFormProblem(v);
            if (problem) {
              setError(problem);
              return;
            }
            try {
              const res = await createCohort.mutateAsync({ data: v });
              if (!res.ok) return;
              setOpen(false);
              toast.success("Cohort created");
              qc.invalidateQueries();
            } catch (err) {
              setError(apiErrorMessage(err, "Could not create the cohort. Please check the fields and try again."));
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
      setError(apiErrorMessage(err, "Could not delete this cohort."));
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
            const problem = cohortFormProblem(v);
            if (problem) {
              setError(problem);
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
              session1StartDate: v.session1StartDate ?? null,
              session1EndDate: v.session1EndDate ?? null,
              intersessionStartDate: v.intersessionStartDate ?? null,
              intersessionEndDate: v.intersessionEndDate ?? null,
              session2StartDate: v.session2StartDate ?? null,
              session2EndDate: v.session2EndDate ?? null,
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
            } catch (err) {
              setError(apiErrorMessage(err, "Could not save your changes. Please try again."));
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
  const [error, setError] = useState<string | null>(null);
  const pending = cloneCohort.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Clone a cohort
        </Button>
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
            setError(null);
            const fd = new FormData(e.currentTarget);
            const startDate = String(fd.get("startDate") ?? "");
            if (!startDate) {
              setError("Pick a start date for the new cohort.");
              return;
            }
            try {
              await cloneCohort.mutateAsync({
                data: {
                  sourceId: String(fd.get("sourceId")),
                  name: String(fd.get("name")),
                  startDate,
                },
              });
              setOpen(false);
              toast.success("Cohort created");
              qc.invalidateQueries();
            } catch (err) {
              setError(apiErrorMessage(err, "Could not clone the cohort. Please try again."));
            }
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
            <DatePickerField id="startDate" name="startDate" placeholder="Select the kickoff date" />
          </div>
          {error && <p className="text-[13px] text-danger">{error}</p>}
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
  const [error, setError] = useState<string | null>(null);
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
            setError(null);
            const fd = new FormData(e.currentTarget);
            try {
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
            } catch (err) {
              setError(apiErrorMessage(err, "Could not purchase seats. Please try again."));
            }
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
          {error && <p className="text-[13px] text-danger">{error}</p>}
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

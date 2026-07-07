import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateEnrollment } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CohortOpt = {
  id: string;
  name: string;
  price: number;
  currency: string;
  seatsLeft: number | null;
  status: string;
};

export function EnrollForm({
  cohorts,
  companies,
  responseId,
  initialCohortId,
}: {
  cohorts: CohortOpt[];
  companies: { id: string; name: string }[];
  responseId?: string;
  initialCohortId?: string;
}) {
  const [, navigate] = useLocation();
  const [cohortId, setCohortId] = useState(
    (initialCohortId && cohorts.some((c) => c.id === initialCohortId) ? initialCohortId : cohorts[0]?.id) ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const createEnrollment = useCreateEnrollment();
  const pending = createEnrollment.isPending;

  const selected = cohorts.find((c) => c.id === cohortId);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      companyId: String(fd.get("companyId") ?? "") || undefined,
      cohortId,
      responseId,
      coupon: String(fd.get("coupon") ?? "") || undefined,
      shipping: {
        line1: String(fd.get("line1") ?? ""),
        line2: String(fd.get("line2") ?? "") || undefined,
        city: String(fd.get("city") ?? ""),
        state: String(fd.get("state") ?? ""),
        postal: String(fd.get("postal") ?? ""),
        country: String(fd.get("country") ?? "US"),
      },
    };
    void (async () => {
      const res = await createEnrollment.mutateAsync({ data: payload });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      navigate(`/enroll/confirmation?status=${res.status}`);
    })();
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-6">
      {/* Cohort selection */}
      <fieldset className="flex flex-col gap-3">
        <legend className="label-caps mb-1">Choose your cohort</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cohorts.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer flex-col rounded-[12px] border-[1.5px] p-4 transition-colors ${
                cohortId === c.id ? "border-eq bg-[#eaf2fc]" : "border-[#e0e4ee] hover:border-[#9bb4d6]"
              }`}
            >
              <input
                type="radio"
                name="cohort"
                className="sr-only"
                checked={cohortId === c.id}
                onChange={() => setCohortId(c.id)}
              />
              <span className="text-[15px] font-semibold text-ink">{c.name}</span>
              <span className="mt-0.5 text-[12.5px] text-muted-2">
                {formatPrice(c.price, c.currency)} ·{" "}
                {c.seatsLeft === null
                  ? "open"
                  : c.seatsLeft > 0
                    ? `${c.seatsLeft} seats left`
                    : "waitlist"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Identity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="Work email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyId">Company (optional)</Label>
        <select
          id="companyId"
          name="companyId"
          className="flex h-11 w-full rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm text-ink focus:border-eq focus:outline-none"
        >
          <option value="">Independent / no company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Shipping */}
      <fieldset className="flex flex-col gap-4">
        <legend className="label-caps mb-1">Ship my physical workbook to</legend>
        <Field label="Address line 1" name="line1" required />
        <Field label="Address line 2" name="line2" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="City" name="city" required />
          <Field label="State" name="state" required />
          <Field label="Postal code" name="postal" required />
        </div>
      </fieldset>

      {/* Coupon (backend-applied) */}
      <Field label="Discount code (optional)" name="coupon" />

      {error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Reserving…" : `Reserve my seat${selected ? ` · ${formatPrice(selected.price, selected.currency)}` : ""}`}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}

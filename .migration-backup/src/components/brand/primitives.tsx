import { cn } from "@/lib/utils";

/** Uppercase eyebrow with optional leading rule, used across marketing + app. */
export function Eyebrow({
  children,
  className,
  color = "#a23bb0",
  rule = false,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  rule?: boolean;
}) {
  return (
    <div
      className={cn("eyebrow inline-flex items-center gap-2.5", className)}
      style={{ color }}
    >
      {rule && <span className="inline-block h-px w-6" style={{ background: color }} />}
      {children}
    </div>
  );
}

/** Small uppercase caption used on dashboard cards. */
export function LabelCaps({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("label-caps", className)}>{children}</div>;
}

/** KPI tile (dashboards). */
export function KpiTile({
  value,
  label,
  color = "#024794",
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-[13px] border border-hair-1 bg-white p-[18px]">
      <div className="font-display text-[30px] leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[12px] font-medium leading-tight text-muted-2">{label}</div>
    </div>
  );
}

/** Stat block used in dark hero bands. */
export function StatBlock({
  value,
  label,
  valueColor = "#fff",
}: {
  value: React.ReactNode;
  label: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div className="font-display text-[26px] leading-none" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium leading-tight text-[#a9b8e0]">{label}</div>
    </div>
  );
}

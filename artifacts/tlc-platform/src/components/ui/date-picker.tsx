import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** yyyy-mm-dd → Date at local midnight, so the calendar never shifts a day. */
function parseYmd(value?: string): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toYmd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const DISPLAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * A dropdown date picker that plays nicely with plain <form> submission: the
 * chosen day is kept in a hidden input under `name` as yyyy-mm-dd (the same
 * wire format as <input type="date">). Month + year are dropdowns too, so any
 * date is a few clicks away — no typing, no format guessing.
 */
export function DatePickerField({
  id,
  name,
  defaultValue,
  placeholder = "Select date",
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const [date, setDate] = useState<Date | undefined>(() => parseYmd(defaultValue));
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 py-2 text-left text-sm focus-visible:border-eq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eq/20",
            date ? "text-ink" : "text-muted-3",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-3" />
          <span className="truncate">{date ? DISPLAY.format(date) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          startMonth={new Date(currentYear - 2, 0)}
          endMonth={new Date(currentYear + 4, 11)}
          onSelect={(d) => {
            setDate(d ?? undefined);
            setOpen(false);
          }}
        />
        {date && (
          <div className="border-t border-[#eef0f6] p-2">
            <button
              type="button"
              className="w-full rounded-[7px] px-2 py-1.5 text-[12.5px] font-medium text-muted-2 hover:bg-soft-2 hover:text-ink"
              onClick={() => {
                setDate(undefined);
                setOpen(false);
              }}
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
      <input type="hidden" name={name} value={date ? toYmd(date) : ""} />
    </Popover>
  );
}

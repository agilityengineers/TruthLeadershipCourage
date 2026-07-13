import { Link } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestPrintedWorkbook, type NowCard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateOnly } from "@/lib/utils";

/**
 * The Now card: a single card answering "what matters right now", with
 * exactly one action. Indigo for sessions, teal for the Intersession — the
 * two-week heartbeat carried in color. It never becomes a list.
 */
export function NowCardView({ card, trainerName }: { card: NowCard; trainerName?: string | null }) {
  switch (card.type) {
    case "PRE_START":
      return <PreStartCard card={card} />;
    case "SESSION":
      return <SessionCard card={card} />;
    case "INTERSESSION":
      return <IntersessionCard card={card} trainerName={trainerName} />;
    case "GRADUATION":
      return <GraduationCard card={card} />;
    default:
      // LIVE_IT renders as the checklist card; CLOSED replaces the page.
      return null;
  }
}

function timeRange(startAt?: string | null, endAt?: string | null) {
  if (!startAt) return "";
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(startAt).toLocaleTimeString("en-US", opts);
  if (!endAt) return start;
  const end = new Date(endAt).toLocaleTimeString("en-US", opts);
  return `${start.replace(" ", "")}–${end.replace(" ", "")}`;
}

function PreStartCard({ card }: { card: NowCard }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useRequestPrintedWorkbook();
  const start = card.cohortStartDate ? new Date(card.cohortStartDate) : null;

  function requestPrint() {
    mutate(undefined as never, {
      onSuccess: (res) => {
        (res.ok ? toast.success : toast.info)(res.message ?? "Requested.");
        qc.invalidateQueries();
      },
      onError: () => toast.error("Couldn't request a printed copy — try again."),
    });
  }

  return (
    <section className="rounded-card bg-indigo-950 p-5 text-white shadow-hero">
      <div className="text-[12px] font-medium text-[#b9c2e8]">Your cohort begins</div>
      <div className="mt-1 font-display text-[21px] leading-tight">
        {start
          ? `${formatDateOnly(start, { weekday: "long", month: "long", day: "numeric" })} · ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
          : "Soon"}
      </div>
      <Button asChild variant="light" className="mt-4 w-full">
        {card.workbookUrl?.startsWith("/") ? (
          <Link href={card.workbookUrl}>Download your workbook</Link>
        ) : (
          <a href={card.workbookUrl ?? "/portal/materials"} target={card.workbookUrl?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            Download your workbook
          </a>
        )}
      </Button>
      <div className="mt-2.5 text-center text-[12px] text-[#b9c2e8]">
        {card.printRequestable ? (
          <button type="button" onClick={requestPrint} disabled={isPending} className="underline-offset-2 hover:underline">
            {isPending ? "Requesting…" : "Prefer paper? Request a printed copy"}
          </button>
        ) : (
          <span>Printed copy: {String(card.printStatus ?? "requested").toLowerCase()}</span>
        )}
      </div>
    </section>
  );
}

function SessionCard({ card }: { card: NowCard }) {
  const lesson = card.sessionKind === "LESSON";
  const day = card.isToday
    ? "Tonight"
    : card.startAt
      ? new Date(card.startAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : "";
  return (
    <section
      className={
        "rounded-card p-5 text-white shadow-hero " + (lesson ? "bg-indigo" : "bg-teal")
      }
    >
      <div className={"text-[12px] font-medium " + (lesson ? "text-[#b9c2e8]" : "text-[#cfe6e4]")}>
        Module {card.moduleOrder} · {card.moduleTitle} — {lesson ? "lesson session" : "practice session"}
      </div>
      <div className="mt-1 font-display text-[21px] leading-tight">
        {day} · {timeRange(card.startAt, card.endAt)}
      </div>
      <Button asChild variant="light" className="mt-4 w-full">
        <a href={card.joinUrl ?? "#"} target="_blank" rel="noreferrer">
          Join session
        </a>
      </Button>
    </section>
  );
}

function IntersessionCard({ card, trainerName }: { card: NowCard; trainerName?: string | null }) {
  const booking = card.booking ?? null;
  const first = trainerName?.split(" ")[0];
  return (
    <section className="rounded-card bg-teal p-5 text-white shadow-hero">
      <div className="text-[12px] font-medium text-[#cfe6e4]">
        Intersession · week {card.intersessionWeek} of {card.intersessionWeeks}
      </div>
      {booking ? (
        <>
          <div className="mt-1 font-display text-[20px] leading-snug">
            Your 1:1{booking.trainer?.name ? ` with ${booking.trainer.name.split(" ")[0]}` : ""} ·{" "}
            {formatDate(booking.slot, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <Button asChild variant="light" className="mt-4 w-full">
            <Link href="/portal/coaching">View or reschedule</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="mt-1 font-display text-[20px] leading-snug">
            Your 1:1{first ? ` with ${first}` : ""} is ready to schedule
          </div>
          <Button asChild variant="light" className="mt-4 w-full">
            <Link href="/portal/coaching">Book your coaching session</Link>
          </Button>
        </>
      )}
    </section>
  );
}

function GraduationCard({ card }: { card: NowCard }) {
  return (
    <section className="rounded-card bg-indigo-950 p-5 text-white shadow-hero">
      <div className="text-[12px] font-medium text-[#b9c2e8]">Graduation</div>
      <div className="mt-1 font-display text-[20px] leading-snug">
        Everything you wrote goes with you
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#b9c2e8]">
        Your words were always yours. Download your full record — your seed reflections, every I AM,
        your Why, and every noticing.
      </p>
      <Button asChild variant="light" className="mt-4 w-full">
        <Link href="/portal/keepsake">Download everything you wrote</Link>
      </Button>
      {card.portalClosesAt && (
        <div className="mt-2.5 text-center text-[12px] text-[#b9c2e8]">
          The portal closes {formatDateOnly(card.portalClosesAt, { month: "long", day: "numeric" })}
        </div>
      )}
    </section>
  );
}

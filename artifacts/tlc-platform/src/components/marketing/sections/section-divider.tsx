/**
 * Rendered in place of a marketing section whose content has been cleared. A
 * slim brand-gradient rule (echoing the dark accent bands) that reads as an
 * intentional break between sections instead of an empty full-height band.
 */
export function SectionDivider() {
  return (
    <div className="shell py-8">
      <div
        aria-hidden="true"
        className="mx-auto h-[3px] w-full rounded-full bg-[linear-gradient(90deg,#262161,#1b1942_45%,#024794)]"
      />
    </div>
  );
}

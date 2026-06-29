import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Route-level error boundary. Catches render/data errors in any segment. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced server-side via Next's error logging; keep client console quiet of details.
    console.error("Route error", error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-[clamp(22px,3vw,30px)] text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-[34em] text-[14px] leading-relaxed text-muted">
        We hit an unexpected error loading this page. You can try again — if it keeps happening,
        please let us know.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Back to home
        </Button>
      </div>
    </div>
  );
}

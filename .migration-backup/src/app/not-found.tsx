import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Global 404. */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <span className="label-caps text-muted-3">404</span>
      <h1 className="mt-2 font-display text-[clamp(22px,3vw,30px)] text-ink">Page not found</h1>
      <p className="mt-3 max-w-[32em] text-[14px] leading-relaxed text-muted">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

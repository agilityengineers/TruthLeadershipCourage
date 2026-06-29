/** Default route loading state shown while a segment's server data resolves. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-hair-2 border-t-eq" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

import { useGetPublicContent } from "@workspace/api-client-react";

type Content = Record<string, unknown>;

/**
 * A content value is "blank" when it carries nothing renderable: an empty/
 * whitespace string, an empty list, or a list/object whose every leaf is blank
 * (e.g. an image with no `src`, a link with no `label`/`href`).
 */
function isBlank(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.every(isBlank);
  if (typeof value === "object") return Object.values(value).every(isBlank);
  return false; // numbers/booleans count as content
}

/**
 * True when a section has no content to show — every field is blank. Such a
 * section renders as a slim divider instead of an empty, full-height band.
 */
export function isSectionEmpty(content: Content): boolean {
  return Object.values(content).every(isBlank);
}

/**
 * Fetch a public page's editable sections (visible sections for the page plus
 * the global nav/footer), keyed by section key. `content(key)` returns the
 * resolved content for a section, or undefined if it isn't present/visible.
 */
export function usePageContent(page: string) {
  const { data } = useGetPublicContent(page);
  const sections = (data?.sections ?? []) as { key: string; content: Content }[];
  const byKey = new Map(sections.map((s) => [s.key, s.content]));
  return {
    ready: !!data,
    sections,
    content: (key: string): Content | undefined => byKey.get(key),
  };
}

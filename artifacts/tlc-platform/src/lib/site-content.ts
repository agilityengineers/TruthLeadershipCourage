import { useGetPublicContent } from "@workspace/api-client-react";

type Content = Record<string, unknown>;

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

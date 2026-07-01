import { requireRole } from "@/lib/session";
import { useGetAdminContent } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";
import { ContentBuilder, type AdminSection } from "@/components/admin/content-builder";

export default function AdminContentPage() {
  requireRole("ADMIN");
  const { data } = useGetAdminContent();
  const sections = (data?.sections ?? []) as AdminSection[];
  const uploadEnabled = data?.uploadEnabled ?? false;

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-[22px]">
        <LabelCaps className="mb-1">Site Content</LabelCaps>
        <h4 className="font-display text-[18px] text-ink">Edit the public website</h4>
        <p className="mt-1 max-w-[58em] text-[13px] leading-relaxed text-muted-2">
          Edit the words, images, links, and order of every section on the marketing site — and turn
          sections on or off. Changes go live right away. Each section keeps an original you can
          restore at any time.
          {!uploadEnabled && (
            <>
              {" "}
              <span className="font-semibold text-[#b3651b]">
                Image uploads aren’t configured yet — you can still paste an image URL.
              </span>
            </>
          )}
        </p>
      </Card>

      <ContentBuilder sections={sections} uploadEnabled={uploadEnabled} />
    </div>
  );
}

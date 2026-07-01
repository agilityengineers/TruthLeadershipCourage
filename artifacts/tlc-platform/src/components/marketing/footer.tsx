import { Link } from "wouter";

type FooterContent = {
  brandName: string;
  contact: string;
  copyright: string;
};

/**
 * Global footer. Editable brand/contact/copyright come from `content`; the
 * contextual cross-page link is structural navigation set per page in code.
 */
export function Footer({
  content,
  crossLink,
}: {
  content: FooterContent;
  crossLink?: { label: string; href: string };
}) {
  return (
    <footer className="border-t border-[#eef0f5] bg-white">
      <div className="shell flex flex-wrap items-center gap-3.5 py-[34px]">
        <img src="/brand/wisdomtri-logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
        <span className="text-[14px] font-semibold text-indigo">{content.brandName}</span>
        {crossLink && (
          <Link href={crossLink.href} className="text-[13px] font-semibold text-eq hover:underline">
            {crossLink.label}
          </Link>
        )}
        <span className="ml-auto text-[13px] leading-[1.5] text-muted-2">{content.contact}</span>
        <span className="w-full text-left text-[13px] leading-[1.5] text-[#b3b7c6]">{content.copyright}</span>
      </div>
    </footer>
  );
}

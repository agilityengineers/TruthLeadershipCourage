import { LandingNav } from "@/components/marketing/landing-nav";
import { Footer } from "@/components/marketing/footer";
import { SECTION_COMPONENTS } from "@/components/marketing/sections/registry";
import { SectionDivider } from "@/components/marketing/sections/section-divider";
import { isSectionEmpty, usePageContent } from "@/lib/site-content";

export default function LandingPage() {
  const { ready, sections, content } = usePageContent("home");
  const nav = content("global.nav");
  const footer = content("global.footer");

  if (!ready) return <div className="min-h-screen bg-white" />;

  const body = sections.filter((s) => SECTION_COMPONENTS[s.key]);

  return (
    <div className="bg-white text-ink">
      {nav && <LandingNav content={nav as Parameters<typeof LandingNav>[0]["content"]} />}

      {body.map((s) => {
        // A section with no content acts as a slim divider between sections.
        if (isSectionEmpty(s.content)) return <SectionDivider key={s.key} />;
        const Section = SECTION_COMPONENTS[s.key];
        return <Section key={s.key} content={s.content} />;
      })}

      {footer && (
        <Footer
          content={footer as Parameters<typeof Footer>[0]["content"]}
          crossLink={{ label: "Leading a team? See TLC for Organizations →", href: "/organizations" }}
        />
      )}
    </div>
  );
}

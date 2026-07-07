import { LandingNav } from "@/components/marketing/landing-nav";
import { Footer } from "@/components/marketing/footer";
import { SECTION_COMPONENTS } from "@/components/marketing/sections/registry";
import { usePageContent } from "@/lib/site-content";

export default function AboutTriPage() {
  const { ready, sections, content } = usePageContent("about-tri");
  const nav = content("global.nav");
  const footer = content("global.footer");

  if (!ready) return <div className="min-h-screen bg-white" />;

  const body = sections.filter((s) => SECTION_COMPONENTS[s.key]);

  return (
    <div className="bg-white text-ink">
      {nav && <LandingNav content={nav as Parameters<typeof LandingNav>[0]["content"]} />}

      {body.map((s) => {
        const Section = SECTION_COMPONENTS[s.key];
        return <Section key={s.key} content={s.content} />;
      })}

      {footer && (
        <Footer
          content={footer as Parameters<typeof Footer>[0]["content"]}
          crossLink={{ label: "← Back to TLC for Leaders", href: "/" }}
        />
      )}
    </div>
  );
}

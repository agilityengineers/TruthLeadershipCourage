import { Link, useSearch } from "wouter";
import { requireRole } from "@/lib/session";
import { useGetPortalHome, type PortalHomeState } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Anchor } from "@/components/portal/home/anchor";
import { JourneyLine } from "@/components/portal/home/journey-line";
import { NowCardView } from "@/components/portal/home/now-card";
import { LiveItChecklist } from "@/components/portal/home/live-it-checklist";
import { MirrorStrip, WelcomeNote } from "@/components/portal/home/mirror-strip";
import { PartnerRow } from "@/components/portal/home/partner-row";
import { QuietRow } from "@/components/portal/home/quiet-row";
import { SeedOnboarding } from "@/components/portal/home/onboarding";
import { StateToggle } from "@/components/portal/home/state-toggle";
import { WriteReflectionDialog } from "@/components/portal/home/write-reflection";

/**
 * The participant home screen: a mirror, not a scoreboard. One column, one
 * action, the participant's own words on top — every state below derives
 * from the program schedule (see the server's portalState).
 */
export default function PortalHome() {
  requireRole("PARTICIPANT", "ADMIN");
  const search = useSearch();
  const preview = new URLSearchParams(search).get("preview") ?? "";
  const { data: home, isLoading } = useGetPortalHome(preview ? { preview } : undefined);

  if (isLoading) return <></>;

  if (!home) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted">You don't have an active enrollment yet.</p>
        <Button asChild className="mt-4">
          <Link href="/assessment">Start the assessment</Link>
        </Button>
      </Card>
    );
  }

  // The portal's first act is to listen: the two seed questions gate the
  // home screen until they're answered (previews skip the gate).
  if (home.needsOnboarding && !preview) {
    return <SeedOnboarding cohortName={home.cohortName} />;
  }

  if (home.segment === "CLOSED") {
    return <ClosedScreen home={home} preview={preview} />;
  }

  const liveItVisible = home.liveIt && (home.cyclePhase === "LIVE_IT" || home.cyclePhase === "BEFORE_PRACTICE");

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5">
      <StateToggle active={preview} />

      <Anchor home={home} />

      {home.prompts.iAm && (
        <section className="rounded-card border border-dashed border-[#c9c4e8] bg-[#f7f6fd] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] leading-snug text-[#4c4290]">
              From your Module 1 lesson: write your I AM statement. It becomes the first thing you
              see here.
            </p>
            <WriteReflectionDialog
              kind="I_AM"
              title="Your I AM statement"
              description="Present tense. The leader you already are on your best day."
              placeholder="I am a…"
              trigger={
                <Button size="sm" variant="secondary" className="shrink-0">
                  Write it
                </Button>
              }
            />
          </div>
        </section>
      )}

      <JourneyLine journey={home.journey} label={home.journeyLabel} preStart={home.segment === "PRE_START"} />

      {liveItVisible && home.cyclePhase === "BEFORE_PRACTICE" ? (
        <>
          <NowCardView card={home.nowCard} trainerName={home.trainerName} />
          <LiveItChecklist liveIt={home.liveIt!} home={home} />
        </>
      ) : liveItVisible ? (
        <LiveItChecklist liveIt={home.liveIt!} home={home} />
      ) : (
        <NowCardView card={home.nowCard} trainerName={home.trainerName} />
      )}

      {home.segment === "PRE_START" && home.welcomeNote ? (
        <WelcomeNote note={home.welcomeNote} trainerName={home.trainerName} />
      ) : home.mirror ? (
        <MirrorStrip mirror={home.mirror} />
      ) : null}

      <PartnerRow
        partner={home.partner ?? null}
        pending={Boolean(home.partnerPending)}
        canChoose={!home.partner && !home.partnerPending && home.segment !== "PRE_START" && home.segment !== "GRADUATED"}
      />

      <QuietRow />
    </div>
  );
}

/** After the 30-day window the portal closes — the download stays reachable. */
function ClosedScreen({ home, preview }: { home: PortalHomeState; preview: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5">
      <StateToggle active={preview} />
      <Card className="p-8 text-center">
        <div className="label-caps">{home.cohortName}</div>
        <h2 className="mt-2 font-display text-[20px] text-ink">The portal has closed</h2>
        <p className="mx-auto mt-2 max-w-[36ch] text-[13.5px] leading-relaxed text-muted-2">
          Your six months are complete
          {home.portalClosesAt ? ` and the portal closed ${formatDate(home.portalClosesAt)}` : ""}.
          Everything you wrote is still yours to take with you.
        </p>
        <Button asChild className="mt-5">
          <Link href="/portal/keepsake">Download everything you wrote</Link>
        </Button>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useChoosePartner,
  useListPartnerCandidates,
  useSendPartnerNote,
  type PartnerState,
} from "@workspace/api-client-react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

/**
 * Partner presence: warm, small, never a scoreboard. Shows that a partner
 * practiced — never what they wrote — plus one tap to send a note. No
 * streaks, no comparison.
 */
export function PartnerRow({
  partner,
  pending,
  canChoose,
}: {
  partner: PartnerState | null;
  pending: boolean;
  canChoose: boolean;
}) {
  if (partner) {
    return (
      <section className="flex items-center gap-3 rounded-card border border-hair-1 bg-white px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2ece7] text-[12px] font-bold text-[#3c6b57]">
          {initials(partner.name)}
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
          {partner.signal ??
            (partner.checkedInThisWeek
              ? `${partner.name.split(" ")[0]} checked in this week`
              : `${partner.name.split(" ")[0]} hasn't checked in yet this week`)}
        </div>
        <SendNoteDialog partnerName={partner.name} />
      </section>
    );
  }

  if (canChoose) {
    return (
      <section className="flex items-center gap-3 rounded-card border border-hair-1 bg-white px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1f7] text-muted-2">
          <HelpCircle className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-snug text-muted-2">
          Accountability partners are chosen by the first practice session.
        </div>
        <ChoosePartnerDialog />
      </section>
    );
  }

  if (pending) {
    return (
      <section className="flex items-center gap-3 rounded-card border border-hair-1 bg-white px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1f7] text-muted-2">
          <HelpCircle className="h-4.5 w-4.5" />
        </span>
        <div className="text-[13px] leading-snug text-muted-2">
          You'll choose an accountability partner in your first practice session
        </div>
      </section>
    );
  }

  return null;
}

function SendNoteDialog({ partnerName }: { partnerName: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const { mutate, isPending } = useSendPartnerNote();

  function send() {
    const text = body.trim();
    if (!text) return;
    mutate(
      { data: { body: text } },
      {
        onSuccess: () => {
          toast.success(`Note sent to ${partnerName.split(" ")[0]}.`);
          setOpen(false);
          setBody("");
          qc.invalidateQueries();
        },
        onError: () => toast.error("Couldn't send — try again."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="shrink-0 text-[12.5px] font-semibold text-teal hover:underline">
          Send a note
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">
            A note to {partnerName.split(" ")[0]}
          </DialogTitle>
          <DialogDescription>Short and human. It lands in your direct messages.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Saw you lived a practice — nice."
          rows={3}
          autoFocus
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={send} disabled={isPending || !body.trim()}>
            {isPending ? "Sending…" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChoosePartnerDialog() {
  const [open, setOpen] = useState(false);
  const { data: candidates } = useListPartnerCandidates();
  const qc = useQueryClient();
  const { mutate, isPending } = useChoosePartner();

  function choose(enrollmentId: string, name: string) {
    mutate(
      { data: { enrollmentId } },
      {
        onSuccess: () => {
          toast.success(`${name.split(" ")[0]} is your accountability partner.`);
          setOpen(false);
          qc.invalidateQueries();
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn't link you up — try again."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="shrink-0 text-[12.5px] font-semibold text-teal hover:underline">
          Choose your partner
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Choose your accountability partner</DialogTitle>
          <DialogDescription>
            Someone from your cohort. You'll see each other's practice presence — never each
            other's writing.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          {(candidates ?? []).map((c) => (
            <button
              key={c.enrollmentId}
              type="button"
              disabled={isPending}
              onClick={() => choose(c.enrollmentId, c.name)}
              className="flex items-center gap-3 rounded-lg border border-hair-1 bg-white px-3 py-2.5 text-left hover:border-teal"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2ece7] text-[11px] font-bold text-[#3c6b57]">
                {initials(c.name)}
              </span>
              <span className="text-[13.5px] font-medium text-ink">{c.name}</span>
            </button>
          ))}
          {candidates && candidates.length === 0 && (
            <p className="py-2 text-center text-[13px] text-muted-2">
              Everyone in your cohort is already paired — your trainer can help.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

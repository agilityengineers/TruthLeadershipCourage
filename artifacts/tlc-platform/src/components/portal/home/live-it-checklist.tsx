import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCheckLiveItItem,
  useUncheckLiveItItem,
  type LiveItState,
  type LiveItChecklistItem,
  type PortalHomeState,
} from "@workspace/api-client-react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WriteReflectionDialog } from "./write-reflection";

/**
 * The Live It checklist: the workbook's Between Sessions page made live.
 * Checking an item opens a one-line reflection — what did you notice — and
 * the checked state reads "Lived it", never Complete or Done. Unchecked items
 * carry no red and no overdue state; the whole card dissolves after the
 * practice session.
 */
export function LiveItChecklist({ liveIt, home }: { liveIt: LiveItState; home: PortalHomeState }) {
  const anchorLine = home.currentModule?.anchorLine ?? null;
  return (
    <section className="rounded-card border-2 border-teal bg-white p-4">
      <div className="text-[13px] font-semibold text-teal">
        Module {liveIt.moduleOrder} · {liveIt.moduleTitle} — Live It week
      </div>
      {anchorLine && <p className="mt-1 text-[12.5px] text-muted-2">{anchorLine}</p>}
      <ul className="mt-3 flex flex-col gap-1">
        {liveIt.items.map((item) => (
          <LiveItRow key={item.id} item={item} />
        ))}
      </ul>
      {home.prompts.commitment && home.currentModule && (
        <div className="mt-3 border-t border-hair-2 pt-3">
          <WriteReflectionDialog
            kind="COMMITMENT"
            moduleId={home.currentModule.id}
            title="Your commitment"
            description="What did you commit to in the lesson session? One line."
            trigger={
              <button type="button" className="text-[12px] font-medium text-teal hover:underline">
                Add your commitment from the lesson session
              </button>
            }
          />
        </div>
      )}
    </section>
  );
}

function LiveItRow({ item }: { item: LiveItChecklistItem }) {
  const [openNote, setOpenNote] = useState(false);
  const [note, setNote] = useState("");
  const qc = useQueryClient();
  const check = useCheckLiveItItem();
  const uncheck = useUncheckLiveItItem();

  function saveCheck(withNote: boolean) {
    check.mutate(
      { itemId: item.id, data: { note: withNote && note.trim() ? note.trim() : null } },
      {
        onSuccess: () => {
          setOpenNote(false);
          setNote("");
          qc.invalidateQueries();
        },
        onError: () => toast.error("Couldn't save — try again."),
      },
    );
  }

  function undo() {
    uncheck.mutate(
      { itemId: item.id },
      { onSuccess: () => qc.invalidateQueries(), onError: () => toast.error("Couldn't update — try again.") },
    );
  }

  if (item.checked) {
    return (
      <li className="rounded-lg px-1.5 py-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-teal text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] leading-snug text-ink">
              {item.label} <span className="whitespace-nowrap text-[12px] font-semibold text-teal">· Lived it</span>
            </div>
            {item.note && (
              <p className="voice-participant mt-1 text-[13px] leading-relaxed text-[#43407a]">“{item.note}”</p>
            )}
            <button
              type="button"
              onClick={undo}
              disabled={uncheck.isPending}
              className="mt-0.5 text-[11px] text-muted-3 hover:text-ink"
            >
              undo
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg px-1.5 py-2">
      <button type="button" className="flex w-full items-start gap-2.5 text-left" onClick={() => setOpenNote((v) => !v)}>
        <span className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-[#c6cbdb] bg-white" />
        <span className="text-[13.5px] leading-snug text-ink">{item.label}</span>
      </button>
      {openNote && (
        <div className="mt-2 pl-[28px]">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you notice? One line is plenty."
            rows={2}
            maxLength={1000}
            className="voice-participant text-[13.5px] text-[#43407a]"
            autoFocus
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={() => saveCheck(true)} disabled={check.isPending} className="bg-teal hover:bg-teal-hover">
              {check.isPending ? "Saving…" : "Lived it"}
            </Button>
            <button
              type="button"
              onClick={() => saveCheck(false)}
              disabled={check.isPending}
              className="text-[12px] font-medium text-muted-2 hover:text-ink"
            >
              Skip the note
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-3">Only you see this — it feeds your practice session.</p>
        </div>
      )}
    </li>
  );
}

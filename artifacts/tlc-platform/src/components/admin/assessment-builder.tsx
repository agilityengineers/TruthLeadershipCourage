import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAddQuestion, useUpdateQuestion, useDeleteQuestion } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PillarBadge } from "@/components/brand/pillar-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Q = {
  id: string;
  theme: string;
  pillar: "EQ" | "IQ" | "MQ";
  prompt: string;
  benefit: string;
  active: boolean;
};

const PILLARS: Array<"EQ" | "IQ" | "MQ"> = ["EQ", "IQ", "MQ"];
const blank = { id: "", theme: "", pillar: "IQ" as const, prompt: "", benefit: "", active: true };

export function AssessmentBuilder({ questions }: { questions: Q[] }) {
  const qc = useQueryClient();
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const [editing, setEditing] = useState<Q | null>(null);
  const [creating, setCreating] = useState(false);
  const pending =
    addQuestion.isPending || updateQuestion.isPending || deleteQuestion.isPending;

  async function onDelete(id: string) {
    if (!confirm("Delete this question? The live assessment updates immediately.")) return;
    await deleteQuestion.mutateAsync({ id });
    toast.success("Question deleted");
    qc.invalidateQueries();
  }

  return (
    <Card className="p-[22px]">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-display text-[16px] text-ink">{questions.length} questions</h4>
        <Button size="sm" onClick={() => setCreating(true)}>
          + Add question
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="flex items-center gap-3.5 rounded-[11px] border border-hair-2 px-4 py-3"
          >
            <span className="w-[18px] shrink-0 text-center text-[13px] font-semibold text-[#c3c6d4]">
              {i + 1}
            </span>
            <PillarBadge pillar={q.pillar} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">
                {q.theme}{" "}
                {!q.active && <span className="text-[11px] font-normal text-muted-3">(inactive)</span>}
              </div>
              <div className="truncate text-[12.5px] text-muted-2">{q.prompt}</div>
            </div>
            <button
              onClick={() => setEditing(q)}
              className="rounded-[7px] border border-hair-1 px-3 py-2 text-[12px] font-semibold text-ink hover:bg-soft-1"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(q.id)}
              disabled={pending}
              className="rounded-[7px] border border-[#ecd6db] px-3 py-2 text-[12px] font-semibold text-danger hover:bg-[#fff5f7]"
            >
              Delete
            </button>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="py-6 text-center text-[13px] text-muted">
            No questions yet. Add your first one.
          </p>
        )}
      </div>

      {/* Create */}
      <QuestionDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add question"
        initial={blank}
        onSave={async (data) => {
          await addQuestion.mutateAsync({
            data: {
              theme: data.theme,
              pillar: data.pillar,
              prompt: data.prompt,
              benefit: data.benefit,
            },
          });
          setCreating(false);
          toast.success("Question added");
          qc.invalidateQueries();
        }}
        pending={pending}
      />

      {/* Edit */}
      {editing && (
        <QuestionDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          title="Edit question"
          initial={editing}
          showActive
          onSave={async (data) => {
            await updateQuestion.mutateAsync({
              id: editing.id,
              data: {
                theme: data.theme,
                pillar: data.pillar,
                prompt: data.prompt,
                benefit: data.benefit,
                active: data.active,
              },
            });
            setEditing(null);
            toast.success("Question updated");
            qc.invalidateQueries();
          }}
          pending={pending}
        />
      )}
    </Card>
  );
}

function QuestionDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSave,
  pending,
  showActive,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial: Omit<Q, "id"> & { id?: string };
  onSave: (data: { theme: string; pillar: "EQ" | "IQ" | "MQ"; prompt: string; benefit: string; active?: boolean }) => void;
  pending: boolean;
  showActive?: boolean;
}) {
  const [pillar, setPillar] = useState<"EQ" | "IQ" | "MQ">(initial.pillar);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      theme: String(fd.get("theme")),
      pillar,
      prompt: String(fd.get("prompt")),
      benefit: String(fd.get("benefit")),
      active: showActive ? fd.get("active") === "on" : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Maps a theme → pillar (EQ/IQ/MQ) → the benefit mirrored back on the results screen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="theme">Theme</Label>
            <Input id="theme" name="theme" defaultValue={initial.theme} placeholder="e.g. Conflict" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Pillar</Label>
            <div className="flex gap-2">
              {PILLARS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPillar(p)}
                  className={`flex items-center gap-2 rounded-[9px] border-[1.5px] px-3 py-2 text-[13px] font-semibold transition-colors ${
                    pillar === p ? "border-eq bg-[#eaf2fc]" : "border-hair-1 hover:border-[#9bb4d6]"
                  }`}
                >
                  <PillarBadge pillar={p} size="sm" /> {p === "MQ" ? "MQ™" : p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prompt">Question prompt</Label>
            <Textarea id="prompt" name="prompt" defaultValue={initial.prompt} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="benefit">Mirrored benefit (shown on low scores)</Label>
            <Textarea id="benefit" name="benefit" defaultValue={initial.benefit} required />
          </div>
          {showActive && (
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" name="active" defaultChecked={initial.active} /> Active (shown in the
              live assessment)
            </label>
          )}
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

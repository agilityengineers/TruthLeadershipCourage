import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateReflection, type ReflectionKind } from "@workspace/api-client-react";
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

/**
 * Shared capture dialog for structured writing (I AM, Leadership Why, …).
 * Saves are append-only: refining never overwrites, it adds a new version.
 * The textarea itself renders in the participant voice, so their words look
 * like theirs while they type them.
 */
export function WriteReflectionDialog({
  kind,
  title,
  description,
  trigger,
  initialBody = "",
  moduleId,
  promptKey,
  placeholder,
}: {
  kind: ReflectionKind;
  title: string;
  description?: string;
  trigger: React.ReactNode;
  initialBody?: string;
  moduleId?: string | null;
  promptKey?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(initialBody);
  const qc = useQueryClient();
  const { mutate, isPending } = useCreateReflection();

  function save() {
    const text = body.trim();
    if (!text) return;
    mutate(
      { data: { kind, body: text, moduleId: moduleId ?? null, promptKey: promptKey ?? null } },
      {
        onSuccess: () => {
          toast.success("Saved — only you see this.");
          setOpen(false);
          qc.invalidateQueries();
        },
        onError: () => toast.error("Couldn't save just now — try again."),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setBody(initialBody);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder ?? "In your own words…"}
          rows={4}
          maxLength={4000}
          className="voice-participant text-[16px] leading-relaxed text-[#43407a]"
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-3">Only you see what you write here.</span>
          <Button size="sm" onClick={save} disabled={isPending || !body.trim()}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

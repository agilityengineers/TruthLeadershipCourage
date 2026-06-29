import * as React from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { LabelCaps } from "@/components/brand/primitives";
import { createResource, setResourceStatus } from "@/server/trainer-actions";
import type { ResourceStatus, ResourceType } from "@/data/types";

type ResourceRow = {
  id: string;
  title: string;
  type: ResourceType;
  status: ResourceStatus;
  moduleTitle: string | null;
  cohortName: string;
  printReady: boolean;
};

type CohortOpt = { id: string; name: string };
type ModuleOpt = { id: string; title: string; pillar: string; weekNo: number | null };

const TYPE_OPTIONS: ResourceType[] = ["PDF", "MP4", "LINK"];

function typeChip(type: ResourceType, draft: boolean) {
  if (type === "MP4") return { bg: "#f3eefb", fg: "#662d91" };
  if (draft) return { bg: "#fbf3df", fg: "#b8860b" };
  return { bg: "#eef2fb", fg: "#024794" };
}

export function ResourceManager({
  resources,
  cohorts,
  modules,
}: {
  resources: ResourceRow[];
  cohorts: CohortOpt[];
  modules: ModuleOpt[];
}) {
  const [, force] = React.useState(0);
  const bump = () => force((n) => n + 1);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setPending(true);
    try {
      await createResource({
        cohortId: String(form.get("cohortId")),
        title: String(form.get("title")),
        type: String(form.get("type")) as ResourceType,
        moduleId: (form.get("moduleId") as string) || null,
        fileKey: (form.get("fileKey") as string) || null,
        description: (form.get("description") as string) || null,
        printReady: form.get("printReady") === "on",
      });
      setOpen(false);
      toast.success("Resource created");
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus(id: string, current: ResourceStatus) {
    setPending(true);
    try {
      await setResourceStatus(id, current === "PUBLISHED" ? "DRAFT" : "PUBLISHED");
      toast.success("Resource updated");
      bump();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-caps">Resources</div>
          <h2 className="mt-1 font-display text-[24px] text-ink">Cohort resources</h2>
          <p className="mt-1 text-[13px] text-muted-2">
            Worksheets, recordings and links shared with your cohorts.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">
              + Upload resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload resource</DialogTitle>
              <DialogDescription>New resources start as a draft until you publish them.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Worksheet 7 — Conversation Map" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cohortId">Cohort</Label>
                  <select
                    id="cohortId"
                    name="cohortId"
                    required
                    className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3 text-sm text-ink focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue="PDF"
                    className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3 text-sm text-ink focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="moduleId">Module (optional)</Label>
                <select
                  id="moduleId"
                  name="moduleId"
                  defaultValue=""
                  className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3 text-sm text-ink focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                >
                  <option value="">— None —</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.weekNo ? `W${m.weekNo} · ` : ""}
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fileKey">File URL / storage key (optional)</Label>
                <Input id="fileKey" name="fileKey" placeholder="https://… or storage key" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" name="description" placeholder="Short summary" />
              </div>

              <label className="flex items-center gap-2 text-[13px] text-ink">
                <input type="checkbox" name="printReady" className="h-4 w-4 accent-eq" />
                Print-ready
              </label>

              {error && <p className="text-[12.5px] font-medium text-danger">{error}</p>}

              <div className="flex justify-end gap-2.5">
                <DialogClose asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  {pending ? "Saving…" : "Create draft"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-5">
        <LabelCaps className="mb-3.5">All resources</LabelCaps>
        <div className="flex flex-col gap-2.5">
          {resources.map((r) => {
            const draft = r.status === "DRAFT";
            const chip = typeChip(r.type, draft);
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-[10px] border border-hair-2 px-3.5 py-3"
                style={draft ? { background: "#fffdf5" } : undefined}
              >
                <span
                  className="flex h-[30px] w-[34px] items-center justify-center rounded-[7px] text-[11px] font-bold"
                  style={{ background: chip.bg, color: chip.fg }}
                >
                  {r.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">{r.title}</div>
                  <div className="text-[11.5px] text-muted-2">
                    {r.cohortName}
                    {r.moduleTitle ? ` · ${r.moduleTitle}` : ""}
                    {r.printReady ? " · print-ready" : ""}
                  </div>
                </div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: draft ? "#b8860b" : "#1c7d4d" }}
                >
                  {draft ? "Draft" : "Published"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => toggleStatus(r.id, r.status)}
                >
                  {draft ? "Publish" : "Unpublish"}
                </Button>
              </div>
            );
          })}
          {resources.length === 0 && (
            <div className="py-6 text-center text-[13px] text-muted">No resources yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

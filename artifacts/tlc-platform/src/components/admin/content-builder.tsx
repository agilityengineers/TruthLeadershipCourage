import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateSectionContent,
  useSetSectionVisibility,
  useReorderSection,
  useResetSection,
} from "@workspace/api-client-react";
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
} from "@/components/ui/dialog";
import { ImageField, type ImageValue } from "@/components/admin/image-field";

// Field descriptor shape (mirrors @workspace/site-content, delivered as JSON).
type FieldDef =
  | { kind: "text" | "textarea" | "url" | "image" | "link"; name: string; label: string; help?: string }
  | { kind: "list"; name: string; label: string; help?: string; itemLabel: string; item: FieldDef[] };

export type AdminSection = {
  key: string;
  page: string;
  group: string;
  label: string;
  description: string;
  core: boolean;
  order: number;
  visible: boolean;
  fields: FieldDef[];
  content: Record<string, unknown>;
};

const GROUP_ORDER = ["Global", "Home page", "Organizations page", "About Tri page", "Other pages"];

const PAGE_VIEW: Record<string, string> = {
  global: "/",
  home: "/",
  organizations: "/organizations",
  "about-tri": "/about-tri",
  "book-a-call": "/book-a-call",
  login: "/login",
  enroll: "/enroll",
  confirmation: "/enroll/confirmation?status=enrolled",
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function groupBlurb(group: string): string {
  switch (group) {
    case "Global":
      return "Shown on every marketing page. The menu and footer are always visible.";
    case "Home page":
      return "Sections of the main landing page (/). Toggle, reorder, and edit each one.";
    case "Organizations page":
      return "Sections of the “TLC for Organizations” page (/organizations).";
    case "About Tri page":
      return "Sections of Tri’s bio page (/about-tri) — the story, timeline, beliefs, and credentials.";
    case "Other pages":
      return "Copy on the book-a-call, sign-in, enrollment, and confirmation pages.";
    default:
      return "";
  }
}

export function ContentBuilder({ sections }: { sections: AdminSection[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AdminSection | null>(null);

  const update = useUpdateSectionContent();
  const toggle = useSetSectionVisibility();
  const reorder = useReorderSection();
  const reset = useResetSection();
  const pending = update.isPending || toggle.isPending || reorder.isPending || reset.isPending;

  const refresh = () => qc.invalidateQueries();

  async function onToggle(s: AdminSection) {
    if (s.visible && s.core) {
      if (
        !confirm(
          `“${s.label}” is part of your signup funnel. Hiding it removes a primary call-to-action from the live site. Hide it anyway?`,
        )
      )
        return;
    }
    await toggle.mutateAsync({ key: s.key, data: { visible: !s.visible } });
    toast.success(s.visible ? "Section hidden" : "Section shown");
    refresh();
  }

  async function onReorder(s: AdminSection, direction: "up" | "down") {
    await reorder.mutateAsync({ key: s.key, data: { direction } });
    refresh();
  }

  async function onReset(s: AdminSection) {
    if (!confirm(`Reset “${s.label}” to its original content? Your edits to this section will be replaced.`)) return;
    await reset.mutateAsync({ key: s.key });
    toast.success("Reset to original");
    refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {GROUP_ORDER.map((group) => {
        const inGroup = sections
          .filter((s) => s.group === group)
          .sort((a, b) => a.order - b.order);
        if (inGroup.length === 0) return null;

        return (
          <Card key={group} className="p-[22px]">
            <h3 className="mb-1 font-display text-[17px] text-ink">{group}</h3>
            <p className="mb-4 text-[12.5px] text-muted-2">{groupBlurb(group)}</p>
            <div className="flex flex-col gap-2.5">
              {inGroup.map((s, i) => {
                const canToggle = s.page !== "global"; // nav/footer are structural
                const samePageCount = inGroup.filter((x) => x.page === s.page).length;
                const canReorder = samePageCount > 1;
                return (
                  <div
                    key={s.key}
                    className="flex flex-wrap items-center gap-3 rounded-[11px] border border-hair-2 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{s.label}</span>
                        {s.core && (
                          <span className="rounded-[5px] bg-[#fff4e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#b3651b]">
                            Funnel
                          </span>
                        )}
                        {!s.visible && <span className="text-[11px] font-normal text-muted-3">(hidden)</span>}
                      </div>
                      <div className="truncate text-[12px] text-muted-2">{s.description}</div>
                    </div>

                    {canReorder && (
                      <div className="flex items-center gap-1">
                        <button
                          aria-label="Move up"
                          disabled={pending || i === 0}
                          onClick={() => onReorder(s, "up")}
                          className="rounded-[6px] border border-hair-1 px-2 py-1 text-[12px] text-ink disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          aria-label="Move down"
                          disabled={pending || i === inGroup.length - 1}
                          onClick={() => onReorder(s, "down")}
                          className="rounded-[6px] border border-hair-1 px-2 py-1 text-[12px] text-ink disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}

                    {canToggle ? (
                      <button
                        onClick={() => onToggle(s)}
                        disabled={pending}
                        className={`flex h-7 w-[52px] items-center rounded-full px-1 transition-colors ${
                          s.visible ? "justify-end bg-eq" : "justify-start bg-[#d3d7e2]"
                        }`}
                        aria-label={s.visible ? "Shown — click to hide" : "Hidden — click to show"}
                        title={s.visible ? "Shown" : "Hidden"}
                      >
                        <span className="h-5 w-5 rounded-full bg-white shadow" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-3">Always shown</span>
                    )}

                    <button
                      onClick={() => setEditing(s)}
                      className="rounded-[7px] border border-hair-1 px-3 py-2 text-[12px] font-semibold text-ink hover:bg-soft-1"
                    >
                      Edit
                    </button>
                    <a
                      href={PAGE_VIEW[s.page] ?? "/"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-semibold text-eq hover:underline"
                    >
                      View ↗
                    </a>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {editing && (
        <SectionDialog
          section={editing}
          pending={update.isPending}
          onReset={() => onReset(editing)}
          onClose={() => setEditing(null)}
          onSave={async (value) => {
            try {
              await update.mutateAsync({ key: editing.key, data: { content: value } });
              setEditing(null);
              toast.success("Saved");
              refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not save");
            }
          }}
        />
      )}
    </div>
  );
}

function SectionDialog({
  section,
  onSave,
  onClose,
  onReset,
  pending,
}: {
  section: AdminSection;
  onSave: (value: Record<string, unknown>) => void;
  onClose: () => void;
  onReset: () => void;
  pending: boolean;
}) {
  const [value, setValue] = useState<Record<string, unknown>>(() => clone(section.content));

  function setField(name: string, v: unknown) {
    setValue((prev) => ({ ...prev, [name]: v }));
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit · {section.label}</DialogTitle>
          <DialogDescription>{section.description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(value);
          }}
          className="flex flex-col gap-4"
        >
          {section.fields.map((field) => (
            <FieldEditor
              key={field.name}
              field={field}
              value={value[field.name]}
              onChange={(v) => setField(field.name, v)}
            />
          ))}
          <div className="flex items-center justify-between gap-2.5 border-t border-hair-2 pt-4">
            <button
              type="button"
              onClick={onReset}
              className="text-[12px] font-semibold text-muted-2 hover:text-danger"
            >
              Reset to original
            </button>
            <div className="flex gap-2.5">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
    case "url":
      return (
        <div className="flex flex-col gap-1.5">
          <Label>{field.label}</Label>
          {field.help && <p className="text-[11.5px] text-muted-2">{field.help}</p>}
          <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "textarea":
      return (
        <div className="flex flex-col gap-1.5">
          <Label>{field.label}</Label>
          {field.help && <p className="text-[11.5px] text-muted-2">{field.help}</p>}
          <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} />
        </div>
      );
    case "image":
      return (
        <ImageField
          label={field.label}
          help={field.help}
          value={(value as ImageValue) ?? { src: "", alt: "" }}
          onChange={(v) => onChange(v)}
        />
      );
    case "link": {
      const v = (value as { label: string; href: string }) ?? { label: "", href: "" };
      return (
        <div className="flex flex-col gap-1.5 rounded-[11px] border border-hair-2 p-3">
          <Label>{field.label}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input value={v.label} placeholder="Button text" onChange={(e) => onChange({ ...v, label: e.target.value })} />
            <Input
              value={v.href}
              placeholder="Link (/path or https://…)"
              onChange={(e) => onChange({ ...v, href: e.target.value })}
            />
          </div>
        </div>
      );
    }
    case "list":
      return <ListEditor field={field} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} />;
  }
}

function ListEditor({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { kind: "list" }>;
  value: Record<string, unknown>[];
  onChange: (v: unknown) => void;
}) {
  function emptyItem(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const f of field.item) {
      if (f.kind === "image") obj[f.name] = { src: "", alt: "" };
      else if (f.kind === "link") obj[f.name] = { label: "", href: "" };
      else obj[f.name] = "";
    }
    return obj;
  }
  function setItem(i: number, item: Record<string, unknown>) {
    const next = value.slice();
    next[i] = item;
    onChange(next);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2 rounded-[11px] border border-hair-2 p-3">
      <Label>{field.label}</Label>
      {field.help && <p className="text-[11.5px] text-muted-2">{field.help}</p>}
      <div className="flex flex-col gap-3">
        {value.map((item, i) => (
          <div key={i} className="rounded-[9px] border border-hair-1 bg-soft-1 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-3">
                {field.itemLabel} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-[6px] border border-hair-1 bg-white px-2 py-0.5 text-[12px] disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="rounded-[6px] border border-hair-1 bg-white px-2 py-0.5 text-[12px] disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  className="rounded-[6px] border border-[#ecd6db] bg-white px-2 py-0.5 text-[12px] font-semibold text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {field.item.map((sub) => (
                <FieldEditor
                  key={sub.name}
                  field={sub}
                  value={item[sub.name]}
                  onChange={(v) => setItem(i, { ...item, [sub.name]: v })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyItem()])}>
          + Add {field.itemLabel}
        </Button>
      </div>
    </div>
  );
}

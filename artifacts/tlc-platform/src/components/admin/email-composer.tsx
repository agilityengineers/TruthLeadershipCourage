import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSendCampaign } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LabelCaps } from "@/components/brand/primitives";

type Opt = { id: string; name: string };
type Template = { id: string; name: string; subject: string; html: string };

export function EmailComposer({
  cohorts,
  companies,
  templates,
  trainerMode = false,
}: {
  cohorts: Opt[];
  companies: Opt[];
  templates: Template[];
  trainerMode?: boolean;
}) {
  const qc = useQueryClient();
  const sendCampaign = useSendCampaign();
  const [segType, setSegType] = useState<"cohort" | "company" | "individual" | "all">("cohort");
  const [segId, setSegId] = useState(cohorts[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const pending = sendCampaign.isPending;

  const segOptions = segType === "cohort" ? cohorts : segType === "company" ? companies : [];

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setSubject(t.subject);
      setHtml(t.html);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await sendCampaign.mutateAsync({
      data: {
        subject,
        html,
        templateId: templateId || undefined,
        segment: {
          type: segType,
          ids: segType === "all" ? [] : [segId].filter(Boolean),
        },
      },
    });
    if (!res.ok) return setMsg(res.error ?? null);
    setMsg(`Sent to ${res.recipients} recipient${res.recipients === 1 ? "" : "s"}.`);
    setSubject("");
    setHtml("");
    qc.invalidateQueries();
  }

  const types: Array<typeof segType> = trainerMode ? ["cohort"] : ["cohort", "company", "individual", "all"];

  return (
    <Card className="p-6">
      <LabelCaps className="mb-1">Email broadcast</LabelCaps>
      <h3 className="mb-4 font-display text-[18px] text-ink">Compose &amp; send</h3>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Segmentation */}
        <div className="flex flex-col gap-2">
          <Label>Audience</Label>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSegType(t)}
                className={`rounded-pill px-3.5 py-1.5 text-[12.5px] font-semibold capitalize transition-colors ${
                  segType === t ? "bg-eq text-white" : "border border-hair-1 text-muted hover:border-eq"
                }`}
              >
                {t === "all" ? "All participants" : t}
              </button>
            ))}
          </div>
        </div>

        {segOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="segId">{segType === "cohort" ? "Cohort" : "Company"}</Label>
            <select
              id="segId"
              value={segId}
              onChange={(e) => setSegId(e.target.value)}
              className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm"
            >
              {segOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {templates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl">Start from a template (optional)</Label>
            <select
              id="tpl"
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm"
            >
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="html">Message (HTML or text)</Label>
          <Textarea
            id="html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="min-h-[160px]"
            required
          />
          <p className="text-[11.5px] text-muted-3">
            Supports {"{{firstName}}"}, {"{{cohortName}}"} placeholders.
          </p>
        </div>

        {msg && <p className="text-[13px] font-medium text-eq">{msg}</p>}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send broadcast"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

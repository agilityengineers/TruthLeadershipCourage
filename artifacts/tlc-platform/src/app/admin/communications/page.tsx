import { requireRole } from "@/lib/session";
import { useGetCommunications } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LabelCaps } from "@/components/brand/primitives";
import { EmailComposer } from "@/components/admin/email-composer";
import { formatDate } from "@/lib/utils";

export default function CommunicationsPage() {
  requireRole("ADMIN");
  const { data } = useGetCommunications();
  if (!data) return <></>;
  const cohorts = data.cohorts;
  const companies = data.companies;
  const templates = data.templates;
  const campaigns = data.campaigns;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Communications</h2>
        <p className="text-[13px] text-muted-2">
          SendGrid broadcasts segmented by cohort, company, or individual — plus reusable templates.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <EmailComposer
          cohorts={cohorts}
          companies={companies}
          templates={templates.map((t) => ({ id: t.id, name: t.name, subject: t.subject, html: t.html }))}
        />

        <div className="flex flex-col gap-[18px]">
          <Card className="p-5">
            <LabelCaps className="mb-3.5">Recent broadcasts</LabelCaps>
            <div className="flex flex-col gap-3">
              {campaigns.map((c) => (
                <div key={c.id} className="border-b border-hair-3 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink">{c.subject}</span>
                    <Badge variant={c.status === "sent" ? "success" : c.status === "failed" ? "danger" : "warning"} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11.5px] text-muted-2">
                    {c.recipients} recipients · {formatDate(c.createdAt)}
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <p className="text-[13px] text-muted">No broadcasts yet.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <LabelCaps className="mb-3.5">Templates</LabelCaps>
            <div className="flex flex-col gap-2">
              {templates.map((t) => (
                <div key={t.id} className="rounded-[10px] border border-hair-2 px-3.5 py-2.5">
                  <div className="text-[13px] font-semibold text-ink">{t.name}</div>
                  <div className="truncate text-[11.5px] text-muted-2">{t.subject}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

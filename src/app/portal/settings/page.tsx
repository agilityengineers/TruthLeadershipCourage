import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { AccountActions } from "@/components/portal/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account & privacy" };

export default async function SettingsPage() {
  const principal = await requireRole("PARTICIPANT", "ADMIN");
  const user = await db.user.findUnique({
    where: { id: principal.id },
    include: { consents: { orderBy: { createdAt: "desc" } } },
  });

  const marketing = user?.consents.find((c) => c.type === "marketing");
  const marketingGranted = marketing ? Boolean(marketing.grantedAt && !marketing.revokedAt) : false;

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-5">
      <Card className="p-6">
        <LabelCaps className="mb-3">Your account</LabelCaps>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[14px]">
          <dt className="text-muted-2">Name</dt>
          <dd className="text-ink">{user?.name}</dd>
          <dt className="text-muted-2">Email</dt>
          <dd className="text-ink">{user?.email}</dd>
          <dt className="text-muted-2">Status</dt>
          <dd className="text-ink capitalize">{user?.status?.replace("_", " ")}</dd>
        </dl>
      </Card>

      <Card className="p-6">
        <LabelCaps className="mb-2">Privacy &amp; data (GDPR)</LabelCaps>
        <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
          You control your data. Download everything we hold about you, manage marketing consent, or
          request erasure of your account.
        </p>
        <div className="mb-4">
          <Button asChild variant="outline">
            <a href="/api/me/export">Download my data (JSON)</a>
          </Button>
        </div>
        <AccountActions
          marketingGranted={marketingGranted}
          deletionRequested={user?.status === "deletion_requested"}
        />
      </Card>
    </div>
  );
}

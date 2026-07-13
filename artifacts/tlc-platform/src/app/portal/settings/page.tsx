import { Link } from "wouter";
import { requireRole } from "@/lib/session";
import { useGetAccountSettings } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { AccountActions } from "@/components/portal/account-actions";

export default function SettingsPage() {
  requireRole("PARTICIPANT", "ADMIN");
  const { data } = useGetAccountSettings();
  const user = data?.user;
  const marketingGranted = data?.marketingGranted ?? false;
  const deletionRequested = data?.deletionRequested ?? false;

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
        <LabelCaps className="mb-2">Everything you wrote</LabelCaps>
        <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
          Your reflections, every version of your I AM, your commitments and noticings — bundled to
          read, print, or download. Offered at graduation and available until the portal closes.
        </p>
        <Button asChild variant="outline">
          <Link href="/portal/keepsake">Open your record</Link>
        </Button>
      </Card>

      <Card className="p-6">
        <LabelCaps className="mb-2">Privacy &amp; data (GDPR)</LabelCaps>
        <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
          You control your data. Download everything we hold about you, manage marketing consent, or
          request erasure of your account.
        </p>
        <div className="mb-4">
          <Button asChild variant="outline">
            <a href="/api/account/export">Download my data (JSON)</a>
          </Button>
        </div>
        <AccountActions
          marketingGranted={marketingGranted}
          deletionRequested={deletionRequested}
        />
      </Card>
    </div>
  );
}

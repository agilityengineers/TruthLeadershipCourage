import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useIssueCertificate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

/** Trainer/admin control to issue a completion certificate for a finished enrollment. */
export function IssueCertificateButton({ enrollmentId }: { enrollmentId: string }) {
  const qc = useQueryClient();
  const issueCertificate = useIssueCertificate();
  const [error, setError] = useState<string | null>(null);
  const pending = issueCertificate.isPending;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        disabled={pending}
        onClick={async () => {
          setError(null);
          const res = await issueCertificate.mutateAsync({ id: enrollmentId });
          if (!res.ok) {
            setError(res.error ?? "Something went wrong");
            return;
          }
          toast.success(res.serial ? `Certificate issued · ${res.serial}` : "Certificate issued");
          qc.invalidateQueries();
        }}
      >
        {pending ? "Issuing…" : "Issue certificate"}
      </Button>
      {error && (
        <p role="alert" className="text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

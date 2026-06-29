import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { issueCertificateForEnrollment } from "@/server/trainer-actions";

/** Trainer/admin control to issue a completion certificate for a finished enrollment. */
export function IssueCertificateButton({ enrollmentId }: { enrollmentId: string }) {
  const [, force] = useState(0);
  const bump = () => force((n) => n + 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await issueCertificateForEnrollment(enrollmentId);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            toast.success("Certificate issued");
            bump();
          })
        }
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
